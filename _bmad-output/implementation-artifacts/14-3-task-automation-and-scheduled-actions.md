# Story 14.3: Task Automation and Scheduled Actions

## Status
ready-for-dev

## Story
**As an agent,** I want to automate selected tasks so that follow-ups and operational actions can happen at the right time.

## Acceptance Criteria

- A task can optionally define a scheduled automation.
- The initial automation types support sending a message later or triggering a scheduled internal action.
- Scheduled tasks show automation state clearly in the project context.
- Failed scheduled actions surface useful operational feedback.
- Task provenance remains intact even when automation is attached.

## Implementation Notes

- Start with narrow automation types and explicit scheduling fields.
- Keep manual task execution possible even when automation exists.
- Scheduled messaging should align with existing outbound channel behavior where relevant.

## Out of Scope

- branching automation trees
- external automation providers
- cross-project automation dependencies
