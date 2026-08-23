# Exploration: Bilateral loan return confirmation + bidirectional rating + public user profile

## Current State

**Data model**: No `Loan` entity exists. The loan is modeled as `Request` (`prisma/schema.prisma:264-289`): `id, postId, instrumentId, ownerId, clientId, status, fromDate, toDate, message, accessories, createdAt, updatedAt`, with relations to `Post`, `Instrument`, and two `User` relations (`OwnerRequests`, `ClientRequests`). `RequestStatus` enum (`prisma/schema.prisma:39-45`): `REQUESTED | ACCEPTED | DECLINED | CANCELLED | COMPLETED`. Final states: `COMPLETED`, `DECLINED`, `CANCELLED`.

**Completion today (unilateral)**: `PUT app/api/requests/[id]/route.ts:96-223`.
- Loads `existingRequest`, checks `isOwner`/`isClient` (lines 124-129), 403 if neither.
- Line 135: blocks any change once status is `COMPLETED|CANCELLED|DECLINED`.
- Lines 142-154: owner-only transitions — `REQUESTED→ACCEPTED|DECLINED`, `ACCEPTED→COMPLETED`. No client-initiated completion path exists at all.
- Lines 156-166: client-only transition — `REQUESTED|ACCEPTED→CANCELLED`.
- Single `status` field, single writer per transition — no concept of two independent parties each confirming the same event.
- Body validated by `updateRequestStatusSchema` (`lib/validation.ts:154-156`): `z.enum(['ACCEPTED','DECLINED','CANCELLED','COMPLETED'])`.
- **No test file exists** for this route (`tests/api/` only has `instruments.test.ts`, `posts.test.ts`) — modifying this endpoint under strict TDD has no existing regression net.

**UI for completion**: `components/requests/RequestCard.tsx:93` — `canComplete = isOwner && request.status === 'ACCEPTED'`; button at lines 203-212 fires `handleStatusChange('COMPLETED')` after a native `confirm()`. `components/requests/RequestList.tsx:127-145` does the `PUT` fetch + reload. Rendered from `app/[locale]/requests/page.tsx`. Client has zero available action while `ACCEPTED` besides cancelling.

**Rating/review**: Nothing implemented anywhere (schema or UI). Listed as pending in `TAREAS_PENDIENTES.md:407`. `PostReport`/`ReportStatus`/`ReportReason` (`prisma/schema.prisma:47-60,291-311`) is content moderation (reporting a listing), unrelated to loan rating — do not reuse/confuse. It offers a reusable *pattern* though: `@@unique([postId, reporterId])` to prevent duplicate reports — same shape needed to prevent duplicate reviews per request+author.

**Public user profile**: Does not exist. No `app/[locale]/users/[id]/` route, no `UserAvatar`/`UserCard`/`UserBadge` components. `app/[locale]/profile/page.tsx` + `components/profile/ProfileForm.tsx` is exclusively the *own* editable profile — not a public view of another user.

**Where a user is shown "outward" today**:
- `components/posts/PostDetail.tsx:264-327` — the only real public user view in the app. Always shows owner photo+name (271-285); reveals email/phone/whatsapp/location only when `showContact` is true (owner viewing own post, or client with an `acceptedRequest`) (288-327).
- `components/requests/RequestCard.tsx:130-143` — shows the "other party" as plain text name only; the interface declares `image` (lines 44-55) but it's never rendered, and there's no link anywhere to a profile.
- List cards (`app/[locale]/explore/page.tsx:127-163`, `PostList.tsx`, `InstrumentList.tsx`) show nothing about the owner; there is no shared `PostCard.tsx` — each listing duplicates its own inline card.
- `components/admin/AdminPostCard.tsx:92-94` is an internal moderation view, not public.

**Routing convention precedent**: `app/[locale]/posts/[id]/page.tsx` and `app/[locale]/instruments/[id]/edit/page.tsx` already exist, so a new `app/[locale]/users/[id]/page.tsx` for the public profile is consistent with the existing App Router/locale convention.

**i18n**: 5 locale files exist (`messages/{es,en,it,de,fr}.json`). Any new UI copy touches all five.

**Stack confirmed**: Prisma 5.19 + PostgreSQL, `lib/prisma.ts` client, Zod validation in `lib/validation.ts`, NextAuth v5 + Prisma adapter, Vitest with `vi.mock` for Prisma/auth in `tests/api/*.test.ts`, strict TDD enabled in `openspec/config.yaml`.

## User-stated intent (not yet formalized — context for sdd-propose, not decided here)

1. Bilateral, order-independent return confirmation on `Request`: owner and client each confirm independently; when both have confirmed, status auto-transitions to `COMPLETED`.
2. Bidirectional rating tied to a `COMPLETED` request: client rates owner, owner rates client, 1-5 stars + optional comment, entirely optional/dismissible (non-blocking).
3. New public user profile page: overall average + average-as-lender + average-as-borrower (each with a completed-loan counter in that role), individual review listing, one optional public reply per review from the rated party.
4. Explicitly **out of scope**: no cancellation/no-show tracking system. Must not appear in downstream artifacts.
5. Link to the new profile from `PostDetail.tsx` (owner section) and `RequestCard.tsx` (other-party name).

