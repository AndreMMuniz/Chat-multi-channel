# Visual Refresh Execution Plan

**Project:** Chat-multi-channel  
**Created:** 2026-05-02  
**Source:** Party mode roundtable follow-up  
**Status:** Draft updated with execution priorities

## Purpose

Translate the visual identity decision into an ordered implementation plan with low ambiguity and manageable regression risk.

## Execution Principle

Do not update UI screen by screen without an agreed visual system. First define direction, then audit, then implement in controlled slices.

The latest roundtable clarifies the implementation model:

- preserve the product foundation
- perform a strong restructuring of navigation and core UI flows
- treat this as a controlled refresh, not a greenfield redesign

## Required Inputs

- `visual-identity-brief.md`
- `ui-audit-and-gap-report.md`

## Proposed Rollout Sequence

### Phase 1. Direction Alignment

Outcome:

- official decision on controlled structural refresh
- approved palette direction
- approved iconography direction
- approved tone and styling principles

Confirmed current direction:

- primary palette moves toward indigo / deep blue
- official channel icons via `react-icons`
- conversation operations prioritized
- tags elevated to CRM foundation

### Phase 2. Design System Baseline

Outcome:

- normalized color tokens
- semantic token mapping
- icon usage rules
- shared component styling rules

Implementation targets may include:

- `frontend/src/app/globals.css`
- shared layout components
- shared form primitives
- shared feedback states

Key deliverables:

- replace accidental purple drift with approved indigo tokens
- define channel icon rules
- define badge/tag appearance rules
- define administrative lateral navigation pattern

### Phase 3. Navigation and Information Architecture

Outcome:

- new main menu grouped by domain
- separate `Users` and `Config`
- lateral internal navigation for administrative areas
- single-language menu labels

Candidate target menu:

- `Dashboard`
- `Messages`
- `Projects`
- `Catalog`
- `Tasks`
- `Users`
- `Config`

### Phase 4. Conversation Workspace Refactor

Outcome:

- channel filters added
- tag filters added
- official channel markers applied
- tag visibility and usability improved
- conversation list becomes an operational control surface

This phase is business-critical and should be treated as the first major user-facing priority.

### Phase 5. Administrative Area Restructure

Outcome:

- `Users` area reorganized with lateral navigation
- user management, user types, audit logs grouped coherently
- `Config` area reorganized with lateral navigation
- fast access to app settings and future configuration sections

### Phase 6. Dashboard Consolidation

Outcome:

- duplicate indicators reduced
- summary metrics consolidated into one synthesis block
- space freed for future strategic panels
- dashboard shifts from metric clutter to operational signal

### Phase 7. Remaining Surface Migration

Priority surfaces:

- inbox refinements
- admin pages
- auth pages
- future domain modules such as projects, tasks, and data/catalog areas

### Phase 8. Validation and Cleanup

Outcome:

- remove deprecated tokens
- remove old icon usage
- clean hard-coded color drift
- verify no mixed-system regressions remain

## Delivery Strategy

Recommended implementation strategy:

1. Define tokens and rules first
2. Rebuild navigation and domain structure second
3. Refactor the conversation workspace third
4. Restructure administrative surfaces fourth
5. Consolidate dashboard fifth
4. Remove leftovers last

This minimizes regression and avoids repeated redesign decisions in local files.

## Risks

### Risk: Partial rollout creates mixed visual language

Mitigation:

- migrate by system slice, not random screen order

### Risk: Existing pages keep hard-coded values

Mitigation:

- audit and replace direct hex usage

### Risk: Icon migration becomes inconsistent

Mitigation:

- define one primary icon strategy before touching shared navigation and page headers

### Risk: Team keeps using old patterns

Mitigation:

- make the visual brief the explicit source of truth

### Risk: Tags are implemented as cosmetic UI only

Mitigation:

- define minimal tag model and workflow expectations before building filters

### Risk: Menu labels create a new ambiguity

Mitigation:

- choose one language and validate domain labels before rollout

## Acceptance Criteria For Execution Readiness

- visual direction is approved
- icon strategy is approved
- audit identifies main inconsistencies
- rollout sequence is prioritized
- implementation targets are known
- deprecation path for old styling is documented
- conversation filters and tag behavior are scoped
- admin information architecture is scoped
- dashboard consolidation rules are scoped

## Remaining Open Decisions

- Will tags start as simple labels or already support typed / colored / governed behavior?
- Keep the UI and navigation normalized to English
