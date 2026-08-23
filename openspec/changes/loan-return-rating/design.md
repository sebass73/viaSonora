# Design: Bilateral Loan Return Confirmation, Bidirectional Rating, Public User Profile

## Technical Approach

Follows the proposal's four decisions unchanged: two nullable timestamps on `Request`, transactional auto-completion inside `app/api/requests/[id]/route.ts`, a dedicated `Review` model, on-read aggregates. No new libraries, no caching layer, no middleware. New endpoints mirror `app/api/reports/route.ts` (Zod parse → existence check → permission check → write). New UI mirrors `PostDetail.tsx`: server page shell + client component fetching its own API.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Confirmation state | `ownerReturnConfirmedAt` / `clientReturnConfirmedAt` on `Request` | Join table | Schema has no 1:1 join tables; single-row read |
| Race safety | Two guarded `updateMany` inside `prisma.$transaction` | `SELECT FOR UPDATE`; `Serializable` | No raw-SQL precedent; Serializable needs a retry loop. Postgres re-evaluates an `UPDATE ... WHERE` after lock acquisition, and each statement in READ COMMITTED takes a fresh snapshot, so the second committer always observes both timestamps |
| Role attribution | `subjectId` + `subjectRole` stored on `Review` | Derive per query via `where: { request: { ownerId } }` | Index-backed `groupBy` with no relation subquery; the role is an immutable fact of the review, not a cached counter |
| PUT body | `z.union([confirmReturnSchema, updateRequestStatusSchema])` | Extra field on the existing object | Keeps the current `{ status }` contract byte-compatible for existing callers |
| Re-confirm | Idempotent 200 with current state | 400 "already confirmed" | Double-click and retry safe; nothing to report as an error |
| Legacy `COMPLETED` requests | Rateable (gate is `status === 'COMPLETED'`, not the timestamps) | Require both timestamps | No backfill, no extra flag; accepted consequence recorded in Migration |
| Public location fields | `city`, `state`, `country` only | `locationText`, `lat`, `lng`, `email`, `phone`, `whatsappUrl` | `city` is already public on posts; `locationText` and coordinates are gated behind `showContact` today and stay gated |

## Prisma Schema

```prisma
enum ReviewSubjectRole {
  LENDER    // rated while acting as Request.owner
  RETURNER  // rated while acting as Request.client
}

model Request {
  // ...existing fields
  ownerReturnConfirmedAt  DateTime?
  clientReturnConfirmedAt DateTime?
  reviews                 Review[]
}

model Review {
  id          String            @id @default(cuid())
  requestId   String
  authorId    String
  subjectId   String
  subjectRole ReviewSubjectRole
  rating      Int
  comment     String?           @db.Text
  reply       String?           @db.Text // single public reply, authored only by subject
  repliedAt   DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  request Request @relation(fields: [requestId], references: [id], onDelete: Cascade)
  author  User    @relation("ReviewAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  subject User    @relation("ReviewSubject", fields: [subjectId], references: [id], onDelete: Cascade)

  @@unique([requestId, authorId]) // one review per author per loan
  @@index([subjectId, subjectRole])
  @@index([requestId])
  @@index([authorId])
}

model User {
  // ...existing relations
  reviewsAuthored Review[] @relation("ReviewAuthor")
  reviewsReceived Review[] @relation("ReviewSubject")
}
```

`rating` stays `Int` with the 1-5 range enforced in Zod (no DB check constraint; Prisma cannot express one declaratively and the schema has no precedent for raw SQL migrations).

## Validation (`lib/validation.ts`)

```ts
export const confirmReturnSchema = z.object({ action: z.literal('CONFIRM_RETURN') });
// COMPLETED removed: no manual completion path remains
export const updateRequestStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'CANCELLED']),
});
export const updateRequestBodySchema = z.union([confirmReturnSchema, updateRequestStatusSchema]);

export const createReviewSchema = z.object({
  requestId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export const replyReviewSchema = z.object({ reply: z.string().min(1).max(1000) });
```

## API Contract

