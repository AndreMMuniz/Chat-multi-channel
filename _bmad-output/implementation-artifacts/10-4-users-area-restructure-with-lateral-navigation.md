# Story 10.4: Users Area Restructure with Lateral Navigation

**Status:** ready-for-dev
**Epic:** 10 — UX Structural Refresh
**Story Points:** 5
**Priority:** Medium
**Created:** 2026-05-02

---

## User Story

**As an admin,** I want user administration grouped in one coherent area so that I can manage users, roles, and audit flows without jumping across disconnected pages.

---

## Background & Context

**Current state:**
- User-related admin flows are available, but navigation feels fragmented.
- The approved IA separates `Users` from `Config`.

**Current code reality:**
- `frontend/src/app/admin/layout.tsx` is currently only a thin wrapper with no internal navigation.
- Current admin pages include:
  - `admin/users`
  - `admin/user-types`
  - `admin/audit`
  - `admin/quick-replies`
  - `admin/settings`
- This means the current admin area behaves like a bucket of pages rather than a domain-oriented workspace.

**Approved sections inside `Users`:**
- `User Management`
- `User Types`
- `Audit Logs`

**Scope interpretation:**
- `Users` should become the home for people / access administration.
- `Config` should own system configuration concerns.
- `Quick Replies` should not be silently absorbed into `Users` if it behaves more like an operational/system tool than user administration.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/app/admin/layout.tsx` or replacement | **UPDATE** | Add left-side internal navigation |
| `frontend/src/app/admin/page.tsx` | **UPDATE if needed** | Convert into Users-area landing or redirect |
| `frontend/src/app/admin/users/page.tsx` | **UPDATE if needed** | Align with new internal structure |
| `frontend/src/app/admin/user-types/page.tsx` | **UPDATE if needed** | Align with new internal structure |
| `frontend/src/app/admin/audit/page.tsx` | **UPDATE if needed** | Align with new internal structure |
| Shared admin navigation component | **CREATE if needed** | Reuse across Users-area pages |

---

## Target Structure

### Users domain

The `Users` area should group these sections:

- `User Management`
- `User Types`
- `Audit Logs`

### Not part of Users

The following should remain outside this domain:

- `Settings` / system configuration
- future channel and AI configuration

### Open classification question

`Quick Replies` should be explicitly classified during implementation:

- if treated as operational content tooling, it should stay outside `Users`
- if treated as admin-only controlled messaging assets, it may later deserve its own section or move under `Config`

For this story, do **not** force `Quick Replies` into `Users` unless there is a strong product reason discovered during implementation.

---

## Navigation Pattern

### Desktop

- left-side internal navigation for the full `Users` area
- active section clearly highlighted
- content panel to the right

### Mobile

- preserve usability through responsive adaptation
- a top bar + collapsible navigation pattern is acceptable
- do not regress the mobile-admin responsiveness work already delivered in Epic 9

### Landing behavior

The `Users` top-level entry should lead to:

- a stable landing page for the domain
- or redirect to `User Management` if a separate landing page adds no value

Avoid dead-end routes.

---

## Acceptance Criteria

- [ ] `Users` becomes a distinct top-level domain
- [ ] Internal left-side navigation exists for User Management, User Types, and Audit Logs
- [ ] Existing functionality remains reachable
- [ ] The structure can scale to future user-admin sections
- [ ] `Settings` is no longer mixed into the same internal structure
- [ ] `Quick Replies` is explicitly left outside `Users` unless intentionally classified otherwise
- [ ] `admin/page.tsx` resolves into a coherent landing or redirect behavior
- [ ] Mobile usability is preserved after the restructure

---

## Implementation Notes

- Reuse layout patterns rather than cloning page-specific nav logic.
- Keep English labels consistent across the full Users area.

### Recommended implementation sequence

1. Define the internal nav model for the Users domain
2. Add the reusable lateral navigation shell to the admin layout or a Users-specific wrapper
3. Route `admin/page.tsx` to the correct landing behavior
4. Move `users`, `user-types`, and `audit` under the shared structure
5. Verify mobile behavior and active-section highlighting

### Out of Scope

- full Config-area restructure
- visual token overhaul for all admin surfaces
- final product decision for Quick Replies long-term ownership beyond explicit non-inclusion in `Users`
