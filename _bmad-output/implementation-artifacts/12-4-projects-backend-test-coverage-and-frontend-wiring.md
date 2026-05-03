# Story 12.4: Projects Backend Test Coverage and Frontend Wiring

**Status:** ready-for-dev  
**Epic:** 12 — Projects Backend Foundation  
**Story Points:** 5  
**Priority:** High  
**Created:** 2026-05-02

---

## User Story

**As a developer,** I want test coverage and frontend integration for the new Projects backend so that the page can be validated with real persisted data safely.

---

## Scope

Close the loop between backend and frontend by:

- adding service/API tests for `Projects`
- removing local-only data dependency from the current Projects page
- loading stage and project data from real endpoints
- preserving usable empty/error states

---

## Minimum Test Coverage

- create project manually
- reject invalid `source_type=message` creation without source reference
- create project from valid message
- reject invalid message conversion
- list projects with `stage` filter
- list projects with `channel` filter
- update project
- move stage
- reject invalid progress values
- delete project

---

## Acceptance Criteria

- [ ] Backend service tests cover core business rules
- [ ] Backend API tests cover CRUD, filters, stage movement, and message conversion
- [ ] The Projects frontend consumes backend data instead of relying on local seeded state
- [ ] The official stage vocabulary is preserved end-to-end
- [ ] Empty state remains clear when no real projects exist
- [ ] Error handling does not break the workspace shell

---

## Notes

- Keep frontend wiring aligned with the current app patterns for auth and API access.
- Avoid reintroducing seeded mock data after backend integration lands.
