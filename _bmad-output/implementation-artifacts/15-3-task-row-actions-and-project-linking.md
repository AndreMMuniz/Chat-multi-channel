# Story 15.3: Task Row Actions and Project Linking

## Status
done

## Story
**As an agent,** I want quick actions directly from the tasks list so that I can complete work fast and jump back to the parent project when needed.

## Acceptance Criteria

- Each task row supports `mark done` / `reopen`.
- Each task row exposes a clear `Open Project` action.
- Message-origin tasks preserve provenance visibility in the list or detail surface.
- Task actions update the list reliably without requiring a full page reload.

## Implementation Notes

- Favor inline row actions for the most common operations.
- Preserve the existing project-task edit path instead of creating a parallel editor first.

## Out of Scope

- bulk task actions
- reassignment workflows with advanced permissions
