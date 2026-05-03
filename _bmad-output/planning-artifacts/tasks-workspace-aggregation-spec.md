# Tasks Workspace Aggregation Specification

**Created:** 2026-05-03  
**Status:** Draft for Epic 15  
**Source references:** Epic 14 completion + party mode roundtable 2026-05-03

---

## Objective

Introduce a dedicated `Tasks` workspace in the main navigation as an aggregated operational list of project tasks, so agents can manage execution work assigned to them or created by them without opening projects one by one.

---

## Product Positioning

`Tasks` remain part of the `Projects` domain.

This workspace is:

- a transversal operational view over project tasks
- a productivity surface for execution
- a filtered list of existing tasks

This workspace is not:

- a new independent task domain
- a second pipeline competing with `Projects`
- a replacement for project detail task blocks

---

## Core User Problem

Agents can already create tasks inside projects and from messages, but they still lack a fast way to answer:

- what is assigned to me right now?
- what did I create that is still pending?
- what is overdue across my working set?
- which projects currently contain execution bottlenecks?

The `Tasks` workspace solves this by exposing a compact, list-first operational queue.

---

## Primary Use Cases

### 1. My execution queue

An agent opens `Tasks` and immediately sees:

- tasks assigned to them
- overdue items
- due-soon items
- scheduled automation tasks

### 2. Created by me follow-up

An agent wants to monitor tasks they created for others or for later execution.

### 3. Project-aware task triage

An agent filters tasks by project, user, or status to focus on a specific stream of work without opening each project card separately.

---

## Navigation Rule

The `Tasks` menu entry now points to a list-style workspace.

The workspace should feel operational and lightweight, while preserving a clear path back to the parent `Project`.

Expected actions from this screen:

- open the task detail surface
- open the parent project
- mark task as done / reopen
- filter and sort the queue

---

## Required Filters

First-release filters should include:

- project
- assignee user
- created by user
- status

Recommended quick scopes:

- assigned to me
- created by me
- overdue
- scheduled
- done

Optional later filters:

- priority
- automation type
- automation status
- due state

---

## Required List Fields

Each task row should show:

- task title
- parent project reference and title
- assignee
- created by
- status
- priority
- due date
- origin / provenance when relevant
- automation state when relevant

---

## Interaction Model

### Default surface

Primary presentation is a dense list or table optimized for scanning.

### Detail access

Selecting a task should open either:

- a side panel, or
- a compact modal

The detail surface should preserve:

- project context
- message provenance, when present
- automation metadata

### Project linkage

Every task row must provide a clear path to the parent project.

---

## Backend Implication

The workspace should consume an aggregated task-list API rather than loading tasks project by project.

Suggested contract direction:

- list tasks across projects
- support query filters for project, assignee, creator, and status
- return project summary alongside each task

---

## Delivery Strategy

Recommended breakdown:

1. aggregated task list API and filters
2. tasks workspace shell and default scopes
3. row actions and project linking
4. optional detail drawer refinement

---

## Definition of Success

Epic 15 is successful when:

- agents can manage execution work without opening multiple projects
- `Tasks` strengthens productivity without competing with `Projects`
- the list makes `assigned to me`, `created by me`, and `overdue` work obvious
- parent project context remains visible at all times
