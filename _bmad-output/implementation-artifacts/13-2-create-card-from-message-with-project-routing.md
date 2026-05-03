# Story 13.2: Create Card from Message with Project Routing

**Status:** in-progress  
**Epic:** 13 — Message-to-Project Operational Bridge  
**Story Points:** 8  
**Priority:** High  
**Created:** 2026-05-03

---

## User Story

**As an operator,** I want to create a project card directly from a message so that customer demands can become tracked work with full provenance.

---

## Scope

Implement the primary contextual action `Create Card` using the real backend message-to-project conversion path.

The flow must support two product cases:

1. If the conversation already belongs to a project:
   - create the card in the backlog of that current project
2. If the conversation does not belong to a project:
   - allow the operator to either:
     - add the card to an existing project
     - create a new project and create the card there

---

## Required Provenance

The created card must preserve:

- source message id
- source conversation id
- actor who created the card
- creation timestamp
- source message snapshot / demand summary
- visible indication that the card originated in `Messages`

---

## Acceptance Criteria

- [ ] `Create Card` is the primary action in the message contextual menu
- [ ] The create-card UI shows the source message preview before confirmation
- [ ] If the conversation already belongs to a project, the card is routed to that project's backlog
- [ ] If the conversation does not belong to a project, the operator can choose existing project or new project
- [ ] Card creation uses the real backend message-to-project flow, not local-only state
- [ ] Success feedback confirms creation and offers a way to open the created card or project

---

## Notes

- Keep the creation UI compact; do not turn this into a full project-management screen.
- If backend changes are needed to support project routing or project creation from this flow, capture them explicitly rather than faking the behavior in the frontend.
