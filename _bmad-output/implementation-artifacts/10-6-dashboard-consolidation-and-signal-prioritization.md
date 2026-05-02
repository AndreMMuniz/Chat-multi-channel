# Story 10.6: Dashboard Consolidation and Signal Prioritization

**Status:** ready-for-dev
**Epic:** 10 — UX Structural Refresh
**Story Points:** 5
**Priority:** Medium
**Created:** 2026-05-02

---

## User Story

**As a manager,** I want a cleaner dashboard summary so that I can understand operational state quickly without scanning duplicated metrics.

---

## Background & Context

**Current state:**
- The current dashboard in `frontend/src/app/dashboard/page.tsx` is already data-rich, but it distributes attention across too many equal-weight blocks.
- The page currently includes:
  - 4 primary KPI cards
  - 4 additional SLA / queue KPI cards
  - 2 period comparison summary cards
  - `Open Queue by Channel`
  - `Volume by Channel`
  - `Conversation Status`
  - `New Conversations`
  - `Messages Exchanged`
  - `Resolution Time Percentiles`
  - `Channel Distribution`
  - `Agent Performance`
  - 3 AI adoption KPI cards
- Several of these blocks tell adjacent parts of the same story, which creates visual competition instead of hierarchy.
- The current page also still carries strong purple accents and older Material Symbols patterns that do not align with the approved visual direction.

**Approved direction:**
- consolidate duplicated or overlapping signals
- create a stronger summary block
- preserve room for future strategic panels
- keep the dashboard useful for rapid operational review rather than exhaustive analytics scanning

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `frontend/src/app/dashboard/page.tsx` | **UPDATE** | Consolidate KPI structure and improve hierarchy |
| Shared analytics components if extracted | **UPDATE if needed** | Keep chart/cards consistent after consolidation |

---

## Acceptance Criteria

- [ ] The first screenful of the dashboard emphasizes a compact operational summary instead of a long wall of KPI cards
- [ ] Overlapping top-level indicators are consolidated so that the same operational story is not repeated across multiple cards
- [ ] `SLA at Risk`, `Unassigned Open`, and core workload signals remain visible as priority indicators
- [ ] Channel-related information is presented without unnecessary duplication between multiple panels
- [ ] Trend information remains available, but is demoted below the primary summary layer
- [ ] A clear lower-priority area remains available for `Agent Performance` and AI-related metrics
- [ ] The resulting layout leaves intentional room for future panels tied to `Projects`, `Tasks`, or CRM readiness

---

## Current Code Reality

- The page already has a valid data model and should be treated as a hierarchy problem, not a data-availability problem.
- Current top-level KPI groups:
  - `Total Conversations`
  - `Open Conversations`
  - `Messages Today`
  - `Avg Resolution Time`
  - `SLA at Risk`
  - `SLA Compliance`
  - `Avg First Response`
  - `Unassigned Open`
- Current mid-page operational/analytical blocks:
  - queue by channel
  - channel volume
  - conversation status
  - conversation trend
  - message trend
  - resolution percentiles
  - channel distribution
- Current lower-page deeper analysis:
  - `Agent Performance`
  - AI adoption cards
- This means story `10.6` should focus on layout consolidation, priority ordering, and card reduction rather than inventing new analytics.

---

## Target UX Structure

### 1. Executive Summary Block

The top of the page should answer:

- what needs attention now
- whether the queue is under control
- whether response performance is degrading

Recommended summary composition:

- `Open Conversations`
- `SLA at Risk`
- `Unassigned Open`
- one throughput or trend signal:
  - `Conversations in period` or
  - `Messages in period`

Recommended consolidation rule:

- `Total Conversations` should not compete equally with active operational risk metrics
- `Messages Today` should not remain a top-tier card if period comparison already communicates workload trend
- `Avg Resolution Time`, `SLA Compliance`, and `Avg First Response` should be grouped as service-performance context rather than scattered across two KPI rows

### 2. Operational Insight Row

This row should keep the most actionable supporting panels:

- `Conversation Status`
- `Open Queue by Channel`
- one channel composition panel

Consolidation guidance:

- `Volume by Channel` and `Channel Distribution` should not both survive unchanged if they tell the same distribution story
- preferred outcome is one stronger channel panel, unless each panel clearly serves a distinct decision

### 3. Trend and Performance Layer

This layer should sit below the primary operational view and include:

- `New Conversations`
- `Messages Exchanged`
- `Resolution Time Percentiles`

Rule:

- trend charts should inform follow-up analysis, not dominate the first impression of the page

### 4. Secondary Strategic Layer

This lower-priority area may include:

- `Agent Performance`
- AI adoption metrics

Rule:

- these panels are useful, but they should not crowd out immediate operational signals
- if spacing becomes tight, AI adoption should collapse into a compact summary block rather than multiple equally weighted cards

### 5. Reserved Expansion Area

The page should intentionally preserve space for future widgets such as:

- project pipeline summary
- task backlog snapshot
- CRM follow-up indicators
- catalog-linked business summaries

The goal is not to fill every column today.

---

## Suggested Consolidation Decisions

- Merge the current two KPI rows into a more opinionated summary layer instead of eight near-equal cards
- Reduce duplication between:
  - `Messages Today`
  - `Messages Exchanged`
  - period comparison message block
- Reduce duplication between:
  - `Volume by Channel`
  - `Channel Distribution`
- Reposition `Total Conversations` as supporting context, not the lead metric
- Keep `SLA at Risk` and `Unassigned Open` visually prominent because they drive immediate action
- Group service performance metrics together:
  - `Avg First Response`
  - `Avg Resolution Time`
  - `SLA Compliance`
- Consider collapsing AI metrics into one compact area unless all three cards are proven to support distinct operational decisions

---

## Implementation Notes

- Focus on decision value, not metric quantity.
- Keep the dashboard aligned with the new indigo visual system as shared tokens become available.
- Do not redesign the backend analytics contract in this story unless a small UI-oriented field rename is unavoidable.
- Prefer reorganizing existing components before extracting a large new dashboard abstraction.
- If a panel is retained, it should justify its space with a clearly distinct question it answers.

---

## Out of Scope

- creating new analytics endpoints
- redefining business KPIs with stakeholders
- full data-science style reporting
- Projects / Tasks / CRM future widgets beyond reserving space for them
- full application-wide color migration outside the touched dashboard surface

---

## Definition of Done

- The story document reflects the real dashboard structure already present in code
- The implementation target clearly distinguishes:
  - top-priority operational summary
  - supporting operational panels
  - deeper analytical panels
- Duplication-reduction expectations are explicit enough for a dev to implement without guessing product intent
- The dashboard remains useful on desktop and does not become denser on mobile as a side effect of consolidation