| Endpoint | Action | Auth | Notes |
|---|---|---|---|
| `PUT /api/requests/[id]` | Modify | owner or client | `{ action: 'CONFIRM_RETURN' }` branch added; `{ status }` branch loses `COMPLETED` |
| `POST /api/reviews` | New | owner or client of a `COMPLETED` request | `{ requestId, rating, comment? }` |
| `PATCH /api/reviews/[id]` | New | review `subjectId` only | `{ reply }`, once |
| `GET /api/users/[id]/profile` | New | **public, no session** | aggregates + reviews |
| `GET /api/requests` | Modify | unchanged | `include` gains `reviews: { select: { id: true, authorId: true } }`; the two timestamps arrive as scalars automatically |

`POST /api/reviews` derives the target: caller is client → `subjectId = ownerId`, `subjectRole = LENDER`; caller is owner → `subjectId = clientId`, `subjectRole = RETURNER`. Errors: 401 no session, 404 request, 403 not a party, 400 status not `COMPLETED`, 409 duplicate (pre-check `findUnique` on `requestId_authorId` plus a `P2002` catch, since the pre-check alone races).

`PATCH /api/reviews/[id]`: 403 unless `session.user.id === review.subjectId` (the author can never reply to their own review), 409 if `reply !== null`. Sets `reply` + `repliedAt`. No endpoint edits or deletes `rating`/`comment` — immutability is enforced by the absence of a route, not by a flag.

`GET /api/users/[id]/profile` response:

```ts
{
  user: { id, name, lastName, image, city, state, country, memberSince },
  ratings: {
    // completedLoans is present on every bucket, including overall, so the
    // frontend never has to add the two role counters to classify overall
    overall:    { average: number | null, reviewCount: number, completedLoans: number },
    asLender:   { average: number | null, reviewCount: number, completedLoans: number },
    asReturner: { average: number | null, reviewCount: number, completedLoans: number },
  },
  reviews: Array<{
    id, rating, comment, createdAt, subjectRole, reply, repliedAt,
    author: { id, name, lastName, image },
  }>,
}
```

`average` is `null`, never `0`, whenever `reviewCount === 0`. 404 when the user does not exist.

`completedLoans` and `reviewCount` are independent counters, because rating is optional and non-blocking: a role can have completed loans that nobody rated. Every bucket therefore carries all three fields, and the frontend classifies each role into exactly one of three presentation states:

| State | Condition | Presentation |
|---|---|---|
| No activity in this role | `completedLoans === 0` | Explicit empty state ("No completed loans yet as a lender"). No numeric average, no stars |
| Completed but unrated | `completedLoans > 0 && reviewCount === 0` | Its own copy ("N completed loans, no ratings yet"), showing `completedLoans`. No numeric average, no stars — an unrated role must not read as a bad reputation any more than an inactive one |
| Rated | `reviewCount > 0` | `average` with stars, `reviewCount`, and `completedLoans` |

`average === null` alone MUST NOT drive the empty state: it collapses the first two rows and would claim "no completed loans yet" for a user who has completed loans that simply were not rated. The deciding field for the empty state is `completedLoans`.

## Auto-Completion Flow

```
Client PUT {action:CONFIRM_RETURN}      Owner PUT {action:CONFIRM_RETURN}
        │                                        │
        ├─ auth + party check (403)              ├─ auth + party check
        ├─ status must be ACCEPTED (400)         ├─ status must be ACCEPTED
        v                                        v
  prisma.$transaction ─────────────────────────────────────────────
    1. updateMany where {id, status:'ACCEPTED', <myField>: null}
                    data  {<myField>: now}          → 0 rows = idempotent no-op
    2. updateMany where {id, status:'ACCEPTED',
                         ownerReturnConfirmedAt:  {not: null},
                         clientReturnConfirmedAt: {not: null}}
                    data  {status: 'COMPLETED'}     → 1 row only for the 2nd confirmer
  ──────────────────────────────────────────────────────────────────
        v
  findUnique with today's include shape → 200 (status + both timestamps)
```

`<myField>` is `ownerReturnConfirmedAt` when `isOwner`, `clientReturnConfirmedAt` when `isClient`. Statement 2 never runs a status write for the first confirmer, and never depends on the caller's stale read. The terminal-state guard at `route.ts:135` stays ahead of both branches, so nothing reopens `COMPLETED|CANCELLED|DECLINED`.

