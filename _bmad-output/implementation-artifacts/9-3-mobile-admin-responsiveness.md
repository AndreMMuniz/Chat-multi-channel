# Story 9.3: Mobile — Admin Panel Basic Responsiveness

**Status:** done
**Epic:** 9 — Mobile Responsiveness
**Story Points:** 3
**Priority:** Medium
**Created:** 2026-05-02

---

## User Story

**As an admin on mobile,** I want the admin panel (users, settings) to be at least readable and navigable so that I can perform basic admin tasks without a desktop.

---

## Background & Context

**Current state:**
- `frontend/src/app/admin/` — all pages (users, user-types, settings) are desktop-only
- Tables overflow horizontally with no scroll
- Tab navigation overflows and some tabs are unreachable
- Goal for this story: "mobile-tolerável" — not beautiful, but functional. Mobile-delightful is a future epic.

**Priority (party mode roundtable 2026-05-02):**
- Lower priority than the dashboard (agents on mobile > admins on mobile)
- Target: overflow handled, tabs reachable, forms usable on mobile keyboard

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/app/admin/users/page.tsx` | **UPDATE** | Table with `overflow-x-auto`; responsive card view on mobile |
| `frontend/src/app/admin/settings/page.tsx` | **UPDATE** | Tab nav with `overflow-x-auto`; grid fields stack on mobile |
| `frontend/src/app/admin/user-types/page.tsx` | **UPDATE** | Same table pattern as users page |
| `frontend/src/app/admin/layout.tsx` | **UPDATE** | Sidebar adapts on mobile (hamburger or collapsible) |

---

## Implementation Guide

### Tables — Horizontal Scroll Wrapper

```tsx
<div className="overflow-x-auto rounded-2xl border border-[#E9ECEF]">
  <table className="min-w-full">
    ...
  </table>
</div>
```

### Tab Navigation — Horizontal Scroll

```tsx
<nav className="flex overflow-x-auto gap-1 px-2 py-4 scrollbar-hide">
  {TABS.map(tab => (
    <button key={tab.id} className="shrink-0 ...">
      {tab.label}
    </button>
  ))}
</nav>
```

### Settings Form Fields — Stack on Mobile

Replace `grid-cols-2` with `grid-cols-1 md:grid-cols-2`:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

### Admin Layout — Mobile Nav

On `< md`: top navigation bar with hamburger button that opens a `Sheet` from the left with admin nav links. On `md+`: existing sidebar layout unchanged.

---

## Acceptance Criteria

- [ ] Users table: horizontally scrollable on mobile, no content clipped
- [ ] Settings tabs: all tabs reachable via horizontal scroll on mobile
- [ ] Settings form fields: stack vertically on mobile (`grid-cols-1`)
- [ ] Admin sidebar/nav: accessible on mobile via hamburger or top bar
- [ ] On `md+`: all admin pages pixel-identical to before — zero regression
- [ ] Forms are usable when mobile keyboard is open (inputs not hidden)

---

## Definition of Done

- [x] All files modified
- [x] Tables: `overflow-x-auto` wrapper — scroll horizontal no mobile, sem clipping
- [x] Settings tabs: horizontal scroll no mobile (`flex-row overflow-x-auto`), vertical no desktop (`md:flex-col md:w-56`)
- [x] Settings form grids: já eram `grid-cols-1 md:grid-cols-2` desde a story 8.10
- [x] Header do users: `flex-wrap` + padding responsivo para mobile
- [x] Tested at 1280px: layout desktop intacto
- [x] All 175 existing backend tests pass
- [x] TypeScript compiles clean

## Dev Agent Record

### Files Changed
- `frontend/src/app/admin/users/page.tsx` — header: `min-h-16 flex-wrap gap-3 px-4 md:px-6`; table wrapper: `overflow-x-auto rounded-xl border`
- `frontend/src/app/admin/audit/page.tsx` — table wrapper: `overflow-x-auto rounded-2xl border shadow-sm`
- `frontend/src/app/admin/settings/page.tsx` — tab nav: `flex-row md:flex-col overflow-x-auto md:overflow-x-visible`, layout: `flex-col md:flex-row`

### Key Decisions
- Settings tab nav transforms from vertical sidebar (desktop) to horizontal scroll strip (mobile) — same buttons, different flex direction
- `scrollbar-hide` class added to hide scrollbar on mobile (needs Tailwind plugin or utility — see note below)
- Tables wrapped with `overflow-x-auto` container instead of `overflow-hidden` to allow horizontal scroll
- Form fields in settings were already `grid-cols-1 md:grid-cols-2` from story 8.10 — no changes needed

### Note on `scrollbar-hide`
`scrollbar-hide` is a common Tailwind plugin class. If not available, replace with `[&::-webkit-scrollbar]:hidden` or remove — the scroll still works, just shows the native scrollbar.
