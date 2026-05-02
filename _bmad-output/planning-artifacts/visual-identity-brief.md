# Visual Identity Brief

**Project:** Chat-multi-channel  
**Created:** 2026-05-02  
**Source:** Party mode roundtable with Sally, John, Winston, Caravaggio  
**Status:** Draft updated with user direction

## Purpose

Define the official visual direction for the app so design and implementation stop inheriting style decisions by inertia.

## Problem Statement

The current interface appears to have adopted a purple-led palette and Material Symbols iconography through implementation momentum rather than an explicit visual system. This creates inconsistency, weakens perceived quality, and makes future UI work subjective.

## Roundtable Consensus

- We should stop treating existing implementation artifacts as the source of truth for visual identity.
- The product needs an authoritative visual direction before additional UI refresh work continues.
- Color, iconography, tone, and component styling must be defined as a system, not screen by screen.
- Documentation should be actionable and implementation-oriented, not decorative.

## Strategy Decision

Roundtable conclusion after user input:

- This is **not** a full product reset.
- This is also **not** a cosmetic polish pass.
- The correct direction is a **controlled structural refresh**:
  - preserve the application foundation
  - reorganize the experience
  - formalize a new visual system
  - refactor navigation and key operational flows

## Confirmed Product Direction

The user explicitly defined the following:

- the app should move away from the current purple-led tone
- the new visual direction should be more serious and modern
- indigo / deep blue is the preferred direction
- generic icons should be replaced where official channel icons improve recognition
- conversation management must become more operational
- tags are strategic and should support a future CRM-oriented model
- the current menu organization is not coherent and should be restructured by domain
- the dashboard should be simplified and consolidated

## Questions This Brief Must Answer

- What emotional tone should the interface communicate?
- Should the current purple remain, evolve, or be removed?
- What role should accent colors play across operational, AI, warning, and success states?
- Should Material Symbols remain the main icon system?
- If not, what icon system replaces it, and where?
- Which current visual patterns are valid and should remain?
- Which patterns must be deprecated?

## Proposed Decision Areas

### 1. Brand and Product Tone

Define the intended feeling of the interface. Based on the roundtable and user guidance:

- reliable
- serious
- operational
- modern
- CRM-ready
- less generic
- premium without excess ornament

### 2. Color Strategy

This section should define and currently assume:

- primary direction: indigo / deep blue
- move away from accidental purple dominance
- maintain clear semantic separation for warning, success, error, and info
- keep AI accents distinct from the main operational palette if needed

- primary brand color
- secondary support colors
- accent usage rules
- semantic colors for success, warning, error, info
- AI-specific color rules, if AI deserves a distinct visual accent

### 3. Iconography Strategy

This section should define and currently assume:

- official channel icons should be used where channel recognition matters
- `react-icons` is the preferred source for official channel marks already available in the project
- generic message icons should not represent specific channels
- channel markers must be recognizable at a glance

- primary icon library
- whether filled vs outlined icons are allowed
- whether different icon libraries may coexist
- exceptions for channel logos such as WhatsApp, Telegram, Email

### 4. Visual Authority Rules

This section should define:

- what is considered the source of truth for visual decisions
- whether prototypes may diverge from implementation
- how new components inherit tokens and icon rules

### 5. Navigation and Product Structure

This visual direction is inseparable from information architecture. The roundtable should treat navigation as part of the experience system.

Proposed main navigation from the user:

- `Dashboard`
- `Messages`
- `Projects`
- `Catalog`
- `Tasks`
- `Users`
- `Config`

Notes from the roundtable:

- `Users` and `Config` should be separate domains
- both `Users` and `Config` should use lateral internal navigation
- `Catalog` replaces the previous temporary data-domain label
- the product should use English consistently across navigation labels

### 6. Conversation Workspace Direction

The conversation area must be treated as the central operational surface.

Confirmed direction:

- add filters by channel
- add filters by tags
- make tags visible and actionable in the conversation workflow
- improve multichannel visual recognition with official channel icons

### 7. Tag Strategy

Tags are no longer a cosmetic badge feature. They should be treated as an organizational layer with CRM implications.

This brief should support future decisions on:

- freeform vs controlled tags
- tag colors or categories
- tag management ownership
- tag-based filtering and prioritization
- future automation or CRM workflows based on tags

## Working Position From The Roundtable

- Purple by inertia is no longer the preferred direction.
- Indigo / deep blue is the new leading palette direction.
- Official channel icons should replace generic channel markers.
- The product should move toward a coherent domain-oriented experience.
- Visual refresh must be tied to navigation, filters, tags, and dashboard hierarchy.

## Deliverables Linked To This Brief

- `ui-audit-and-gap-report.md`
- `visual-refresh-execution-plan.md`

## Immediate Next Steps

- finalize the primary indigo palette and semantic token set
- define icon rules for channel markers and general UI actions
- confirm single-language navigation labels
- decide whether tags start simple or already support structured CRM-oriented behavior
