# Project Tasks Execution Specification

**Created:** 2026-05-03  
**Status:** Draft for Epic 14  
**Source references:** Epic 13 retrospective, party mode decision on task positioning

---

## Objective

Introduce `Tasks` as execution subitems inside `Projects`, allowing agents to break project work into actionable units, create tasks from messages, and schedule simple automated follow-ups.

---

## Product Decision

`Tasks` are not a standalone top-level module in the current product model.

They exist to serve `Projects` by representing concrete execution work such as follow-up actions, reminders, delivery steps, and scheduled operational actions.

This means:

- `Projects` remain the unit of tracking and pipeline movement
- `Tasks` become the unit of execution inside a project
- messages may generate either a project card or a project task depending on the operator intent

---

## Task Definition

A task is:

- attached to exactly one project
- small enough to be executed by an agent
- assignable
- due-date aware
- simpler than a pipeline card
- capable of preserving source message / conversation provenance

A task is not:

- a new pipeline card type
- a replacement for project stages
- a top-level navigation domain

---

## Primary Use Cases

### 1. Manual task inside project

An agent opens a project and creates a task such as:

- send contract
- review customer document
- follow up tomorrow

### 2. Create task from message

An agent reads a customer message and decides the content does not require a new project card, but does require an actionable execution item.

The task should:

- preserve the originating message
- preserve the conversation link
- route into the correct project context

### 3. Scheduled automation

An agent creates a task that should later:

- send a message automatically
- trigger a scheduled internal action

The task remains visible as an execution item, but also carries automation metadata and status.

---

## Relationship to Existing Domains

### Messages

Messages remain the source of inbound and outbound operational context.

From a message, the operator may:

- create a project card
- create a project task
- tag, delete, or create a quick reply as already supported

### Projects

Projects remain:

- the pipeline unit
- the entity that moves across `Lead`, `Qualification`, `Proposal`, `Negotiation`, and `Closed`
- the parent context for tasks

Tasks live inside projects and do not have independent pipeline stages.

---

## Task Fields

Initial task model should support:

- title
- description / notes
- assignee
- priority
- due date
- execution status
- source message id (optional)
- source conversation id (optional)
- automation type (optional)
- automation schedule (optional)
- automation status (optional)

Suggested initial execution statuses:

- `open`
- `in_progress`
- `done`
- `cancelled`

---

## UX Rules

### Inside Project Detail

Each project should expose a task block that supports:

- creating tasks
- editing tasks
- marking tasks done
- reopening tasks
- showing overdue state
- showing provenance when task came from a message

### Messages Integration

The message contextual menu should gain `Create Task`.

Routing rules:

- if the conversation already belongs to a project, create the task in that project
- if the conversation has no project context, let the operator choose an existing project or create a new project context first

### Productivity Principle

Tasks should reduce agent cognitive load by surfacing next actions without forcing the operator to overload the project pipeline with micro-work.

---

## Automation Rules

Initial automation support should remain intentionally narrow.

Supported first-release automation patterns:

- send a scheduled message
- trigger a scheduled internal operational action

Not in scope yet:

- branching workflows
- multi-step automation chains
- conditional automation trees
- external third-party orchestration

---

## Delivery Strategy

Recommended breakdown:

1. Add task model and project detail UI
2. Add message-to-task creation with routing
3. Add scheduled automation metadata and execution path
4. Add task summaries and lightweight productivity visibility
5. Add aggregated `Tasks` workspace for execution queue management

---

## Definition of Success

Epic 14 is successful when:

- tasks no longer exist as an ambiguous top-level concept
- agents can execute concrete work inside a project cleanly
- a message can become either a project card or a project task with provenance preserved
- projects gain operational depth without bloating the pipeline model
- the product is prepared for scheduled follow-up automation inside project work
- agents can manage execution load through a transversal list without turning `Tasks` into a competing domain
