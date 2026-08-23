# Proposal: Bilateral Loan Return Confirmation, Bidirectional Rating, and Public User Profile

## Intent

Today the owner alone ends a loan (`RequestCard.tsx:93,203-212` → `PUT app/api/requests/[id]/route.ts:142-154`); the client cannot state the instrument was returned, and nothing records how either party behaved. Users pick a counterparty with zero reputation signal, and the app's only public view of a person (`PostDetail.tsx:264-327`) shows a name and photo with no history behind it. This change makes loan closure mutual and turns completed loans into visible, role-aware reputation.

## Scope

### In Scope

- Bilateral, order-independent return confirmation on `Request`: each role confirms its own side, neither waits for the other.
- Automatic transition to `RequestStatus.COMPLETED` once both confirmations exist — derived, never a manual final button.
- Two role-specific confirm buttons replace the owner-only "mark as completed" (client: "Confirm I returned the instrument"; owner: "Confirm I received the instrument back").
- Bidirectional rating on a `COMPLETED` request (client→owner, owner→client): 1-5 stars + optional comment. Fully optional and dismissible; blocks nothing.
- One rating per `(request, author)`, enforced at DB level.
- New read-only public profile `app/[locale]/users/[id]/page.tsx`: overall average, average as lender, average as returner — each with its completed-loan count in that role — plus individual reviews (stars, comment, author).
- One optional public reply per review, authored only by the rated user. Single reply, not a thread.
- Profile links from the owner section of `PostDetail.tsx` and the other-party name in `RequestCard.tsx`.
- New copy in `messages/{es,en,it,de,fr}.json`.

### Out of Scope

- **No cancellation/no-show tracking and no "reliability score" in any form.** Deliberately rejected; must not reappear under any framing.
- Editing another user's profile — public profile is read-only for third parties; `components/profile/ProfileForm.tsx` untouched.
- Notifications/reminders to rate — possible follow-up, not this change.
- `PostReport`/`ReportStatus`/`ReportReason` moderation — untouched, not reused.
- Contact privacy: `showContact` gating unchanged; public profile exposes no email, phone, or WhatsApp.

## Capabilities

### New Capabilities

- `loan-return-confirmation`: per-role independent return confirmation on `Request` plus the derived automatic `COMPLETED` transition.
- `loan-rating`: bidirectional per-loan rating creation/retrieval, per-author uniqueness, single optional reply by the rated party.
- `public-user-profile`: read-only public profile with role-split aggregates, review listing, inbound links.

### Modified Capabilities

None — `openspec/specs/` is empty, so no existing spec-level behavior is redefined.

## Approach

Follow existing codebase conventions; introduce no new machinery.

1. **Confirmation state**: two nullable timestamps on `Request` — matches this schema's flat-field style for 1:1 state, no join table.
2. **Auto-completion**: explicit logic in the request-status route (where all transition rules already live), wrapped in `prisma.$transaction` so simultaneous confirmations cannot race.
3. **Rating**: new dedicated `Review` model (not a `PostReport` extension) with `@@unique([requestId, authorId])` mirroring `@@unique([postId, reporterId])`, plus an optional reply field owned by the rated user.
4. **Aggregates**: computed on read — no caching layer exists, and denormalized counters would need an invalidation path with no precedent.

### Request status transition impact (`rules.proposal`)