## Affected Areas

- `prisma/schema.prisma` — new confirmation fields on `Request` (or alternative, see Approaches) + new `Review`/`Rating` model and relations.
- `app/api/requests/[id]/route.ts` — status-transition logic (lines 131-166) must absorb a bilateral-confirmation branch; **no existing test coverage**.
- `lib/validation.ts:154-156` — `updateRequestStatusSchema` is a flat enum; confirmation intent needs its own schema shape.
- `components/requests/RequestCard.tsx` (93, 130-143, 203-212) and `components/requests/RequestList.tsx` (127-145) — new confirm action, profile link for other party.
- `components/posts/PostDetail.tsx:264-327` — owner section needs a profile link; contact-reveal gating (`showContact`) is separate from and must not merge with rating visibility.
- New: `app/[locale]/users/[id]/page.tsx` and supporting components (profile header, rating breakdown, review list, reply UI).
- New API surface for creating reviews and reading profile aggregates.
- `messages/{es,en,it,de,fr}.json` — new UI strings.
- `tests/api/` — new test file(s) needed (strict TDD).
- `TAREAS_PENDIENTES.md:407` — documentation housekeeping once implemented.

## Approaches

Implementation-architecture options only (not product scope, which belongs to `sdd-propose`).

1. **Confirmation state: two nullable fields on `Request`** (e.g. `ownerReturnConfirmedAt`, `clientReturnConfirmedAt`) vs. **a separate confirmation table**.
   - Pros (fields): minimal change, single-row read, matches this schema's flat-fields style (no join tables used for 1:1 state anywhere).
   - Cons: two more nullable columns; no history if that's ever needed.
   - Pros (table): extensible, cleaner separation.
   - Cons: overkill given no stated history requirement, no precedent in this codebase.
   - Effort: Low vs. Medium.

2. **Auto-complete trigger point: explicit logic in the API route** vs. **Prisma middleware/DB trigger**.
   - Pros (route logic): matches 100% of existing patterns — all transition rules live inline in `PUT .../route.ts`; testable with the existing `vi.mock` style; can wrap in `prisma.$transaction` to avoid races.
   - Cons: must be centralized if a second endpoint could also trigger completion.
   - Pros (middleware/trigger): can't be bypassed by a future direct write.
   - Cons: zero precedent for either in this codebase; harder to test with the existing mock-based convention; DB triggers are invisible to Prisma/TS.
   - Effort: Low vs. Medium/High.

3. **Rating aggregates: computed on read** vs. **denormalized cached fields on `User`**.
   - Pros (on-read): always correct, no write-side bookkeeping, simplest first cut.
   - Cons: extra aggregate query per profile view (likely negligible; no caching layer exists anywhere in the app).
   - Pros (denormalized): faster reads.
   - Cons: needs its own recompute/write path and drift risk, no precedent for cache invalidation in this codebase.
   - Effort: Low vs. Medium.

## Recommendation

Given the codebase's consistent style (flat fields over join tables for 1:1 state, business rules inline in API routes, no caching precedent anywhere): two nullable confirmation timestamps on `Request`, explicit auto-complete logic inside the existing/sibling request-status endpoint wrapped in `prisma.$transaction`, a new dedicated `Review` model (not reusing `PostReport`) with a `@@unique` constraint mirroring `PostReport`'s `[postId, reporterId]` pattern (e.g. `[requestId, authorId]`), and on-read aggregation for profile averages until real usage demands denormalization. Exact field names, model shape, and the review-reply mechanism remain `sdd-propose`/`sdd-spec` decisions.

## Risks

- No test coverage today on `app/api/requests/[id]/route.ts` — strict TDD requires new tests before touching it, with no existing suite to extend.
- Concurrent-confirmation race: simultaneous owner/client confirms need an atomic update, not two sequential unguarded writes.
- Review-per-role uniqueness must be enforced at the DB level (mirroring `PostReport`'s unique constraint), not just in application code.
- Contact-privacy precedent (`PostDetail.tsx`'s `showContact` gating) must not be broken — the new public profile is a new public surface and needs its own explicit privacy scope; must not leak email/phone by default.
- Naming/model collision risk: must not reuse or extend `PostReport`/`ReportStatus`/`ReportReason`.
- Out-of-scope leakage: explicitly rejected cancellation/no-show tracking must not reappear via a generic "reliability score" framing in later artifacts.
- i18n surface: new copy touches 5 locale files — easy to under-scope in tasks if not called out.

## Ready for Proposal

Yes — current-state behavior, exact file/line locations, and the three architecture-relevant decisions are documented enough for `sdd-propose` to proceed without re-exploring the codebase.
