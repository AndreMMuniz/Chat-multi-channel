# Story 12.3: Message-to-Project Conversion Flow

**Status:** ready-for-dev  
**Epic:** 12 — Projects Backend Foundation  
**Story Points:** 5  
**Priority:** High  
**Created:** 2026-05-02

---

## User Story

**As an operator,** I want to turn a real message demand into a project so that project cards can originate from live omnichannel work.

---

## Scope

Implement explicit backend support for converting a message demand into a project, including:

- source validation
- source linkage persistence
- basic context hydration from message/conversation
- API response ready for the projects workspace

---

## Recommended Endpoint

- `POST /api/projects/from-message/{message_id}`

Alternative accepted only if semantically clear:

- `POST /api/projects` with explicit `source_type=message` and `source_message_id`

---

## Required Persisted Provenance

- `source_type = message`
- `source_message_id`
- `source_conversation_id`
- derived source channel when available
- derived contact context when available

---

## Acceptance Criteria

- [ ] A real backend action can create a project from a real message
- [ ] The new project persists explicit origin linkage
- [ ] The workflow rejects missing or invalid source records clearly
- [ ] The created project returns enough context for the frontend to show message-origin badges or references
- [ ] Moving or editing the project later does not erase its message provenance

---

## Notes

- This story is a first-class Omnichat integration requirement, not optional polish.
- Do not collapse project state into the message model itself.
- Message remains message; project remains project; the linkage is explicit.
