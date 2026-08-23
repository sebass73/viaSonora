# Public User Profile Specification

## Purpose

Defines a read-only public profile page showing role-split rating aggregates and individual reviews for any `User`, visible to any visitor including unauthenticated ones, with no contact information exposed.

## Requirements

### Requirement: Public Read-Only Profile Page

The system MUST expose a read-only profile page for any `User` at `app/[locale]/users/[id]/page.tsx`, reachable and fully readable without authentication.

#### Scenario: Unauthenticated visitor views a profile

- GIVEN a valid `User.id`
- WHEN an unauthenticated visitor navigates to that user's profile page
- THEN the page renders the user's public profile content
- AND no login is required

#### Scenario: Profile page is read-only for visitors

- GIVEN any visitor viewing another user's profile
- WHEN the page renders
- THEN no editing control for that profile's data is presented

### Requirement: Role-Split Rating Aggregates

The system MUST display three averages for a `User`: overall, as-lender (ratings received while acting as `Request.owner`), and as-returner (ratings received while acting as `Request.client`), each with the count of `COMPLETED` requests underlying that role's average.

#### Scenario: User with completed loans in both roles

- GIVEN a user with completed loans as both owner and client, each rated
- WHEN their profile is viewed
- THEN the overall average, the as-lender average with its count, and the as-returner average with its count are all displayed

#### Scenario: User active in only one role

- GIVEN a user with completed loans only as owner
- WHEN their profile is viewed
- THEN the as-lender average and count reflect owner-role ratings
- AND the overall average is computed from available ratings only

### Requirement: Empty-State per Role

The system MUST display an explicit empty-state message for a role with zero completed loans, and MUST NOT display a zero-star average for that role.

#### Scenario: No completed loans as lender

- GIVEN a user with zero `COMPLETED` requests as owner
- WHEN their profile is viewed
- THEN the as-lender section shows an explicit message (e.g. "No completed loans yet as a lender")
- AND no numeric star average is shown for that role

#### Scenario: No completed loans as returner

- GIVEN a user with zero `COMPLETED` requests as client
- WHEN their profile is viewed
- THEN the as-returner section shows an explicit empty-state message and no numeric average

### Requirement: Individual Review Listing

The system MUST list individual reviews received by the profile's user, each showing the star score, optional comment, the reviewing user, and the rated user's public reply if one exists.

#### Scenario: Reviews with and without replies are listed

- GIVEN a user who has received two reviews, one with a reply and one without
- WHEN their profile is viewed
- THEN both reviews are listed with their score, comment, and author
- AND the reviewed reply is shown for the review that has one

### Requirement: No Contact Information Disclosure

The public profile MUST NOT expose the user's email, phone, or WhatsApp URL under any circumstance. This is independent of the `showContact` gating used elsewhere in the application.

#### Scenario: Visitor views a profile without an accepted request relationship

- GIVEN any visitor viewing a user's public profile
- WHEN the page renders
- THEN no email, phone, or WhatsApp field is present in the response or markup

### Requirement: Inbound Profile Links

The system MUST link to a user's public profile from the owner section of the post detail view and from the other party's name on a request card.

#### Scenario: Post detail links to the owner's profile

- GIVEN a post detail page for a listing owned by a given user
- WHEN the owner's name or photo is displayed
- THEN it links to that user's public profile page

#### Scenario: Request card links to the other party's profile

- GIVEN a request card showing the other party's name
- WHEN that name is displayed
- THEN it links to the other party's public profile page