## Aggregate Computation (on read)

```ts
const [byRole, overall, lenderLoans, returnerLoans, reviews] = await prisma.$transaction([
  prisma.review.groupBy({
    by: ['subjectRole'], where: { subjectId: id },
    _avg: { rating: true }, _count: { _all: true },
  }),
  prisma.review.aggregate({ where: { subjectId: id }, _avg: { rating: true }, _count: { _all: true } }),
  prisma.request.count({ where: { ownerId: id, status: 'COMPLETED' } }),
  prisma.request.count({ where: { clientId: id, status: 'COMPLETED' } }),
  prisma.review.findMany({
    where: { subjectId: id }, orderBy: { createdAt: 'desc' }, take: 50,
    include: { author: { select: { id: true, name: true, lastName: true, image: true } } },
  }),
]);
```

One `groupBy` covers both role averages (backed by `@@index([subjectId, subjectRole])`); a missing row means that role received no reviews, which maps to `average: null` and `reviewCount: 0` but says nothing about `completedLoans`. `overall` comes from its own `aggregate` rather than a JS weighted mean, to avoid float drift; `overall.completedLoans` is `lenderLoans + returnerLoans`, safe to sum because `Request.ownerId` and `Request.clientId` are different users on the same row, so no loan is counted twice.

The loan counters are the reason the two `request.count` queries exist at all: they come from `Request`, not `Review`, precisely because a completed loan may carry no review, and `completedLoans` — not `reviewCount` — is what decides the empty state. `take: 50` newest-first; pagination deferred.

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Two `Request` columns, `Review`, `ReviewSubjectRole`, two `User` relations |
| `prisma/migrations/*_add_return_confirmation_and_reviews/` | Create | Additive migration |
| `lib/validation.ts` | Modify | Schemas above |
| `app/api/requests/[id]/route.ts` | Modify | Confirm branch + transaction; drop `ACCEPTED→COMPLETED` |
| `app/api/requests/route.ts` | Modify | Include `reviews: { id, authorId }` in the list |
| `app/api/reviews/route.ts` | Create | `POST` create review |
| `app/api/reviews/[id]/route.ts` | Create | `PATCH` reply |
| `app/api/users/[id]/profile/route.ts` | Create | Public `GET` aggregates + reviews |
| `app/[locale]/users/[id]/page.tsx` | Create | Server shell rendering `UserProfileView` |
| `components/users/UserProfileView.tsx` | Create | Client container: fetch, loading, 404 |
| `components/users/RatingSummary.tsx` | Create | Three breakdown cards, each resolving the three-state rule (no activity / completed-but-unrated / rated) from `completedLoans` and `reviewCount` |
| `components/users/ReviewList.tsx` | Create | List + `ReviewItem` (stars, comment, author link, reply block, reply form when viewer is subject and `reply === null`) |
| `components/ui/StarRating.tsx` | Create | Read-only star display |
| `components/reviews/StarRatingInput.tsx` | Create | Interactive 1-5 input |
| `components/reviews/ReviewDialog.tsx` | Create | Dismissible rating dialog → `POST /api/reviews` |
| `components/requests/RequestCard.tsx` | Modify | Remove `canComplete`/`markCompleted`; add `canConfirmReturn` (party, `ACCEPTED`, own timestamp null), both-sides pending/confirmed indicator, `canReview` (`COMPLETED` and no own review), other-party name wrapped in `Link href={`/users/${id}`}`; props gain `onConfirmReturn`, interface gains both timestamps + `reviews` |
| `components/requests/RequestList.tsx` | Modify | `handleConfirmReturn` PUTs `{ action: 'CONFIRM_RETURN' }`, then `fetchRequests()` |
| `components/posts/PostDetail.tsx` | Modify | Owner photo+name (lines 270-286) wrapped in a profile `Link`; `showContact` gating untouched |
| `messages/{es,en,it,de,fr}.json` | Modify | Confirmation, rating, profile copy, plus two distinct per-role strings: the no-completed-loans empty state and the completed-but-unrated state |
| `tests/api/requests-id.test.ts` | Create | Regression + new behavior (see below) |
| `tests/api/reviews.test.ts` | Create | Create/reply coverage |
| `tests/api/users-profile.test.ts` | Create | Aggregates + privacy assertions |
| `TAREAS_PENDIENTES.md` | Modify | Mark line 407 done |

