# Message Actions and Project Conversion Specification

**Created:** 2026-05-03  
**Status:** Draft for Epic 13  
**Source references:** Party mode roundtable 2026-05-03, Epic 10 `Messages`, Epic 11 `Projects`, Epic 12 backend foundation

---

## Objective

Add contextual actions directly to each message bubble so operators can turn live conversation content into structured work without leaving the `Messages` workspace.

This feature is the operational bridge between `Messages` and `Projects`.

---

## Core Interaction Rule

Each message bubble should support a lightweight contextual action trigger.

- on desktop, hover reveals a subtle `+` action
- clicking `+` opens a contextual menu anchored to the message
- the menu must not shift layout or break reading flow
- only one message action menu may stay open at a time
- clicking outside closes the menu

For touch/mobile, the equivalent trigger may be implemented as long-press or selected-message action, but desktop hover is the first-release baseline.

---

## First-Release Menu Actions

The first-release contextual menu supports:

- `Create Card`
- `Add Tag`
- `Delete`
- `Create Quick Reply`

### Visibility rules

- `Create Card`: available for relevant messages in the conversation timeline
- `Add Tag`: available for relevant messages in the conversation timeline
- `Delete`: available only when the user is allowed to delete the message
- `Create Quick Reply`: available only for messages sent by the operator/agent

`Create Quick Reply` must not appear for inbound customer messages.

---

## Product Rule for Create Card

`Create Card` is the primary action in the contextual menu.

Creating a card from a message must preserve provenance explicitly:

- source message id
- source conversation id
- actor who created the card
- creation timestamp
- visible reference that the card came from `Messages`
- snapshot text or demand summary derived from the source message

This flow must use the real backend path for message-to-project conversion rather than local-only card creation.

---

## Supported Creation Cases

### Case 1: Conversation already belongs to a project

If the current conversation is already associated with a project:

- the created card must be added to the backlog of that existing project
- the project destination should be clear to the operator before confirmation
- the stage should default to the project backlog entry point

### Case 2: Conversation does not yet belong to a project

If the conversation is new and not associated with a project:

- the operator must be able to choose:
  - add the card to an existing project
  - create a new project and create the card inside it

The UI should keep this choice lightweight, not a full project-management detour.

---

## Recommended First-Release Flow for Create Card

1. Hover message bubble
2. Click `+`
3. Select `Create Card`
4. Open a compact modal or side panel with:
   - source message preview
   - suggested title
   - project destination
   - initial stage/backlog destination
   - optional demand summary
5. Confirm creation
6. Show success feedback with a path to open the created card or project

---

## UX Constraints

- `Create Card` must be visually primary inside the menu
- destructive action (`Delete`) must be visually separated from constructive actions
- the action menu must reposition safely near viewport edges
- long messages must not be covered in a way that breaks comprehension
- if a card already exists from the same message, the system may still allow another card, but should preserve traceability

---

## Out of Scope for First Release

- batch creation from multiple messages
- selecting partial text inside a message to create multiple cards
- advanced automation or AI classification during card creation
- reorderable action menus by role
- full quick-reply authoring workflow redesign
- rich relationship graph between one message and many downstream entities

---

## Epic 13 Story Shape

- `13.1` Message bubble contextual action trigger and anchored menu
- `13.2` Create-card flow from message with project-aware destination rules
- `13.3` Tag, delete, and quick-reply contextual actions with message-type visibility rules
