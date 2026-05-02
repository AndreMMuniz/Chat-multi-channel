# Story 10.2: Messages Workspace Filters and Channel Identity

**Status:** ready-for-dev
**Epic:** 10 — UX Structural Refresh
**Story Points:** 8
**Priority:** High
**Created:** 2026-05-02

---

## User Story

**As an agent,** I want to filter conversations by channel and tags and recognize channels instantly so that I can triage faster.

---

## Background & Context

**Current state:**
- The conversation list supports search, but lacks explicit channel and tag filters.
- Channel representation still relies partly on generic UI iconography.
- The Messages area is now considered the main operational surface of the product.

**Current code reality:**
- The main inbox lives in `frontend/src/app/page.tsx`.
- Search is already implemented against contact name and channel identifier.
- Channel display currently uses generic Material Symbols logic in multiple places:
  - conversation row channel badge
  - active thread header
  - cross-channel history in the right-side context panel
- The current conversation type only exposes a single `tag?: ConversationTag`, so the current model behaves more like one classification field than a full multi-tag system.

**Approved direction:**
- Add channel filters
- Add tag filters
- Use official channel icons where recognition matters

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/app/page.tsx` | **UPDATE** | Add filter controls and channel markers |
| `frontend/src/types/chat.ts` | **UPDATE if needed** | Keep frontend typing aligned with chosen filter behavior |
| Shared chat/inbox components if extracted | **UPDATE** | Keep filter and row rendering consistent |

---

## UX Structure

### Left Column Control Surface

The top of the conversation list should evolve from:

- search only

to:

- search
- channel filter row
- tag filter row

### Recommended Filter Layout

1. **Search field**
   Existing search remains the first control.

2. **Channel filters**
   Compact horizontal filter chips or icon pills for:
   - `All`
   - `Telegram`
   - `WhatsApp`
   - `Email`
   - `SMS` when applicable
   - `Web` if applicable

3. **Tag filters**
   Compact filter chips for:
   - `All Tags`
   - each supported tag currently exposed by the domain model

### Filter Combination Rules

- Search + channel filter + tag filter must work together.
- `All` resets only its own filter group.
- Filters should not clear the search box unless the user explicitly resets search.

---

## Channel Identity Rules

### Official channel markers

Use official channel icons where recognition matters, especially:

- conversation list row markers
- active thread header
- cross-channel history

### Library direction

- Prefer `react-icons` for official branded channel symbols.
- Avoid generic Material Symbols for branded channels like WhatsApp and Telegram.
- Generic icons may still be acceptable for non-branded product actions such as search, close, attach, send, etc.

### Fallback behavior

If an official brand icon is not available or does not fit a specific channel:

- use a clear fallback icon
- do not mix multiple fallback styles randomly

---

## Behavior Rules

### Search

- Existing search behavior should remain intact.
- Search should continue matching:
  - contact name
  - channel identifier

### Empty states

Support distinct empty states:

- no conversations at all
- no search results
- no matches for the selected channel/tag filters

Recommended messaging:

- `No conversations yet`
- `No results found`
- `No conversations match the selected filters`

### Visual state communication

Conversation rows should preserve or improve visibility of:

- unread state
- SLA risk
- selected row
- assigned/unassigned signals if already available
- tag visibility where helpful

---

## Mobile Considerations

- Filters must remain usable in the mobile list view.
- Avoid a wide multi-row filter layout that pushes the first conversations too far below the fold.
- Horizontal scrolling chips are acceptable if they remain readable and tappable.
- Filter controls must not break the current mobile list/chat transition behavior.

---

## Acceptance Criteria

- [ ] Conversation list includes channel filters
- [ ] Conversation list includes tag filters
- [ ] Supported channels use recognizable official markers where appropriate
- [ ] Filtering updates the visible conversation list correctly
- [ ] Existing inbox interactions still work after filters are introduced
- [ ] Search and filters work together without conflicting
- [ ] Active thread header uses the new channel identity approach
- [ ] Cross-channel history uses the new channel identity approach
- [ ] Mobile list view remains usable after filter controls are added
- [ ] Empty states remain clear for search-only and filtered states

---

## Implementation Notes

- Use `react-icons` for official channel brand icons already available in the project.
- Preserve current search behavior and combine it cleanly with new filters.
- Keep mobile behavior in mind so filters remain usable on smaller screens.

### Scope note on tags

- This story may use the current tag model for filtering if Story `10.3` is not implemented first.
- If only one tag per conversation is currently supported, the UI should still present filtering cleanly without pretending full multi-tag behavior exists.

### Suggested implementation sequence

1. Add local UI state for selected channel and selected tag
2. Extend the existing `filteredConversations` logic
3. Replace generic branded channel markers with official icons
4. Apply the same channel identity logic to thread header and cross-channel history
5. Verify mobile usability and empty states

### Out of Scope

- full tag governance model
- backend redesign for multi-tag conversation relationships
- redesign of the full thread layout outside channel identity updates
