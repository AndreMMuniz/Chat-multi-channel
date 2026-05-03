# Story 13.3: Message Tag, Delete, and Quick Reply Actions

**Status:** done  
**Epic:** 13 — Message-to-Project Operational Bridge  
**Story Points:** 5  
**Priority:** High  
**Created:** 2026-05-03

---

## User Story

**As an operator,** I want contextual actions for tagging, deleting, and turning my own messages into quick replies so that the message bubble becomes an operational control point.

---

## Scope

Implement the non-primary message contextual actions:

- `Add Tag`
- `Delete`
- `Create Quick Reply`

Behavior rules:

- `Create Quick Reply` only appears for operator-sent messages
- `Create Quick Reply` does not appear for inbound/customer messages
- `Delete` requires confirmation
- `Add Tag` should stay lightweight and aligned with the current tag model

---

## Acceptance Criteria

- [ ] `Add Tag` can be triggered from the message contextual menu
- [ ] `Delete` is available only where deletion is allowed and requires explicit confirmation
- [ ] `Create Quick Reply` appears only for operator-authored messages
- [ ] Inbound messages do not show `Create Quick Reply`
- [ ] These actions do not break the new contextual menu interaction model
- [ ] The action ordering still keeps `Create Card` as the primary item in the overall menu

---

## Notes

- Avoid redesigning the full quick-reply system in this story.
- Keep destructive styling visually separated from constructive actions.
