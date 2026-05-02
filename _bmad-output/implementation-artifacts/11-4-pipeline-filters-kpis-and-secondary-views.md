# Story 11.4: Pipeline Filters, KPIs, and Secondary Views

**Status:** ready-for-dev  
**Epic:** 11 — Projects / Pipeline Kanban  
**Story Points:** 5  
**Priority:** Medium  
**Created:** 2026-05-02

---

## User Story

**As an operator or manager,** I want to filter the pipeline and see high-level project metrics so that I can quickly focus on the right projects and demands.

---

## Scope

Complete the supporting operational layer of the Projects workspace:

- filters for:
  - search
  - owner
  - priority
  - channel
  - origin type when relevant
- KPI strip
- `List` and `Timeline` secondary views if feasible in this epic

---

## Acceptance Criteria

- [ ] The workspace includes functional filters for core project dimensions
- [ ] Clear-all behavior is available
- [ ] A KPI summary strip surfaces basic pipeline totals and health
- [ ] The workspace can distinguish conversation-originated demand cards from manually created projects when that data exists
- [ ] `List` and/or `Timeline` views are available if included in scope
- [ ] Secondary views remain visually consistent with the kanban workspace
- [ ] The workspace leaves room for future integration with `Tasks` and CRM features

---

## Notes

- If time is limited, prioritize filters and KPI strip before the secondary views.
- Keep the first KPI layer compact and decision-oriented.
- Origin-aware filtering should not make the first release feel like a separate `Tasks` module.
