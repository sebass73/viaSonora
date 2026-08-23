# Verification Report: loan-return-rating

## Change
Bilateral Loan Return Confirmation, Bidirectional Rating, Public User Profile

## Mode
Full spec-driven verification (proposal + 3 specs + design + tasks all present).

## Task Completeness

27/28 tasks marked `[x]`. Task 9.2 ("Manual pass: both confirmation orders, review dismissal, logged-out profile view, no-contact-field check in browser network tab") is unchecked by design -- it requires a live browser session and is explicitly documented in tasks.md as not run, with `npm run build` executed as an automated proxy (confirmed successful independently, all 4 new routes compiled). This is a human-only QA gate, not a core implementation task; treated as WARNING, not blocking.

## Command Evidence (re-run independently, not trusted from apply-progress)

| Command | Result |
|---|---|
| npm run test (vitest) | 5 files / 53 passed / 53 total |
| npm run lint (next lint) | "No ESLint warnings or errors" |
| npx tsc --noEmit | zero output, exit clean -- 0 type errors |

All three independently reproduce the apply-progress's claimed results exactly.

## Spec Compliance Matrix

### loan-return-confirmation (6 requirements / 10 scenarios)

| Requirement | Scenario | Status | Evidence |
|---|---|---|---|
| Owner Return Confirmation | Owner confirms return | PASS | tests/api/requests-id.test.ts:180-221 + route.ts:184-201 |
| Client Return Confirmation | Client confirms return | PASS | same transaction branch, role-symmetric; myField selection at route.ts:184 |
| Automatic Completion on Dual Confirmation | Owner-then-client | PASS | requests-id.test.ts:223-246 |
|  | Client-then-owner | PASS | symmetric code path, same guarded updateMany; not separately unit-cased but logic is role-symmetric and covered by the reverse case |
|  | Only one party confirmed | PASS | requests-id.test.ts:180-221 asserts status stays ACCEPTED |
| Confirmation Requires ACCEPTED Status | COMPLETED rejection | PASS | requests-id.test.ts:270-278 |
|  | CANCELLED/DECLINED rejection | PASS | covered by shared terminal-state guard (route.ts:133-138), tested for status branch (requests-id.test.ts:81-98); confirmation branch shares the same currentStatus !== ACCEPTED check at route.ts:177 |
| Role-Scoped Confirmation Authorization | Client submits owner confirmation | WARNING | no branch exists to submit the other role's confirmation -- myField is derived from the caller's own party role, not user-selectable, so this attack is structurally impossible rather than explicitly tested |
|  | Unrelated user attempts confirmation | PASS | requests-id.test.ts:280-288, 403 |
| Concurrent Confirmation Consistency | Simultaneous confirmations both succeed | WARNING | not exercised as true concurrency in any automated test; proxied by asserting the two-updateMany WHERE-guard shape under a mocked $transaction. design.md documents this explicitly as relying on Postgres READ COMMITTED per-statement snapshot plus row locking, not on application code |

### loan-rating (8 requirements / 15 scenarios)

| Requirement | Scenario | Status | Evidence |
|---|---|---|---|
| Rating Requires COMPLETED Request | Rejected before completion | PASS | reviews.test.ts:113-120 |
|  | Allowed after completion | PASS | reviews.test.ts:144-185 (both directions) |
| Bidirectional Independent Rating | Client rates owner | PASS | reviews.test.ts:144-164 |
|  | Owner rates client | PASS | reviews.test.ts:166-185 |
| Rating Score and Comment | Score + comment | PASS | reviews.test.ts:150 (comment: 'Great') |
|  | Score only | PASS | reviews.test.ts:172 (no comment passed) |
|  | Out-of-range rejected | PASS | reviews.test.ts:71-93 (0, 6, non-integer 3.5) |
| One Rating per Author per Request | Second rating rejected at DB level | PASS | schema.prisma:340 @@unique([requestId, authorId]); pre-check reviews.test.ts:122-131 + real-race P2002 catch reviews.test.ts:133-142 and route.ts:82-87 |
| Rating Is Optional and Non-Blocking | No side effect from declining | PASS by construction | no code path anywhere gates other functionality on Review existing; RequestCard.tsx review button is purely additive (canReview), no other control depends on it |
| No Rating Deadline | Rated long after completion | PASS by construction | no time-based check exists anywhere in POST /api/reviews; createReviewSchema/route has zero deadline logic |
| Rating Immutability | Author attempts edit | PASS by construction | no PUT/PATCH route exists for rating/comment; only route touching a Review post-creation is PATCH /api/reviews/[id], which writes only reply/repliedAt (route.ts:43-49) |
|  | Author attempts delete | PASS by construction | no DELETE route exists on /api/reviews/[id] or /api/reviews |
| Single Public Reply per Review | Rated user posts reply | PASS | reviews.test.ts:230-244 |
|  | Rated user attempts second reply | PASS | reviews.test.ts:220-228, 409 |
|  | Review author attempts to reply to own review | PASS | reviews.test.ts:210-218, 403 (review.subjectId !== session.user.id guard structurally can never let an author reply to their own review, since subjectId is always the other party) |

### public-user-profile (6 requirements / 10 scenarios)

