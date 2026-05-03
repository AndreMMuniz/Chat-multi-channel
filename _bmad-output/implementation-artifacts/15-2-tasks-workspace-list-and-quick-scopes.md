# Story 15.2: Tasks Workspace List and Quick Scopes

## Status
ready-for-dev

## Story
**As an agent,** I want a dedicated `Tasks` workspace with quick scopes so that I can manage my execution queue without opening each project individually.

## Acceptance Criteria

- `Tasks` menu opens a list-style workspace.
- Workspace exposes quick scopes for `Assigned to me`, `Created by me`, `Overdue`, `Scheduled`, and `Done`.
- The main list shows task title, project, assignee, status, priority, and due date.
- Empty states remain useful and operationally clear.

## Implementation Notes

- Keep the visual language aligned with `Projects` and the indigo operational system.
- This is a productivity surface, not a second pipeline.
- Prefer dense scanning over decorative layout.

## Out of Scope

- board or kanban view for tasks
- global task dashboard separate from the list
