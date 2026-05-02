# Story 10.1: Main Navigation Architecture Refresh

**Status:** ready-for-dev
**Epic:** 10 — UX Structural Refresh
**Story Points:** 5
**Priority:** High
**Created:** 2026-05-02

---

## User Story

**As a user,** I want the app navigation to reflect stable product domains so that I can understand where each area belongs without relying on historical menu placement.

---

## Background & Context

**Current state:**
- The current menu structure feels historically accumulated rather than domain-oriented.
- `Users` and system configuration concerns are not clearly separated at the top level.
- The product direction now requires English-only navigation labels.

**Current route reality in the codebase:**
- `frontend/src/app/dashboard/`
- `frontend/src/app/admin/`
- `frontend/src/app/login/`
- `frontend/src/app/signup/`
- `frontend/src/app/forgot-password/`
- `frontend/src/app/reset-password/`
- `frontend/src/app/auth/`
- Root route `/` currently behaves as the inbox / messages workspace

**Current nav implementation reality:**
- `SideNavBar.tsx` currently exposes only `Dashboard` and `Inbox` as primary items
- user/admin destinations are surfaced as mixed admin links rather than domain-oriented sections
- the nav still uses old grouping assumptions that predate the UX structural refresh

**Approved target navigation:**
- `Dashboard`
- `Messages`
- `Projects`
- `Catalog`
- `Tasks`
- `Users`
- `Config`

**Interpretation for rollout:**
- `Messages` should map to the current root inbox route `/`
- `Users` should become the entry point for user-administration flows currently under `/admin/*`
- `Config` should become the entry point for system settings currently under `/admin/settings`
- `Projects`, `Catalog`, and `Tasks` may start as stable placeholder destinations if full modules are not yet implemented

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/components/SideNavBar.tsx` | **UPDATE** | Reorganize top-level items and labels |
| `frontend/src/components/ClientLayout.tsx` or equivalent | **UPDATE if needed** | Ensure new nav grouping renders correctly |
| Route-level layout files | **UPDATE if needed** | Preserve access flows while remapping nav destinations |
| Placeholder route pages | **CREATE if needed** | For `Projects`, `Catalog`, `Tasks`, `Users`, or `Config` landing surfaces where missing |

---

## Route Strategy

### Primary mapping

Use this target mapping unless implementation constraints require a small variation:

| Navigation Item | Preferred Route | Notes |
|------|--------|-------|
| `Dashboard` | `/dashboard` | Existing route |
| `Messages` | `/` | Existing inbox route |
| `Projects` | `/projects` | Placeholder allowed initially |
| `Catalog` | `/catalog` | Placeholder allowed initially |
| `Tasks` | `/tasks` | Placeholder allowed initially |
| `Users` | `/users` or `/admin/users` | Prefer top-level entry, preserve existing admin internals if needed |
| `Config` | `/config` or `/admin/settings` | Prefer top-level entry, preserve existing admin internals if needed |

### Compatibility rule

- Do not break current working routes if a cleaner top-level route cannot be introduced immediately.
- If aliases or redirects are added, they should preserve existing deep links.
- Avoid large route refactors in this story if the value is only cosmetic.

---

## Acceptance Criteria

- [ ] Main navigation is reorganized to the approved domain model
- [ ] All top-level menu labels are in English
- [ ] `Users` and `Config` are separate top-level entries
- [ ] Existing core routes remain reachable after the refresh
- [ ] No unrelated admin/config links remain scattered in the main nav
- [ ] `Messages` is used instead of `Inbox`
- [ ] Placeholder destinations are visually stable if a full module does not yet exist
- [ ] The navigation communicates future product structure without confusing current access paths

---

## Implementation Notes

- Prefer preserving route compatibility where possible.
- If a domain does not yet have a fully implemented page, use a stable placeholder route rather than overloading another menu area.
- Keep icon treatment consistent with the future visual-system stories.

### Placeholder guidance

If placeholder pages are needed for `Projects`, `Catalog`, or `Tasks`, they should:

- use English-only labels
- clearly identify the domain
- avoid fake functionality
- provide a stable landing page rather than a broken or empty route

### Users / Config transition guidance

- The nav item should establish the new domain ownership even if the underlying pages still live under `admin/` temporarily.
- This story does not need to complete the internal lateral navigation of those areas. That work belongs to Stories `10.4` and `10.5`.

### Out of Scope

- full implementation of `Projects`
- full implementation of `Catalog`
- full implementation of `Tasks`
- internal section navigation for `Users`
- internal section navigation for `Config`

---

## Definition of Done

- main nav reflects the approved product structure
- English labels are applied consistently
- route access remains stable
- future domains have either working entries or clear placeholders
- `Users` and `Config` are visually separated from general navigation clutter
