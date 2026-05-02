# Projects / Pipeline Kanban Specification

**Created:** 2026-05-02  
**Status:** Draft for Epic 11  
**Source references:** `.models-exemple/Pipeline Kanban.html`, `.models-exemple/tweaks-panel.jsx`

---

## Objective

Turn the `Projects` top-level navigation area into a real operational pipeline workspace for opportunity tracking, stage movement, and commercial follow-up.

The target experience is not a generic kanban board. It should feel like a sales and relationship pipeline that sits naturally beside `Messages`, `Catalog`, and `Tasks`.

---

## Product Intent

The new `Projects` domain should support:

- deal and opportunity tracking
- stage-based pipeline management
- visibility into responsible agent, priority, channel, tags, due date, and monetary value
- quick scanning of pipeline health
- future expansion toward CRM workflows

This epic should establish the **UI and interaction foundation** first. It does not need full CRM automation yet.

---

## Experience Direction

The reference mock shows the right overall direction:

- indigo-forward visual system aligned with Epic 10
- side-by-side column scanning with strong card hierarchy
- lightweight KPI strip above the board
- filters that help operators narrow deals quickly
- alternative `List` and `Timeline` views as secondary access patterns
- deal detail/edit modal instead of routing the user away from the workspace

Important translation to app reality:

- the app language must remain **English**
- the domain label should remain **Projects**
- the board should feel integrated with Omnichat, not like an isolated sales toy

---

## Workspace Structure

### Primary page

`Projects` should open into a dedicated pipeline workspace with:

- page header
- view toggle
- primary CTA for creating a new deal
- filters row
- KPI summary strip
- board/list/timeline content area

### Initial views

The first implementation should support:

- `Kanban` as the default and primary experience
- `List` as a compact analytical alternative
- `Timeline` as a planning-oriented alternative

If delivery needs to be phased, `Kanban` must ship first and the others can follow in later stories.

---

## Core Entities in UI

The visual model implied by the mock includes:

- project/deal title
- ticket or identifier
- monetary value
- assigned owner / agent
- source channel
- priority
- tags
- due date
- progress
- stage / column
- notes or short description

This epic should treat these as **pipeline card fields**, even if backend persistence begins with mocked or local state.

---

## Initial Pipeline Stages

The mock suggests a sales-oriented funnel. The first release may use these initial columns:

- `Lead`
- `Qualification`
- `Proposal`
- `Negotiation`
- `Closed`

These should be treated as configurable in the future, but they can be fixed for the first implementation.

---

## Key UX Rules

### Kanban

- cards must be easy to scan vertically
- columns must expose counts and aggregate value where useful
- drag and drop should move cards between stages
- hover, active, and drag-over states should be visually clear

### Cards

- card hierarchy should emphasize title and value first
- priority, channel, and tags should help scanning without overpowering the card
- due date and overdue state should be visible
- avatar/owner should be readable but compact

### Filters

The filters row should support, at minimum:

- text search
- responsible agent
- priority
- channel

Clear-all behavior should be built in.

### Modal

Creating or editing a deal should happen in a modal or sheet, not via full page navigation.

The modal should support:

- create new deal
- edit existing deal
- move stage if necessary
- delete or archive later if the story includes it

---

## Scope Guidance for Epic 11

### In scope

- Projects pipeline workspace
- KPI strip
- Kanban board
- card movement
- filters
- deal modal
- English language normalization in this domain
- alignment with the indigo visual system

### Optional within epic

- List view
- Timeline view
- richer KPI aggregation

### Out of scope for now

- CRM automation
- backend workflow rules
- custom stage administration
- cross-module automation with Tasks
- reports beyond the pipeline workspace

---

## Delivery Strategy

Recommended breakdown:

1. Build the `Projects` workspace shell and header
2. Implement the kanban board with initial columns and cards
3. Add create/edit modal and stage movement
4. Add filters and KPI strip
5. Add secondary views if capacity remains

---

## Definition of Success

Epic 11 is successful when:

- `Projects` is no longer a placeholder
- the user can visually manage opportunities in a kanban pipeline
- the workspace feels coherent with the post-Epic-10 navigation and visual system
- the structure is ready to evolve into a fuller CRM or delivery pipeline later
