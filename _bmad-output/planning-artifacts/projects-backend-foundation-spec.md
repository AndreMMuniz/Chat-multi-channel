# Projects Backend Foundation Specification

**Created:** 2026-05-02  
**Status:** Draft for Epic 12  
**Source references:** Epic 11 implementation, Party mode roundtable 2026-05-02

---

## Objective

Create the first real backend domain for `Projects` so that the existing pipeline workspace can load, create, edit, and move project cards using persisted data.

This backend must serve the current `Projects` UI without trying to become a full CRM platform.

---

## Core Product Rule

`Projects` is a domain of its own, but it must preserve explicit linkage to `Messages`.

- a project may be created manually inside `Projects`
- a project may be created from a message demand
- when a project originates from `Messages`, the origin must be persisted explicitly

This means the backend must preserve:

- `source_type`
- `source_conversation_id`
- `source_message_id`
- source channel
- enough demand context for the pipeline card to stay meaningful

---

## First Release Domain Model

### Primary entity: `Project`

Minimum fields:

- `id`
- `reference_code`
- `title`
- `description` or `demand_summary`
- `stage`
- `status`
- `priority`
- `owner_user_id`
- `created_by_user_id`
- `source_type` (`manual` | `message`)
- `source_conversation_id` nullable
- `source_message_id` nullable
- `contact_name` nullable
- `channel` nullable
- `tag` nullable
- `value` nullable
- `progress`
- `due_date` nullable
- `created_at`
- `updated_at`

### Supporting entity: `ProjectStage`

The first release should persist the stage definitions even if they are fixed.

Official first-release stages:

- `lead`
- `qualification`
- `proposal`
- `negotiation`
- `closed`

Recommended persisted attributes:

- `key`
- `label`
- `position`
- `is_active`

### Optional entity: `ProjectEvent`

Not mandatory for the first backend cut, but recommended if the implementation stays small enough.

Useful event types:

- `created`
- `updated`
- `stage_changed`
- `created_from_message`

---

## API Shape

Minimum endpoints:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{project_id}`
- `PATCH /api/projects/{project_id}`
- `PATCH /api/projects/{project_id}/stage`
- `DELETE /api/projects/{project_id}`
- `GET /api/project-stages`
- `POST /api/projects/from-message/{message_id}`

Optional but useful:

- `GET /api/projects/metrics`

### Minimum filters for `GET /api/projects`

- `search`
- `stage`
- `owner_id`
- `priority`
- `channel`
- `source_type`

---

## Backend Rules

- `source_type=message` must require a source message reference
- project stage must be one of the official persisted stages
- `progress` must stay between `0` and `100`
- moving a project between stages must not remove source linkage
- creation from message should hydrate project context from the real message/conversation

---

## Integration with Messages

The `create from message` flow is a first-class requirement, not a future enhancement.

Minimum behavior:

1. load the message
2. validate that it exists
3. load the related conversation
4. derive source channel and contact context
5. create a project with `source_type=message`
6. return a card-ready payload for the frontend

If the message or related conversation is invalid, the backend should fail explicitly rather than creating an orphaned project.

---

## Frontend Contract

The API response should be friendly to the current project workspace and avoid forcing the client to rebuild the card model from many unrelated endpoints.

Recommended response shape:

- `id`
- `reference`
- `title`
- `description`
- `stage`
- `priority`
- `status`
- `source_type`
- `source_message_id`
- `conversation_id`
- `contact_name`
- `channel`
- `tag`
- `owner_id`
- `owner_name`
- `due_date`
- `value`
- `progress`
- `created_at`
- `updated_at`

---

## Out of Scope

Do not build these in the first backend release:

- multiple pipelines
- pipeline customization UI
- CRM automation
- subtasks
- comments
- dependencies between projects
- forecast or score logic
- advanced reporting
- granular stage permissions

---

## Delivery Strategy

Recommended sequence:

1. add persistence model and migration
2. seed official stages
3. add schemas and service layer
4. ship `GET /api/projects` and `GET /api/project-stages`
5. ship create/edit/delete/stage movement
6. ship `create from message`
7. plug frontend page into real API

---

## Definition of Success

Epic 12 is successful when:

- the `Projects` page loads persisted projects from the backend
- the board can create, edit, delete, and move projects using real APIs
- the official stages are served and enforced by the backend
- a real message can be converted into a project without losing provenance
- the implementation remains intentionally small and does not drift into premature CRM scope
