# Tasks: Bilateral Loan Return Confirmation, Bidirectional Rating, Public User Profile

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750-950 (schema+migration ~90, route.ts ~80, validation ~25, 3 new API routes ~220, tests ~300, UI+page+components ~250, i18n ~60, docs ~5) |
| 400-line budget risk | High |
| Chained PRs recommended | No (user-accepted exception) |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

Decision needed before apply resolves to requiring `size:exception` maintainer approval before `sdd-apply`, per `single-pr` strategy — user already accepted no line budget/no chaining for this change.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Full change (schema, confirmation, rating, profile, UI, i18n) | PR 1 (size:exception) | `npm run test -- tests/api` | `npx prisma migrate dev` + manual pass (both confirm orders, dismissal, logged-out profile) | Revert app commits; down-migration drops `Review` table + 2 `Request` columns (additive, no data loss) |

## Phase 1: Schema and Migration

- [x] 1.1 Add `ownerReturnConfirmedAt`/`clientReturnConfirmedAt` (`DateTime?`) to `Request`, add `Review` model + `ReviewSubjectRole` enum + `User.reviewsAuthored`/`reviewsReceived` relations in `prisma/schema.prisma`, per design's Prisma block. Deps: none.
- [x] 1.2 Run `npx prisma migrate dev --name add_return_confirmation_and_reviews`; verify additive-only diff (no altered/dropped columns). Deps: 1.1.

## Phase 2: RED — Regression Tests for `route.ts` (write BEFORE touching the route)

- [x] 2.1 Create `tests/api/requests-id.test.ts` covering current PUT behavior: 401, 404, 403 non-party, 400 terminal state, owner `REQUESTED→ACCEPTED|DECLINED`, client `→CANCELLED`, disallowed transitions. Mock `@/auth` + `@/lib/prisma` as `tests/api/posts.test.ts`. Run and confirm GREEN against current `route.ts` (regression net, not new behavior). Deps: none (parallel with Phase 1).

## Phase 3: Return Confirmation (RED → GREEN)

- [x] 3.1 Add `confirmReturnSchema` (`{action: 'CONFIRM_RETURN'}`), redefine `updateRequestStatusSchema` (drop `COMPLETED`), add `updateRequestBodySchema` union in `lib/validation.ts`. Deps: 1.1.
- [x] 3.2 (RED) Extend `tests/api/requests-id.test.ts`: `{status:'COMPLETED'}` now 400; confirm sets only caller's column, stays `ACCEPTED`; second confirm reaches `COMPLETED`; re-confirm idempotent 200; confirm when not `ACCEPTED` → 400; non-party → 403. Add `request.updateMany` + `$transaction: vi.fn(async (fn) => fn(txMock))` to the prisma mock; assert both `updateMany` WHERE guards. Deps: 3.1.
- [x] 3.3 (GREEN) Implement `PUT app/api/requests/[id]/route.ts`: parse with `updateRequestBodySchema`; branch on `action === 'CONFIRM_RETURN'`; two guarded `updateMany` inside `prisma.$transaction` (own-field-null guard, then both-not-null→`COMPLETED` guard) per design's Auto-Completion Flow; keep terminal-state guard ahead of both branches; drop `ACCEPTED→COMPLETED` from the status branch. Deps: 3.2.
- [x] 3.4 Modify `app/api/requests/route.ts` GET `include` to add `reviews: { select: { id: true, authorId: true } }`. Deps: 3.3.

## Phase 4: Rating (RED → GREEN)

- [x] 4.1 Add `createReviewSchema`/`replyReviewSchema` to `lib/validation.ts`. Deps: 1.1.
- [x] 4.2 (RED) Create `tests/api/reviews.test.ts`: POST — 401, 400 (rating 0/6/non-int), 404, 403 non-party, 400 not `COMPLETED`, 409 pre-check duplicate, 409 on `P2002` catch, correct `subjectId`/`subjectRole` both directions; PATCH — 401, 403 non-subject, 409 reply exists, 200 sets `reply`+`repliedAt`. Deps: 4.1.
- [x] 4.3 (GREEN) Create `app/api/reviews/route.ts` (`POST`): derive `subjectId`/`subjectRole` per design's rule, `findUnique` pre-check on `requestId_authorId`, catch `P2002` → 409. Deps: 4.2.
- [x] 4.4 (GREEN) Create `app/api/reviews/[id]/route.ts` (`PATCH`): 403 unless `session.user.id === review.subjectId`, 409 if `reply !== null`, set `reply`+`repliedAt`. Deps: 4.2.

## Phase 5: Public Profile (RED → GREEN)

