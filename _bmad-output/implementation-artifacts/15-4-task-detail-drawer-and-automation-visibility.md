# Story 15.4: Task Detail Drawer and Automation Visibility

## Status
ready-for-dev

## Story
**As an agent,** I want to inspect task details and automation context from the aggregated workspace so that I can understand execution state without losing my place in the queue.

## Acceptance Criteria

- Selecting a task opens a compact detail surface.
- The detail view shows project context, notes, due date, assignee, and provenance.
- Automation fields and status are visible when the task is scheduled or automated.
- The detail surface does not break the user’s place in the list workflow.

## Implementation Notes

- Prefer a side drawer if feasible; modal is acceptable if it remains lightweight.
- Reuse existing task shape and automation metadata from Epic 14.

## Out of Scope

- full project editor inside the tasks workspace
- complex workflow orchestration UI
