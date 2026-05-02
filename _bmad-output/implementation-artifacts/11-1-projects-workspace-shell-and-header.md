# Story 11.1: Projects Workspace Shell and Header

**Status:** ready-for-dev  
**Epic:** 11 — Projects / Pipeline Kanban  
**Story Points:** 3  
**Priority:** High  
**Created:** 2026-05-02

---

## User Story

**As an operator,** I want the `Projects` area to open into a real workspace shell so that the domain feels active and ready for pipeline work instead of acting like a placeholder.

---

## Scope

Replace the current placeholder in `frontend/src/app/projects/page.tsx` with a proper workspace shell that includes:

- page header
- view toggle area
- primary action for new project/deal
- filters row container
- reserved area for KPI strip
- reserved content area for the pipeline views

---

## Acceptance Criteria

- [ ] `Projects` no longer renders a placeholder-only page
- [ ] The page header matches the new product language and indigo visual direction
- [ ] The shell includes clear structure for `Kanban`, `List`, and `Timeline` views
- [ ] The shell provides a visible `New Deal` primary action
- [ ] All visible labels are in English
- [ ] The layout works on desktop and remains usable on mobile

---

## Notes

- This story establishes structure only; real board behavior can land in follow-up stories.
- Preserve the overall direction from `.models-exemple/Pipeline Kanban.html`, but adapt it to app conventions.

