# UI Audit and Gap Report

**Project:** Chat-multi-channel  
**Created:** 2026-05-02  
**Source:** Party mode roundtable follow-up  
**Status:** Draft updated with audit priorities

## Purpose

Map the current UI state against the intended visual system so inconsistencies can be fixed systematically.

## Audit Objective

Identify where the current application contradicts or weakens the desired visual identity across colors, icons, component styling, and interaction states.

## Current Working Hypothesis

The interface currently mixes:

- strong purple brand presence
- Material Symbols used as the dominant iconography
- multiple local visual decisions made at page level
- partially systematized tokens and partially hard-coded values

This likely results in visual inconsistency and weak design authority.

After the latest roundtable, the audit scope must also cover:

- missing operational filters in the conversation list
- under-specified tag behavior
- incoherent top-level menu grouping
- overloaded dashboard hierarchy
- weak distinction between user administration and system configuration

## Audit Categories

### 1. Color Usage

Check:

- global color tokens
- hard-coded hex values
- repeated purple shades with no explicit semantic meaning
- inconsistent state colors across pages
- AI-specific accent usage

### 2. Iconography

Check:

- where Material Symbols are used
- where Lucide or other icon systems still appear
- inconsistent filled vs outlined usage
- inconsistent sizing, weight, and alignment
- channel-specific logos vs generic icons
- places where official channel icons should replace generic markers

### 3. Component Styling

Check:

- buttons
- form fields
- cards
- side navigation
- tabs
- tables
- badges
- modals
- empty states
- loading states

### 4. Visual Tone Consistency

Check:

- whether screens feel part of one product
- whether “premium”, “operational”, and “clear” are consistently expressed
- where visual decisions feel generic, accidental, or copied from earlier prototypes

### 5. Navigation and Information Architecture

Check:

- whether the main menu reflects product domains or historical page accumulation
- whether `Users` and `Config` are separated clearly
- whether administrative areas support lateral internal navigation
- whether labels are consistent in one language

### 6. Conversation Operations

Check:

- presence or absence of channel filters
- presence or absence of tag filters
- visibility of channel identity in conversation rows
- visibility and usability of tags in the list and thread context

### 7. Dashboard Hierarchy

Check:

- duplicate or overlapping indicators
- noisy metrics with low decision value
- opportunities to consolidate summary KPIs into a single synthesis block
- space recovery for future panels

## Initial Suspected Hotspots

- `frontend/src/app/globals.css`
- `frontend/src/components/SideNavBar.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/admin/settings/page.tsx`
- auth-related pages using strong purple gradients

Additional priority hotspots from the latest discussion:

- conversation list and thread layout in `frontend/src/app/page.tsx`
- dashboard metric layout in `frontend/src/app/dashboard/page.tsx`
- admin navigation and page grouping
- user administration flow

## Audit Output Format

Each finding should capture:

- area
- file or screen
- current state
- desired direction
- severity
- recommended action

## Severity Scale

- `Critical`: blocks coherent rollout of the visual system
- `High`: highly visible inconsistency in common workflows
- `Medium`: local inconsistency with moderate user impact
- `Low`: polish issue or edge-case inconsistency

## Example Finding Template

```md
### Finding: Icon system inconsistency in shared navigation

- Area: Iconography
- File: `frontend/src/components/SideNavBar.tsx`
- Current state: Material Symbols used without explicit system rules
- Desired direction: Shared icon system aligned with official visual brief
- Severity: High
- Recommended action: Migrate nav icons to the selected icon system and define sizing/weight rules
```

## Dependency

This audit depends on `visual-identity-brief.md` becoming explicit enough to define target state, especially for:

- palette strategy
- icon library choice
- visual tone

It should also align with these newly confirmed target directions:

- indigo / deep blue visual system
- official channel icons
- tags as operational organization layer
- domain-oriented menu structure
- consolidated dashboard hierarchy

## Immediate Next Step

Run a structured audit of:

- navigation
- conversation workspace
- tags
- dashboard
- user administration
- system configuration
