# Story 14.1: Project Task Model and Detail Surface

## Status
done

## Story
**As an agent,** I want to manage tasks inside a project so that I can break a project into actionable execution items.

## Acceptance Criteria

- Each project exposes a dedicated task area in the detail modal or project detail surface.
- Tasks belong to exactly one project and do not appear as independent pipeline cards.
- A task supports title, notes, assignee, priority, due date, and execution status.
- Agents can create, edit, complete, and reopen tasks from the project context.
- Overdue and completed states are visually clear.

## Implementation Notes

- Keep task status distinct from project stage vocabulary.
- Favor a lightweight execution model over a second kanban inside the project.
- Preserve English UI labels throughout.
- Reuse current project modal patterns where possible.

## Out of Scope

- standalone tasks page
- nested subtasks under tasks
- advanced dependency graphs
