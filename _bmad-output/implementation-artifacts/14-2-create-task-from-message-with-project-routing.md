# Story 14.2: Create Task from Message with Project Routing

## Status
ready-for-dev

## Story
**As an agent,** I want to create a task from a message so that I can convert a concrete request into executable work without losing provenance.

## Acceptance Criteria

- The message contextual menu includes `Create Task`.
- If the conversation already belongs to a project, the task is created under that project.
- If the conversation does not belong to a project, the operator can choose an existing project or create a new project context first.
- The created task stores source conversation and source message references.
- The UI gives clear confirmation and a way to open the project context after task creation.

## Implementation Notes

- Reuse the routing logic established for `Create Card` where it still applies.
- Preserve source message excerpt for operator confidence.
- Avoid making the operator choose both project and card when only a task is needed.

## Out of Scope

- bulk task creation from multiple messages
- task templates
