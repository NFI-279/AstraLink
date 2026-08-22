---
name: Security-sensitive
about: Evaluate or implement work involving authentication, authorization, vehicle
  access, or remote commands
title: "[Security]"
labels: security-sensitive
assignees: ''

---

## Security Objective

Describe the security-sensitive capability or problem being addressed.

## Context

Explain why this functionality is needed and how it interacts with AstraLink.

## Assets to Protect

Identify what must be protected.

Examples:
- vehicle access
- remote commands
- user account
- authentication credentials
- telemetry
- location data
- device identity

## Threats

Consider relevant threats such as:

- Unauthorized remote access
- Credential theft
- Replay attacks
- Session hijacking
- Device impersonation
- Backend compromise
- API abuse
- Physical access to the vehicle node
- Network interception
- Accidental command execution

## Security Requirements

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Authentication / Authorization

Describe:
- who may perform the action
- what authentication is required
- whether fresh authentication is required
- how authorization is checked

## Failure Behavior

Describe what the system must do if:
- authentication fails
- connectivity is lost
- the backend is unavailable
- the vehicle node rejects the request
- the request is duplicated or replayed

## Safety Considerations

Describe any way this feature could affect:
- vehicle access
- electrical systems
- vehicle operation
- occupants
- nearby people or property

## Abuse Cases

List realistic ways this functionality could be misused.

## Mitigations

Document the protections planned for each identified risk.

## Validation

Describe how the security controls will be tested.

## Decision

Record whether this functionality is:
- Approved for implementation
- Approved with conditions
- Deferred
- Rejected

## Definition of Done

- [ ] Threats identified
- [ ] Security requirements documented
- [ ] Abuse cases reviewed
- [ ] Mitigations defined
- [ ] Failure behavior documented
- [ ] Validation approach documented
- [ ] Final security decision recorded
