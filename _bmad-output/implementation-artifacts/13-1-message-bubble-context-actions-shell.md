# Story 13.1: Message Bubble Context Actions Shell

**Status:** done  
**Epic:** 13 — Message-to-Project Operational Bridge  
**Story Points:** 5  
**Priority:** High  
**Created:** 2026-05-03

---

## User Story

**As an operator,** I want each message bubble to expose contextual actions on hover so that I can act on conversation content without leaving the `Messages` workspace.

---

## Scope

Build the message-level contextual action shell inside `frontend/src/app/page.tsx`.

The first release should include:

- subtle `+` reveal on hover
- anchored contextual menu
- click-outside close
- single-open-menu behavior
- safe positioning near viewport edges
- desktop-first implementation without breaking current message reading flow

---

## Acceptance Criteria

- [ ] Hovering a message bubble reveals a lightweight `+` trigger
- [ ] Clicking the trigger opens a contextual menu anchored to that message
- [ ] Opening one menu closes any other open message-action menu
- [ ] Clicking outside closes the menu cleanly
- [ ] The new interaction does not shift message layout
- [ ] The trigger and menu stay visually integrated with the current Omnichat message UI

---

## Notes

- Keep the interaction subtle; this is a contextual capability, not a global toolbar.
- Plan for touch/mobile parity later, but do not block the desktop-first release on long-press behavior.
