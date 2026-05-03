# Story 15.1: Aggregated Project Tasks API and Filters

## Status
done

## Story
**As an agent,** I want an aggregated tasks API across projects so that the `Tasks` workspace can load my operational queue efficiently.

## Acceptance Criteria

- Backend exposes a task-list endpoint across projects.
- Endpoint supports filters for `project`, `assignee`, `created_by`, and `status`.
- Response includes parent project summary for each task.
- The API shape is compatible with a list-first frontend workspace.

## Implementation Notes

- Reuse the existing `ProjectTask` domain.
- Do not create a separate standalone task entity.
- Prefer a single aggregated query over client-side project-by-project loading.

## Out of Scope

- task comments
- task attachments
- manager analytics beyond lightweight counts
