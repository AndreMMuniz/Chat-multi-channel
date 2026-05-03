# Story 12.1: Project Domain Model and Stage Persistence

**Status:** ready-for-dev  
**Epic:** 12 — Projects Backend Foundation  
**Story Points:** 5  
**Priority:** High  
**Created:** 2026-05-02

---

## User Story

**As the system,** I want persisted `Project` and `ProjectStage` entities so that the pipeline has a real backend foundation.

---

## Scope

Create the first backend persistence layer for `Projects`, including:

- `Project` model
- `ProjectStage` model or persisted stage definition
- migration(s)
- seed of official stages
- alignment with existing backend conventions

---

## Official First-Release Stages

These stages are locked for the first release and must be treated as official:

- `Lead`
- `Qualification`
- `Proposal`
- `Negotiation`
- `Closed`

Suggested persisted keys:

- `lead`
- `qualification`
- `proposal`
- `negotiation`
- `closed`

---

## Minimum Project Fields

- `id`
- `reference_code`
- `title`
- `description` or `demand_summary`
- `stage`
- `status`
- `priority`
- `source_type`
- `source_message_id` nullable
- `source_conversation_id` nullable
- `contact_name` nullable
- `channel` nullable
- `tag` nullable
- `owner_user_id` nullable
- `created_by_user_id`
- `due_date` nullable
- `value` nullable
- `progress`
- `created_at`
- `updated_at`

---

## Acceptance Criteria

- [ ] A persisted `Project` domain model exists in the backend
- [ ] A persisted `ProjectStage` structure exists or equivalent persisted stage model is created
- [ ] The five official stages are seeded in order
- [ ] The model supports manual projects and message-originated projects
- [ ] Migration follows the backend's existing SQLAlchemy/Alembic conventions
- [ ] Rollback path is clear and does not leave partial stage state behind

---

## Notes

- Do not add multiple pipelines in this story.
- Do not add comments, subtasks, or CRM automation here.
- Keep the model intentionally small and aligned with the current frontend card shape.