| Requirement | Scenario | Status | Evidence |
|---|---|---|---|
| Public Read-Only Profile Page | Unauthenticated visitor views profile | PASS | users-profile.test.ts:72-85 (auth mocked to null, 200); route has no auth() call at all |
|  | Read-only for visitors | PASS by construction | UserProfileView.tsx renders no edit control; ProfileForm.tsx untouched and never imported here |
| Role-Split Rating Aggregates | Both roles rated | PASS | users-profile.test.ts:95-113 |
|  | Active in only one role | PASS | same test, asymmetric lenderLoans/returnerLoans inputs (2 vs 1) |
| Empty-State per Role | No completed loans as lender | PASS | users-profile.test.ts:136-150 (state a) + RatingSummary.tsx:36-39 three-branch render |
|  | No completed loans as returner | PASS | symmetric bucket, same component logic |
| Individual Review Listing | Reviews with/without replies listed | PASS | ReviewList.tsx:77-108 renders review.reply conditionally; GET .../profile includes reply/repliedAt/author per review (route.ts:111-120) -- no dedicated unit test asserts a reply-bearing review round-trips end-to-end, but reviews.test.ts proves the reply write path and the profile route trivially forwards stored fields |
| No Contact Information Disclosure | No email/phone/WhatsApp in response | PASS | users-profile.test.ts:115-134 explicit field-absence assertion; select in route.ts:23-32 structurally excludes email, phone, whatsappUrl, lat, lng, locationText -- leak is structurally impossible, not just untested |
| Inbound Profile Links | Post detail links to owner profile | PASS | PostDetail.tsx:270 Link href to /users/[id] wraps photo+name |
|  | Request card links to other party | PASS | RequestCard.tsx:161 Link href to /users/[id] |

## Design Coherence

All architecture decisions in design.md are faithfully implemented:
- Two nullable timestamps on Request (not a join table) -- schema.prisma:282-283.
- Two guarded updateMany inside $transaction -- route.ts:186-201, matches the Auto-Completion Flow diagram exactly (own-field-null guard, then both-not-null guard).
- subjectId/subjectRole stored on Review, not derived per query -- schema.prisma:327-328.
- z.union([confirmReturnSchema, updateRequestStatusSchema]) -- lib/validation.ts:164-167.
- Re-confirm idempotent 200 -- requests-id.test.ts:248-268.
- Legacy COMPLETED requests rateable (gate is status==='COMPLETED', not timestamps) -- reviews.test.ts gate check uses only existingRequest.status.
- Public location fields limited to city/state/country -- route.ts:28-30 select.
- Documented deviation (tasks.md 5.2): Promise.all instead of prisma.$transaction([...]) for the profile aggregate reads, due to a verified TypeScript generic-collapse regression with groupBy inside a $transaction tuple. Correctly scoped to read-only queries; does not affect correctness or any spec requirement. Acceptable, non-blocking design deviation.

## Non-Goals Verification (proposal Out of Scope)

- No cancellation/no-show tracking, no "reliability score" anywhere -- grep across the repo for reliability/noShow/no-show returned zero hits.
- components/profile/ProfileForm.tsx -- untouched (not in git status, not imported by any new profile component).
- No notifications/reminders code added.
- PostReport/ReportStatus/ReportReason -- schema unchanged, no route touched.
- showContact gating in PostDetail.tsx -- untouched; new profile link added alongside, not replacing, the existing contact-gated block.

## i18n Verification

All 5 locale files (es, en, it, de, fr) independently parsed and confirmed to contain the identical new key sets: requests.{confirmReturnOwner, confirmReturnClient, returnConfirmedByOwner, returnConfirmedByClient, returnPendingOwner, returnPendingClient, rateLoan, errorConfirmingReturn}, full reviews namespace (17 keys), full publicProfile namespace (11 keys, including the two distinct per-role empty-state/unrated strings required by design).

TAREAS_PENDIENTES.md:407 confirmed updated: strikethrough "Sistema de calificaciones/reviews" marked done with implementation note.

## Issues

### CRITICAL
None.

### WARNING
1. Concurrent Confirmation Consistency scenario "Simultaneous confirmations both succeed" has no test exercising true concurrent execution -- only the WHERE-guard shape is asserted under a mocked $transaction (documented design limitation, relies on Postgres locking semantics rather than application-level proof). Recommend a follow-up integration test against the real dev DB with two concurrent connections before this path is considered fully proven, though the current unit-level proxy plus the documented Postgres guarantee is a reasonable, disclosed trade-off.
2. Role-Scoped Confirmation Authorization scenario "Client attempts to submit the owner's confirmation" is not directly testable because the implementation makes it structurally impossible (the confirmed field is derived from the caller's own role, never user-supplied) rather than rejected by an explicit authorization check. Functionally equivalent and arguably stronger, but no test documents this reasoning inline.
3. Task 9.2 (manual browser QA) intentionally not run -- acknowledged non-blocking per task list, but archive should note this gap remains for a human before shipping to production users.

### SUGGESTION
1. No direct end-to-end test proves a reply-bearing review round-trips through GET /api/users/[id]/profile (reply write path and profile read path are each tested separately, not chained). Low risk given both are simple field pass-throughs.
2. The "client confirms first, then owner completes" scenario relies on code symmetry with the tested owner-first case rather than its own explicit test case.

## Verdict

PASS WITH WARNINGS

Implementation matches all three specs' requirements and scenarios. 53/53 tests pass, lint is clean, tsc --noEmit reports zero errors -- all independently re-run and confirmed, not assumed from apply-progress. Non-goals remain absent. The three WARNINGs above are documented, low-risk, and do not block archival; task 9.2 remains an explicit pre-production human gate.
