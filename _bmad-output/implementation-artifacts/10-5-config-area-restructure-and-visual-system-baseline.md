# Story 10.5: Config Area Restructure and Visual System Baseline

**Status:** ready-for-dev
**Epic:** 10 — UX Structural Refresh
**Story Points:** 8
**Priority:** High
**Created:** 2026-05-02

---

## User Story

**As an admin,** I want configuration settings grouped and visually standardized so that system-level setup is easier to scan and scale.

---

## Background & Context

**Current state:**
- The settings area exists, but the new UX direction requires a stronger configuration architecture.
- The visual refresh requires a shared design-system baseline, especially around the new indigo direction.

**Current code reality:**
- `frontend/src/app/admin/settings/page.tsx` already contains a local internal tab system:
  - `General`
  - `Visual Identity`
  - `AI Configuration`
  - `API Settings`
- Channel-specific settings are currently embedded inside the `API Settings` area rather than represented as a first-class `Channels` section.
- The current visual styling in settings heavily depends on hard-coded purple values like `#7C4DFF` and related hover/focus variants.
- `frontend/src/app/globals.css` still exposes a purple-led token system (`--color-primary`, `--color-primary-container`, `--color-surface-tint`, etc.).

**Approved sections inside `Config`:**
- `General`
- `Visual Identity`
- `Channels`
- `AI Configuration`
- `API Settings`

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/app/admin/settings/page.tsx` | **UPDATE** | Rework structure around stable lateral navigation |
| `frontend/src/app/globals.css` | **UPDATE** | Introduce indigo-led tokens where shared styling is touched |
| `frontend/src/app/admin/layout.tsx` or Config-specific wrapper | **UPDATE if needed** | Support Config-domain framing separate from Users |
| Shared admin/layout components | **UPDATE if needed** | Support Config-specific navigation and styling |

---

## Target Structure

### Config domain sections

The `Config` area should expose these sections clearly:

- `General`
- `Visual Identity`
- `Channels`
- `AI Configuration`
- `API Settings`

### Section ownership rule

- `Channels` should become its own first-class section instead of being visually buried inside generic API configuration.
- System configuration belongs here.
- User and access administration do not belong here.

### Current-to-target interpretation

The existing settings page does not need a full route explosion immediately.

This story may implement:

- one stable Config landing surface
- left-side internal navigation
- section grouping inside that surface

before introducing more granular route segmentation later, if needed.

---

## Navigation Pattern

### Desktop

- left-side internal navigation
- active section clearly highlighted
- content area on the right

### Mobile

- preserve current mobile usability
- horizontal-scroll tabs may be replaced only if the new pattern remains usable
- do not regress the mobile-admin responsiveness work already delivered

### Section migration rule

The move from top tabs / local tab strip to a stronger left-side navigation should not make settings slower to use.

---

## Acceptance Criteria

- [ ] `Config` becomes a distinct top-level domain
- [ ] Internal left-side navigation exists for the approved settings sections
- [ ] Indigo / deep blue tokens are introduced for shared surfaces touched by this story
- [ ] Configuration labels remain fully in English
- [ ] Shared icon rules are applied consistently in updated configuration UI
- [ ] `Channels` is represented as a first-class section
- [ ] Hard-coded purple values in touched settings surfaces are replaced or aligned with shared tokens
- [ ] Config remains clearly separated from Users/admin-person management concerns
- [ ] Mobile usability is preserved after the internal-nav restructure

---

## Implementation Notes

- This story establishes the baseline visual system for later UI migration.
- Avoid replacing isolated colors without introducing or aligning shared tokens.

### Design token baseline

This story should establish at least the first safe layer of indigo migration for shared UI tokens.

Minimum expectation:

- define or update primary brand tokens toward indigo / deep blue
- align focus, hover, and active states in touched Config surfaces
- avoid a half-migrated mix of new indigo with old purple inside the same screen

### Safe migration guidance

Do not attempt to recolor the full app in this story.

Instead:

1. update shared tokens in `globals.css`
2. migrate the Config area to those tokens
3. preserve compatibility for untouched screens

### Channel section guidance

If implementation speed matters, `Channels` can initially become a grouped section that contains:

- Telegram
- WhatsApp
- Email
- SMS

without yet splitting each channel into its own route.

### Recommended implementation sequence

1. Introduce or rename indigo-led shared tokens
2. Refactor the settings page into Config-domain internal navigation
3. Promote `Channels` into an explicit section
4. Replace hard-coded purple values in touched areas with token-based styling
5. Verify desktop and mobile usability

### Out of Scope

- full app-wide color migration
- full icon migration across every screen
- backend configuration redesign
- deep route refactor for every Config subsection
