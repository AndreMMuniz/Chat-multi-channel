# Story 14.4: Task Visibility and Productivity Views

## Status
ready-for-dev

## Story
**As an agent,** I want to see open and overdue project tasks clearly so that I can focus on next actions without losing project context.

## Acceptance Criteria

- Project detail shows task counts by state.
- The projects workspace exposes lightweight open/overdue task visibility.
- Agents can filter or sort tasks inside a project context.
- Task summaries help the agent understand immediate execution load.

## Implementation Notes

- Keep this as a supporting layer inside `Projects`, not a competing top-level workspace.
- Favor compact summaries and indicators over a second full dashboard.
- Reuse existing indigo visual language and dense operational patterns.

## Out of Scope

- dedicated global tasks workspace
- manager-only analytics suite for tasks
