# Story 11.2: Kanban Board Columns and Deal Cards

**Status:** ready-for-dev  
**Epic:** 11 — Projects / Pipeline Kanban  
**Story Points:** 5  
**Priority:** High  
**Created:** 2026-05-02

---

## User Story

**As an operator,** I want to see opportunities organized by stage in a kanban board so that I can understand the pipeline at a glance.

---

## Scope

Implement the first real kanban surface inside `Projects`, including:

- initial fixed columns:
  - `Lead`
  - `Qualification`
  - `Proposal`
  - `Negotiation`
  - `Closed`
- deal cards with:
  - title
  - id/ticket
  - value
  - owner
  - channel
  - priority
  - tags
  - due date
  - progress

---

## Acceptance Criteria

- [ ] The default `Projects` view is a kanban board
- [ ] The first release includes the initial five pipeline stages
- [ ] Cards present a readable hierarchy, with title and value emphasized
- [ ] Channel, priority, and tags are visible but secondary
- [ ] Overdue or time-sensitive cards are visually distinguishable
- [ ] The board is horizontally usable on smaller screens without breaking layout

---

## Notes

- Local or mocked state is acceptable if the backend project domain does not exist yet.
- Use reusable metadata mapping for channel, priority, and tag presentation.

