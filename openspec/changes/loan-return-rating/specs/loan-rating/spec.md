# Loan Rating Specification

## Purpose

Defines optional, bidirectional 1-5 star rating with an optional comment on a `COMPLETED` `Request`, enforced author uniqueness, immutability once published, and a single optional public reply from the rated party.

## Requirements

### Requirement: Rating Requires COMPLETED Request

The system MUST allow a rating to be created only for a `Request` with `status = COMPLETED`.

#### Scenario: Rating attempted before completion

- GIVEN a `Request` with `status = ACCEPTED`
- WHEN a party attempts to submit a rating for that request
- THEN the system rejects the attempt

#### Scenario: Rating allowed after completion

- GIVEN a `Request` with `status = COMPLETED`
- WHEN a party submits a rating for that request
- THEN the system creates the rating

### Requirement: Bidirectional Independent Rating

The system MUST allow the client to rate the owner and the owner to rate the client on the same `COMPLETED` request, each independently of the other having rated.

#### Scenario: Client rates owner without owner having rated

- GIVEN a `COMPLETED` `Request` where the owner has not rated
- WHEN the client submits a rating
- THEN the rating is recorded with the client as author and the owner as the rated user

#### Scenario: Owner rates client without client having rated

- GIVEN a `COMPLETED` `Request` where the client has not rated
- WHEN the owner submits a rating
- THEN the rating is recorded with the owner as author and the client as the rated user

### Requirement: Rating Score and Comment

The system MUST require an integer star score between 1 and 5 inclusive, and MAY accept an optional free-text comment.

#### Scenario: Rating submitted with score and comment

- GIVEN a `COMPLETED` `Request`
- WHEN a party submits a rating with `score = 4` and a comment
- THEN the system stores both the score and the comment

#### Scenario: Rating submitted with score only

- GIVEN a `COMPLETED` `Request`
- WHEN a party submits a rating with `score = 5` and no comment
- THEN the system stores the rating with an empty comment

#### Scenario: Rating rejected for out-of-range score

- GIVEN a `COMPLETED` `Request`
- WHEN a party submits a rating with `score = 0` or `score = 6`
- THEN the system rejects the submission

### Requirement: One Rating per Author per Request

The system MUST enforce, at the database level, that a given author can create at most one rating per `Request`.

#### Scenario: Second rating attempt by the same author is rejected

- GIVEN a `COMPLETED` `Request` on which the client already submitted a rating
- WHEN the client attempts to submit a second rating for the same request
- THEN the database constraint rejects the write
- AND the original rating is unchanged

### Requirement: Rating Is Optional and Non-Blocking

The system MUST NOT require a rating to exist for any other functionality to operate. Declining to rate MUST have no side effect.

#### Scenario: Request stays fully usable without any rating

- GIVEN a `COMPLETED` `Request` with no ratings from either party
- WHEN either party views their request history or the other party's profile
- THEN all functionality behaves normally with no rating present

### Requirement: No Rating Deadline

The system MUST NOT enforce any time limit for submitting a rating after `Request.status` becomes `COMPLETED`.

#### Scenario: Rating submitted long after completion

- GIVEN a `Request` that has been `COMPLETED` for an extended period
- WHEN an eligible party submits a rating for the first time
- THEN the system accepts the rating

### Requirement: Rating Immutability

Once published, a rating MUST NOT be editable or deletable by its author or by any other user.

#### Scenario: Author attempts to edit their own published rating

- GIVEN a rating already published by its author
- WHEN the author attempts to change its score or comment
- THEN the system rejects the attempt and the rating is unchanged

#### Scenario: Author attempts to delete their own published rating

- GIVEN a rating already published by its author
- WHEN the author attempts to delete it
- THEN the system rejects the attempt and the rating remains visible

### Requirement: Single Public Reply per Review

The system MUST allow the rated user, and only the rated user, to publish at most one public reply per review they received. The reply is not a threaded conversation.

#### Scenario: Rated user posts a reply

- GIVEN a review received by a user, with no existing reply
- WHEN that rated user submits a reply
- THEN the system attaches the reply to the review

#### Scenario: Rated user attempts a second reply

- GIVEN a review that already has a reply from the rated user
- WHEN the rated user attempts to submit another reply to the same review
- THEN the system rejects the attempt

#### Scenario: Author of the review attempts to reply

- GIVEN a review authored by a user (the rater, not the rated party)
- WHEN the rater attempts to submit a reply to their own review
- THEN the system rejects the attempt