- [x] 5.1 (RED) Create `tests/api/users-profile.test.ts`, `auth` mocked to `null`: 200 no session, role split from `groupBy`, 404 unknown user, explicit no-`email`/`phone`/`whatsappUrl`/`lat`/`lng`/`locationText` assertion, and the 3 per-role states — (a) `completedLoans:0,reviewCount:0,average:null`; (b) `completedLoans:3,reviewCount:0,average:null`; (c) `completedLoans:3,reviewCount:2,average:4.5`. Deps: 1.2.
- [x] 5.2 (GREEN) Create `app/api/users/[id]/profile/route.ts` (`GET`, no auth check): run the 5 aggregate queries from design's Aggregate Computation; shape response per design's contract (`user`, `ratings.{overall,asLender,asReturner}`, `reviews`); 404 when user missing. Deps: 5.1. **DEVIATION**: used `Promise.all(...)` instead of `prisma.$transaction([...])` — verified `tsc` regression where `review.groupBy`'s literal `_avg`/`_count` generic type collapses to an untyped union only inside the `$transaction` tuple form (reproduced in isolation, not present standalone or under `Promise.all`). No write occurs in this query set, so the batching guarantee is not required for correctness.

## Phase 6: Request UI Wiring

- [x] 6.1 Modify `components/requests/RequestCard.tsx`: remove `canComplete`/`markCompleted`; add `canConfirmReturn` (party + `ACCEPTED` + own timestamp null), pending/confirmed indicator for both sides, `canReview` (`COMPLETED` + no own review); wrap other-party name in `Link href="/users/{id}"`; extend props with `onConfirmReturn`, both timestamps, `reviews`. Deps: 3.3, 5.2.
- [x] 6.2 Modify `components/requests/RequestList.tsx`: add `handleConfirmReturn` PUTing `{action:'CONFIRM_RETURN'}` then `fetchRequests()`; wire to `RequestCard`. Deps: 6.1.
- [x] 6.3 Modify `components/posts/PostDetail.tsx` (owner photo+name block, lines ~270-286): wrap in `Link href="/users/{id}"`; leave `showContact` gating untouched. Deps: 5.2.

## Phase 7: Rating and Profile UI

- [x] 7.1 Create `components/ui/StarRating.tsx` (read-only star display). Deps: none.
- [x] 7.2 Create `components/reviews/StarRatingInput.tsx` (interactive 1-5 input). Deps: none.
- [x] 7.3 Create `components/reviews/ReviewDialog.tsx`: dismissible dialog using 7.2, `POST /api/reviews`. Deps: 4.3, 7.2.
- [x] 7.4 Wire `ReviewDialog` into `RequestCard.tsx` behind `canReview`. Deps: 6.1, 7.3.
- [x] 7.5 Create `components/users/RatingSummary.tsx`: 3 cards resolving the 3-state rule (no activity / completed-unrated / rated) from `completedLoans`+`reviewCount`, using 7.1. Deps: 5.2, 7.1.
- [x] 7.6 Create `components/users/ReviewList.tsx` + `ReviewItem`: stars, comment, author link, reply block, reply form when viewer is `subject` and `reply === null` → `PATCH /api/reviews/[id]`. Deps: 4.4, 7.1.
- [x] 7.7 Create `components/users/UserProfileView.tsx`: client container — fetch `/api/users/[id]/profile`, loading, 404 state; renders 7.5 + 7.6. Deps: 5.2, 7.5, 7.6.
- [x] 7.8 Create `app/[locale]/users/[id]/page.tsx`: server shell rendering `UserProfileView`. Deps: 7.7.

## Phase 8: Copy and Docs

- [x] 8.1 Add confirmation/rating/profile copy (incl. the two per-role empty-state strings) to `messages/es.json`, `en.json`, `it.json`, `de.json`, `fr.json`. Deps: 3.3, 4.3, 5.2 (keys must match final UI usage).
- [x] 8.2 Update `TAREAS_PENDIENTES.md:407` marking "Sistema de calificaciones/reviews" done. Deps: none.

## Phase 9: Verification

- [x] 9.1 Run `npm run test`, `npm run lint`, `npx tsc --noEmit`; all pass. Deps: all above.
- [ ] 9.2 Manual pass: both confirmation orders, review dismissal, logged-out profile view, no-contact-field check in browser network tab. Deps: 9.1. **NOT RUN** — requires a real browser session; out of scope for this automated apply batch. `npm run build` was run instead as an automated proxy and succeeded (all new routes compiled, including `/[locale]/users/[id]`, `/api/reviews`, `/api/reviews/[id]`, `/api/users/[id]/profile`).