## Testing Strategy

`app/api/requests/[id]/route.ts` has zero coverage, so strict TDD splits into a regression net first, then the new behavior.

| Layer | What | Approach |
|---|---|---|
| Unit (RED first, before editing the route) | Current PUT: 401, 404, 403 non-party, 400 terminal state, owner `REQUESTED→ACCEPTED\|DECLINED`, client `→CANCELLED`, disallowed transitions | `tests/api/requests-id.test.ts`, `vi.mock('@/auth')` + `vi.mock('@/lib/prisma')` as in `tests/api/posts.test.ts` |
| Unit | New PUT: `{status:'COMPLETED'}` now 400; confirm sets only the caller's column and leaves `ACCEPTED`; second confirm reaches `COMPLETED`; re-confirm idempotent 200; confirm when not `ACCEPTED` → 400; non-party → 403 | Prisma mock gains `request.updateMany` and `$transaction: vi.fn(async (fn) => fn(txMock))`; assert both `updateMany` WHERE guards (`<myField>: null`, and `{not: null}` on both) — the guard shape is the unit-level proxy for race safety, which is a Postgres locking property and is documented, not mock-tested |
| Unit | `POST /api/reviews`: 401, 400 rating 0/6/non-int, 404, 403 non-party, 400 not `COMPLETED`, 409 pre-check duplicate, 409 on `P2002`, correct `subjectId`/`subjectRole` in both directions | `tests/api/reviews.test.ts` |
| Unit | `PATCH /api/reviews/[id]`: 401, 403 non-subject (author replying to own review), 409 reply exists, 200 sets `reply` + `repliedAt` | same file |
| Unit | `GET /api/users/[id]/profile`: 200 with no session, role split from `groupBy` rows, 404 unknown user, and an explicit assertion that the payload has no `email`/`phone`/`whatsappUrl`/`lat`/`lng`/`locationText` | `tests/api/users-profile.test.ts`, `auth` mocked to `null` |
| Unit | Each of the three states is a separate case, since `completedLoans` and `reviewCount` diverge: (a) `completedLoans: 0, reviewCount: 0, average: null`; (b) `completedLoans: 3, reviewCount: 0, average: null` — the regression this validation caught, and the payload must still report `completedLoans: 3`; (c) `completedLoans: 3, reviewCount: 2, average: 4.5`. `average` is never `0` in any of them | same file |
| Integration | Migration applies and the new endpoints work against a real DB | Manual `prisma migrate dev` + `npm run build` |
| UI | No component-test infrastructure exists | `npm run lint` + `npx tsc --noEmit`; manual pass over both confirm orders, dismissal, and the profile page while logged out |

Gate: `npm run test`, `npm run lint`, `npx tsc --noEmit`.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The one privacy boundary (the new public profile surface) is covered by an explicit field-absence test above.

## Migration / Rollout

Single additive migration: `npx prisma migrate dev --name add_return_confirmation_and_reviews`. It creates the `ReviewSubjectRole` type, the `Review` table with its FKs and indexes, and adds two nullable columns with no default. No existing column is altered or dropped, so no backfill runs and no existing row changes value. Requests already in `COMPLETED|CANCELLED|DECLINED` keep their status with `NULL` confirmations and stay blocked by the terminal-state guard. Consequence accepted by design: pre-existing `COMPLETED` loans become rateable, because the rating gate is `status === 'COMPLETED'` and not the presence of both timestamps. Deploy order: migration, then code. Rollback: revert app commits (UI falls back to nothing until the migration is also reverted, since the manual complete button is gone), then a down migration dropping the table, the enum, and the two columns.

## Open Questions

- [ ] None blocking. Deferred, non-blocking: review-list pagination on the profile (fixed `take: 50` for now) and a DB-level check constraint for `rating` between 1 and 5 (Zod-only today).
