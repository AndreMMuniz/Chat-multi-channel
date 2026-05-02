# Story 11.3: Project Create/Edit and Stage Movement

**Status:** ready-for-dev  
**Epic:** 11 — Projects / Pipeline Kanban  
**Story Points:** 5  
**Priority:** High  
**Created:** 2026-05-02

---

## User Story

**As an operator,** I want to create, edit, and move projects between stages so that the pipeline is operational rather than static.

---

## Scope

Add interactive project management to the kanban workspace:

- create project flow
- edit project flow
- drag-and-drop stage movement
- modal or sheet for project details
- support for project creation from a conversation demand

---

## Acceptance Criteria

- [ ] Users can create a new project from the workspace
- [ ] Users can open an existing project and edit its fields
- [ ] Users can move a project between columns
- [ ] The model supports a project card created from a marked message demand
- [ ] Drag-over and drop states are clearly visible
- [ ] The UI does not require leaving the `Projects` workspace to manage a project
- [ ] English labels are maintained throughout

---

## Notes

- If delete behavior is included, keep it secondary and deliberate.
- Do not introduce CRM automation in this story.
- Message-to-project creation can begin with local/mock linking if backend support lands later.
