# UX Design Specification

**Project:** Chat-multi-channel  
**Created:** 2026-05-02  
**Source:** Visual identity roundtable consolidation  
**Status:** Draft for implementation planning

## Purpose

Translate the agreed visual and product direction into concrete UX behavior for navigation, core screens, and admin flows.

## Experience Goals

The application should feel:

- operational
- serious
- reliable
- CRM-ready
- faster to scan
- less cluttered

The product should move away from “generic dashboard with chat” and toward “operational relationship hub”.

## Primary Information Architecture

Top-level navigation should be domain-based and remain in English:

- `Dashboard`
- `Messages`
- `Projects`
- `Catalog`
- `Tasks`
- `Users`
- `Config`

## Navigation Rules

- Main navigation must reflect stable business domains, not historical page accumulation.
- `Users` and `Config` must be separate.
- Deep administrative areas should not expand the main nav unnecessarily.
- Secondary navigation for administrative areas should be handled with left-side tabs / section navigation inside the page.

## Screen Specifications

### 1. Dashboard

#### Objective

Give managers and operators a fast operational snapshot, not a wall of overlapping KPIs.

#### Problems To Solve

- too many duplicated indicators
- weak hierarchy
- low-value metric noise
- not enough room for future panels

#### Target Structure

1. **Executive Summary Block**
   Includes the few metrics that answer:
   - what needs attention now
   - what is blocked
   - what is trending up or down

2. **Operational Panels**
   May include:
   - queue health
   - channel distribution
   - SLA risk
   - adoption / automation signals

3. **Expandable Future Area**
   Leave space for:
   - projects pipeline widgets
   - task summary
   - CRM-related panels

#### UX Rules

- show fewer, stronger metrics
- avoid repeating the same story in multiple cards
- use cards only when each one represents a distinct decision signal
- trend indicators should support, not dominate

### 2. Messages

#### Objective

Make the conversation workspace the central operational surface of the product.

#### Required Layout

Keep the current inbox/thread structure conceptually, but upgrade the left column into a true control surface.

#### Left Column: Conversation List

Must include:

- search
- channel filters
- tag filters
- clear visual status of unread / SLA risk
- official channel markers
- visible tags on conversation rows where useful

#### Filter Behavior

Minimum filters:

- `All Channels`
- `Telegram`
- `WhatsApp`
- `Email`
- `SMS` if active
- tag filter group

Recommended additional filters for future compatibility:

- status
- assigned / unassigned
- unread
- SLA risk

#### Tag Behavior

Tags should support:

- quick scanning
- filtering
- prioritization
- future CRM segmentation

Tags must not be purely decorative.

#### Conversation Row Content

Each row should prioritize:

- contact name
- channel identity
- last message preview
- timestamp
- unread / risk indicator
- tag indicators when relevant

#### Thread Header

Must clearly show:

- contact
- channel
- current status
- assignment
- relevant tags

### 3. Projects

#### Objective

Represent the future pipeline / kanban domain without overloading the `Messages` area.

#### Initial UX Position

This area should be reserved as a separate product domain and should not be mixed into chat navigation or admin settings.

At this stage, the UX spec only establishes domain ownership, not full kanban mechanics.

### 4. Catalog

#### Objective

Provide a structured area for business data such as products, services, and future catalog entities.

#### UX Rule

`Catalog` must not become a junk drawer. Subsections should be explicit as they are introduced.

Possible future subsections:

- Products
- Services
- Categories
- Templates

### 5. Tasks

#### Objective

Provide a dedicated operational area for follow-up work that should not remain implicit inside conversations.

#### UX Rule

Tasks should remain a separate mental model from messages, even if created from conversations later.

### 6. Users

#### Objective

Centralize organization-level user administration.

#### Navigation Pattern

Use left-side internal navigation tabs.

#### Target Sections

- `User Management`
- `User Types`
- `Audit Logs`

Optional future sections:

- `Permissions`
- `Access Policies`

#### UX Rules

- the area should feel administrative and structured
- users should not need to jump across unrelated pages to manage people and roles
- lateral navigation should scale cleanly

### 7. Config

#### Objective

Centralize system-level configuration.

#### Navigation Pattern

Use left-side internal navigation tabs.

#### Target Sections

- `General`
- `Visual Identity`
- `Channels`
- `AI Configuration`
- `API Settings`

Optional future sections:

- `Notifications`
- `Integrations`
- `Security`

#### UX Rules

- system configuration must feel separate from user administration
- sections should be easy to scan and revisit
- settings should support future growth without reshaping the main nav

## Iconography Rules

- use official channel icons where channel recognition matters
- use `react-icons` for Telegram / WhatsApp / other official brand markers already available in the project
- avoid generic icons as substitutes for branded channel markers
- keep a consistent non-channel icon system for standard UI actions

## Color Direction

- move the primary system toward indigo / deep blue
- reduce or eliminate accidental purple dominance
- keep semantic colors explicit for:
  - success
  - warning
  - error
  - info
- reserve accent usage intentionally rather than spreading it everywhere

## Labeling Rule

All user-facing UI labels, navigation items, and key screen text should be in English.

## Implementation Priority

1. Navigation architecture
2. Messages screen filters and tag behavior
3. Users / Config internal navigation
4. Dashboard consolidation
5. Full visual token rollout

## Open Decisions

### Tags

Need final confirmation on whether tags start as:

- simple labels
- governed labels with colors / types
- CRM-ready entities with future automation support

### Catalog Scope

Need future clarification on which data domains belong in `Catalog` first.

## Output Use

This specification should be used as the handoff reference for:

- story breakdown
- UI audit
- navigation refactor
- design token rollout