- `ACCEPTED → COMPLETED` stops being an owner-initiated write and becomes derived from two confirmations.
- `REQUESTED → ACCEPTED|DECLINED` (owner) and `REQUESTED|ACCEPTED → CANCELLED` (client) unchanged.
- Terminal-state guard (`route.ts:135`) remains: no confirmation or rating may reopen `COMPLETED|CANCELLED|DECLINED`.
- `COMPLETED` gains a second meaning: the gate that unlocks rating.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Confirmation fields on `Request`; new `Review` model + relations |
| `app/api/requests/[id]/route.ts` | Modified | Confirmation branch + transactional auto-completion |
| `lib/validation.ts:154-156` | Modified | Confirmation needs its own schema; flat status enum insufficient |
| `components/requests/RequestCard.tsx` | Modified | Two confirm buttons replace `canComplete`; profile link |
| `components/requests/RequestList.tsx:127-145` | Modified | Wire the confirmation request |
| `components/posts/PostDetail.tsx:264-327` | Modified | Owner name/photo links to profile |
| `app/[locale]/users/[id]/page.tsx` | New | Public profile page |
| Review + profile-aggregate API routes | New | Create/read reviews, read role-split aggregates |
| Rating/profile components | New | Star input, breakdown, review list, reply control |
| `messages/{es,en,it,de,fr}.json` | Modified | Copy in five locales |
| `tests/api/` | New | Route has zero coverage; strict TDD requires tests first |
| `TAREAS_PENDIENTES.md:407` | Modified | Mark rating item done |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Concurrent confirmations race into a wrong status | Med | Atomic read-modify-write in `prisma.$transaction` |
| Request route has no existing tests | High | Strict TDD: regression suite before touching it |
| Duplicate ratings per loan | Med | DB-level `@@unique([requestId, authorId])`, not app checks alone |
| New public surface leaks contact data | Med | No email/phone/WhatsApp on profile; `showContact` stays separate |
| Rejected no-show tracking creeps back as "reliability" | Med | Explicit non-goal; spec/design must add no such field |
| Five locale files under-scoped | Med | i18n as its own deliverable in tasks |
| Pre-existing requests lack confirmation fields | Low | Already-`COMPLETED` stays completed; nullable fields need no backfill |

## Rollback Plan

1. Revert application commits (route, components, pages, locales) — UI returns to the owner-only completion button.
2. Down migration drops the `Review` table and the two `Request` columns. Both are purely additive, so no existing column is altered and no pre-existing data is lost.
3. Requests already auto-completed stay `COMPLETED` and remain valid under the old unilateral rule; only their ratings are lost.
4. Since the schema change is additive, reverting code without the migration is a safe intermediate step.

## Dependencies

- Prisma migration applied before the new endpoints go live.
- No new external services or libraries.

## Success Criteria

- [ ] Owner and client each confirm return independently, in any order, and see the other side's pending/confirmed state.
- [ ] A `Request` reaches `COMPLETED` only and automatically when both confirmations exist; no manual "complete" control remains.
- [ ] After `COMPLETED`, each party can leave 1-5 stars + optional comment, or dismiss without losing any other functionality.
- [ ] A second rating by the same author on the same loan is rejected at the database level.
- [ ] Once published, a rating cannot be edited or deleted by its author; there is no rating deadline after `COMPLETED`.
- [ ] The public profile is reachable and fully readable by unauthenticated visitors.
- [ ] A role with zero completed loans shows an explicit empty-state message, never a bare zero-star average.
- [ ] The profile page shows overall, as-lender, and as-returner averages with per-role completed-loan counts, plus individual reviews.
- [ ] A rated user can post exactly one public reply per review received.
- [ ] Owner in `PostDetail.tsx` and other party in `RequestCard.tsx` navigate to the public profile.
- [ ] The public profile displays no email, phone, or WhatsApp.
- [ ] New copy exists in all five locale files.
- [ ] `npm run test`, `npm run lint`, `npx tsc --noEmit` pass.

## Proposal question round

Execution mode is automatic, so no interactive round ran before the first draft. The following assumptions were confirmed by the user afterward and are now decided, not open:

1. **No deadline or expiry window** for rating after `COMPLETED` — a loan can be rated at any time afterward.
2. **Ratings are immutable once published** — no edit, no delete, no moderation queue. This is a firmer guarantee than "public and immediately visible": the author cannot alter or remove it later.
3. "As returner" aggregates ratings received while acting as client, "as lender" while acting as owner; a user active in both roles has both plus the combined overall. (Not reopened — follows directly from the role definitions already in scope.)
4. **Profile aggregates and reviews are visible to any visitor, including unauthenticated ones** — same visibility model as `/explore` and post detail pages today.
5. **A user with no completed loans in a role sees an explicit empty-state message** (e.g. "No completed loans yet as a lender"), not a bare zero-star average — avoids misreading missing data as a bad reputation.
