# Story 12.2: Projects CRUD API and Filters

**Status:** ready-for-dev  
**Epic:** 12 — Projects Backend Foundation  
**Story Points:** 8  
**Priority:** High  
**Created:** 2026-05-02

---

## User Story

**As an operator,** I want the `Projects` workspace to load and update real project data so that the kanban no longer depends on local state.

---

## Scope

Implement the first backend API surface for `Projects`, including:

- list projects
- create project
- get project detail
- update project
- delete project
- move stage
- filter support for the existing workspace

---

## Recommended Endpoints

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{project_id}`
- `PATCH /api/projects/{project_id}`
- `PATCH /api/projects/{project_id}/stage`
- `DELETE /api/projects/{project_id}`
- `GET /api/project-stages`

---

## Minimum Filters

`GET /api/projects` should support:

- `search`
- `stage`
- `owner_id`
- `priority`
- `channel`
- `source_type`

---

## Acceptance Criteria

- [ ] Projects can be listed from persisted storage
- [ ] Projects can be created manually
- [ ] Projects can be updated without breaking source linkage fields
- [ ] Projects can be deleted or archived according to chosen backend rule
- [ ] Stage movement is implemented as an explicit backend mutation
- [ ] The API supports the official five stages from Story 12.1
- [ ] Response payloads are shaped for the current card-oriented frontend
- [ ] Invalid stage, priority, or progress values are rejected clearly

---

## Notes

- Avoid over-modeling the contract into a generic CRM abstraction.
- Favor API responses that reduce transformation burden on the current frontend page.
- `PATCH /stage` should remain cheap and predictable for drag-and-drop behavior.
