# Loan Return Confirmation Specification

## Purpose

Defines bilateral, order-independent return confirmation on `Request` and the derived automatic transition to `RequestStatus.COMPLETED`, replacing the current owner-only completion write.

## Requirements

### Requirement: Owner Return Confirmation

The system MUST allow the `Request.owner` to independently record that they received the instrument back, without requiring the client to have confirmed first.

#### Scenario: Owner confirms return

- GIVEN a `Request` with `status = ACCEPTED`
- WHEN the owner submits their return confirmation
- THEN the system records the owner's confirmation
- AND the `Request.status` remains `ACCEPTED` if the client has not yet confirmed

### Requirement: Client Return Confirmation

The system MUST allow the `Request.client` to independently record that they returned the instrument, without requiring the owner to have confirmed first.

#### Scenario: Client confirms return

- GIVEN a `Request` with `status = ACCEPTED`
- WHEN the client submits their return confirmation
- THEN the system records the client's confirmation
- AND the `Request.status` remains `ACCEPTED` if the owner has not yet confirmed

### Requirement: Automatic Completion on Dual Confirmation

The system MUST transition a `Request` to `status = COMPLETED` automatically and only when both the owner's and the client's return confirmations exist. No manual "mark complete" action MUST remain.

#### Scenario: Owner confirms first, then client completes the loan

- GIVEN a `Request` with `status = ACCEPTED` and the owner already confirmed
- WHEN the client submits their return confirmation
- THEN the system transitions `Request.status` to `COMPLETED`

#### Scenario: Client confirms first, then owner completes the loan

- GIVEN a `Request` with `status = ACCEPTED` and the client already confirmed
- WHEN the owner submits their return confirmation
- THEN the system transitions `Request.status` to `COMPLETED`

#### Scenario: Only one party has confirmed

- GIVEN a `Request` with `status = ACCEPTED` and only one party confirmed
- WHEN either party requests the current request state
- THEN `Request.status` is still `ACCEPTED`
- AND the state indicates which confirmation is pending

### Requirement: Confirmation Requires ACCEPTED Status

The system MUST reject a return confirmation attempt when `Request.status` is not `ACCEPTED`.

#### Scenario: Confirmation attempted on a COMPLETED request

- GIVEN a `Request` with `status = COMPLETED`
- WHEN a party attempts to submit a return confirmation
- THEN the system rejects the attempt
- AND `Request.status` is unchanged

#### Scenario: Confirmation attempted on a CANCELLED or DECLINED request

- GIVEN a `Request` with `status = CANCELLED` or `status = DECLINED`
- WHEN a party attempts to submit a return confirmation
- THEN the system rejects the attempt

### Requirement: Role-Scoped Confirmation Authorization

The system MUST NOT allow a user to submit a confirmation for a role they do not hold on that `Request`. Only `Request.ownerId` MAY submit the owner confirmation; only `Request.clientId` MAY submit the client confirmation.

#### Scenario: Client attempts to submit the owner's confirmation

- GIVEN a `Request` with `status = ACCEPTED`
- WHEN the user identified by `Request.clientId` attempts to submit the owner confirmation
- THEN the system rejects the attempt with an authorization error
- AND no confirmation is recorded

#### Scenario: Unrelated user attempts any confirmation

- GIVEN a `Request` with `status = ACCEPTED`
- WHEN a user who is neither `Request.ownerId` nor `Request.clientId` attempts to confirm
- THEN the system rejects the attempt

### Requirement: Concurrent Confirmation Consistency

The system MUST process simultaneous owner and client confirmation submissions atomically so the resulting `Request.status` is always consistent with exactly the confirmations that were successfully recorded.

#### Scenario: Simultaneous confirmations both succeed

- GIVEN a `Request` with `status = ACCEPTED` and neither party has confirmed
- WHEN the owner and client submit their confirmations at the same time
- THEN both confirmations are recorded
- AND `Request.status` transitions to `COMPLETED` exactly once
- AND no intermediate inconsistent state is observable by either party
