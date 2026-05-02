# Story 10.3: Tag System Foundation for CRM Readiness

**Status:** ready-for-dev
**Epic:** 10 — UX Structural Refresh
**Story Points:** 8
**Priority:** High
**Created:** 2026-05-02

---

## User Story

**As an operator,** I want tags to act as a real organizational layer so that conversations can be segmented, filtered, and prepared for future CRM workflows.

---

## Background & Context

**Current state:**
- Tags exist conceptually, but behave more like light metadata than a system.
- The Messages redesign depends on tags being filterable and operationally meaningful.

**Current code reality:**
- Backend currently models a single optional `tag` on `Conversation`, not a multi-tag relationship.
- Frontend mirrors this with `tag?: ConversationTag`.
- Current available tag values are:
  - `SUPPORT`
  - `BILLING`
  - `FEEDBACK`
  - `SALES`
  - `GENERAL`
  - `SPAM`
- The active conversation details already display the current tag, but tags are not yet treated as a first-class operational control surface.

**Strategic direction:**
- Tags are not decorative badges.
- Tags should support scanning, filtering, and future CRM segmentation.

---

## Scope Decision

This story should implement the minimum viable tag foundation and document the chosen scope clearly:

- start with a **single-tag-per-conversation foundation**
- treat that tag as operational metadata rather than decoration
- prepare the UI and implementation style so a future multi-tag or governed-tag model remains possible

**Explicit decision for this story:**
- Do **not** introduce full CRM-grade tag governance yet.
- Do **not** introduce multi-tag relationships yet unless implementation discovery shows it is unexpectedly cheap and safe.
- Do create a clean foundation that can evolve later.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/app/page.tsx` | **UPDATE** | Surface tags consistently in Messages |
| `frontend/src/types/chat.ts` | **UPDATE if needed** | Keep tag typing explicit and reusable |
| `backend/app/models/models.py` | **REVIEW / UPDATE if needed** | Keep current single-tag model explicit |
| `backend/app/schemas/chat.py` | **REVIEW / UPDATE if needed** | Align update/read schemas if needed |

---

## Acceptance Criteria

- [ ] Tags are displayed consistently in the Messages workspace
- [ ] Tags can be used as active filters
- [ ] The chosen tag scope is documented and reflected in implementation
- [ ] Tags are treated as operational metadata, not cosmetic-only UI
- [ ] The current implementation clearly supports one tag per conversation
- [ ] The UI does not imply multi-tag support if the backend does not support it
- [ ] Tag naming and presentation are consistent across list, thread, and detail surfaces

---

## Implementation Notes

- Coordinate closely with Story 10.2 because tag filtering belongs in the same user flow.
- If richer tag governance is not implemented yet, avoid hard-coding assumptions that would block later expansion.

### Minimum viable foundation for this story

This story should make the current tag model feel intentional by adding:

- consistent tag display in conversation rows where useful
- consistent tag display in the active conversation context
- tag filter controls in the Messages workspace
- clear empty-state behavior when a tag filter yields no matches

### Presentation rules

- Tag labels should be human-readable, not raw enum noise where avoidable.
- Color treatment should help recognition, but should not suggest a full governed taxonomy if one does not yet exist.
- Tags should be visible enough to support scanning, but not visually overpower contact/channel/status information.

### Recommended tag display mapping

Use a predictable display transformation or mapping for current values such as:

- `SUPPORT` → `Support`
- `BILLING` → `Billing`
- `FEEDBACK` → `Feedback`
- `SALES` → `Sales`
- `GENERAL` → `General`
- `SPAM` → `Spam`

### Future-safe guidance

When implementing this story, avoid choices that would make future expansion difficult, including:

- hard-coding tag display only in one component
- assuming tags can never become multi-valued
- coupling tag colors too tightly to current enum values without a mapping layer

### Suggested implementation sequence

1. Define a frontend mapping layer for tag display metadata
2. Reuse that mapping in Messages list, thread context, and filters
3. Add tag-filter state and behavior in coordination with Story `10.2`
4. Verify the current API and schema support the intended filtering/display flow
5. Document explicitly that this release supports one tag per conversation

### Out of Scope

- full multi-tag relationship model
- admin-managed tag CRUD
- tag automation rules
- CRM workflow automation by tag
