# Epics and Stories for Omnichat

This document outlines the epics and user stories derived from the Product Requirements Document (PRD) functional requirements (FR1-FR46). Epics represent high-level features, while user stories provide detailed, actionable items with acceptance criteria and estimations.

## Epic 1: User Authentication and Access Management
**Derived from FRs:** FR1-FR9  
**Description:** Enable secure user registration, authentication, and role-based access control for the platform.

### Story 1.1: Visitor Account Creation
**As a visitor,** I want to create an account request so that I can request access to the platform.  
**Acceptance Criteria:**
- Form includes email, name, and optional fields.
- Email validation prevents invalid formats.
- Successful submission shows confirmation message.
- Request is stored for admin approval.  
**Estimation:** 3 story points  
**Covers FR:** FR1

### Story 1.2: Admin Account Approval
**As an admin,** I want to approve or reject pending account requests so that I control who accesses the platform.  
**Acceptance Criteria:**
- List of pending requests visible in admin panel.
- Approve/reject buttons for each request.
- Approved users are enabled and receive notification.
- Rejected requests are removed or marked.  
**Estimation:** 5 story points  
**Covers FR:** FR2

### Story 1.3: Role Assignment
**As an admin,** I want to assign a role to approved users so that they have appropriate permissions.  
**Acceptance Criteria:**
- Role selection dropdown with Admin, Manager, Agent options.
- Assignment saves and updates user permissions.
- User receives role-based access immediately.  
**Estimation:** 3 story points  
**Covers FR:** FR3

### Story 1.4: User Account Management
**As an admin,** I want to enable or disable user accounts so that I can manage active users.  
**Acceptance Criteria:**
- Toggle to enable/disable accounts in admin panel.
- Disabled users cannot log in.
- Changes are logged in audit.  
**Estimation:** 3 story points  
**Covers FR:** FR4

### Story 1.5: Custom Role Creation
**As an admin,** I want to create custom roles beyond baseline so that I can tailor permissions.  
**Acceptance Criteria:**
- Interface to define new role with name and permissions.
- Custom roles assignable like baseline roles.
- Permissions enforced across the platform.  
**Estimation:** 5 story points  
**Covers FR:** FR5

### Story 1.6: Role Permission Updates
**As an admin,** I want to update permissions for custom roles so that roles evolve with needs.  
**Acceptance Criteria:**
- Edit permissions for existing custom roles.
- Changes apply to all users with that role.
- Audit logs capture permission updates.  
**Estimation:** 3 story points  
**Covers FR:** FR6

### Story 1.7: Permission Enforcement
**As the system,** I want to enforce permission checks for protected actions so that users only access authorized features.  
**Acceptance Criteria:**
- Middleware blocks unauthorized API calls.
- UI hides features based on permissions.
- Error messages for insufficient permissions.  
**Estimation:** 8 story points  
**Covers FR:** FR7

### Story 1.8: User Authentication
**As a user,** I want to authenticate and access authorized areas so that I can use the platform securely.  
**Acceptance Criteria:**
- Login form with email/password.
- Successful auth grants access to dashboard.
- Invalid credentials show error.  
**Estimation:** 5 story points  
**Covers FR:** FR8

### Story 1.9: Password Recovery
**As a user,** I want to recover account access through password reset so that I can regain access if forgotten.  
**Acceptance Criteria:**
- Forgot password link sends reset email.
- Reset link allows new password entry.
- Secure token prevents unauthorized resets.  
**Estimation:** 5 story points  
**Covers FR:** FR9

## Epic 2: Multi-Channel Conversation Management
**Derived from FRs:** FR10-FR18  
**Description:** Provide a unified inbox for managing conversations across Telegram, WhatsApp, and Email.

### Story 2.1: Unified Inbox View
**As an agent,** I want to view a unified inbox containing conversations from all channels so that I manage everything in one place.  
**Acceptance Criteria:**
- List shows conversations from Telegram, WhatsApp, Email.
- Sorted by priority and recency.
- Channel icons distinguish sources.  
**Estimation:** 8 story points  
**Covers FR:** FR10

### Story 2.2: Conversation Thread Opening
**As an agent,** I want to open a conversation thread and view full history so that I understand the context.  
**Acceptance Criteria:**
- Click conversation opens thread view.
- Shows all messages chronologically.
- Metadata like channel and timestamps visible.  
**Estimation:** 5 story points  
**Covers FR:** FR11

### Story 2.3: Outbound Message Sending
**As an agent,** I want to send outbound messages from a thread so that I respond to customers.  
**Acceptance Criteria:**
- Text input in thread view.
- Send button posts message.
- Message appears in thread immediately.  
**Estimation:** 3 story points  
**Covers FR:** FR12

### Story 2.4: Inbound Message Ingestion
**As the system,** I want to ingest inbound messages from supported channels so that conversations are updated in real-time.  
**Acceptance Criteria:**
- Webhooks/listeners for Telegram, WhatsApp, Email.
- New messages added to correct conversations.
- Real-time updates via WebSocket.  
**Estimation:** 13 story points  
**Covers FR:** FR13, FR14

### Story 2.5: Conversation Status Updates
**As an agent,** I want to update conversation status so that I track progress.  
**Acceptance Criteria:**
- Status dropdown: Open, Resolved, etc.
- Changes save and reflect in inbox.
- Status affects prioritization.  
**Estimation:** 3 story points  
**Covers FR:** FR15

### Story 2.6: Read/Unread Management
**As an agent,** I want to mark conversations read/unread so that I track attention.  
**Acceptance Criteria:**
- Toggle for read/unread in thread and list.
- Unread count in inbox header.
- Visual indicators for unread.  
**Estimation:** 2 story points  
**Covers FR:** FR16

### Story 2.7: Conversation Summaries
**As an agent,** I want to see last message summary and timestamp per conversation so that I scan quickly.  
**Acceptance Criteria:**
- Inbox shows preview of last message.
- Timestamps for last activity.
- Truncated for long messages.  
**Estimation:** 2 story points  
**Covers FR:** FR17

### Story 2.8: Concurrent Conversation Handling
**As an agent,** I want to handle multiple conversations without leaving the workspace so that I work efficiently.  
**Acceptance Criteria:**
- Open multiple threads in tabs or split view.
- Switch between conversations quickly.
- Context preserved per thread.  
**Estimation:** 5 story points  
**Covers FR:** FR18

## Epic 3: SLA and Queue Oversight
**Derived from FRs:** FR19-FR24  
**Description:** Enable managers to monitor and manage SLA compliance and queue health.

### Story 3.1: Operational Indicators View
**As a manager,** I want to view operational indicators for response pace and queue health so that I oversee performance.  
**Acceptance Criteria:**
- Dashboard shows SLA metrics, unread counts.
- Real-time updates.
- Charts for trends.  
**Estimation:** 8 story points  
**Covers FR:** FR19

### Story 3.2: SLA Risk Surfacing
**As the system,** I want to surface conversations at risk of SLA breach so that managers intervene early.  
**Acceptance Criteria:**
- Highlight high-risk conversations in inbox.
- Alerts for managers.
- Risk based on time thresholds.  
**Estimation:** 5 story points  
**Covers FR:** FR20

### Story 3.3: Conversation Prioritization
**As the system,** I want to prioritize conversations based on operational risk so that urgent ones are handled first.  
**Acceptance Criteria:**
- Inbox sorted by SLA risk.
- Auto-prioritization logic.
- Manual override for managers.  
**Estimation:** 5 story points  
**Covers FR:** FR21

### Story 3.4: Channel Workload Monitoring
**As a manager,** I want to monitor unread and pending workload by channel so that I balance load.  
**Acceptance Criteria:**
- Breakdown by Telegram, WhatsApp, Email.
- Visual indicators for overload.
- Reassignment options.  
**Estimation:** 3 story points  
**Covers FR:** FR22

### Story 3.5: Conversation Reassignment
**As a manager,** I want to reassign ownership or priority for conversations so that I optimize team performance.  
**Acceptance Criteria:**
- Drag-and-drop or buttons to reassign.
- Notification to new owner.
- Audit log for changes.  
**Estimation:** 5 story points  
**Covers FR:** FR23

### Story 3.6: SLA Compliance Tracking
**As the system,** I want to track first-response SLA compliance so that performance is measured.  
**Acceptance Criteria:**
- Metrics for response times.
- Compliance percentages.
- Reports for managers.  
**Estimation:** 5 story points  
**Covers FR:** FR24

## Epic 4: Message Delivery and Reliability
**Derived from FRs:** FR25-FR29  
**Description:** Ensure reliable message delivery with failure detection and recovery.

### Story 4.1: Delivery Failure Detection
**As the system,** I want to detect outbound delivery failures by channel so that issues are identified.  
**Acceptance Criteria:**
- Monitor send status from APIs.
- Mark messages as failed if not delivered.
- Update UI with failure indicators.  
**Estimation:** 8 story points  
**Covers FR:** FR25

### Story 4.2: Failure Status Exposure
**As an agent,** I want to see failed-delivery status for messages so that I know what failed.  
**Acceptance Criteria:**
- Red indicators for failed sends.
- Tooltip with error details.
- Retry options visible.  
**Estimation:** 3 story points  
**Covers FR:** FR26

### Story 4.3: Message Retry Flow
**As the system,** I want to execute retry flow for failed messages so that delivery is recovered.  
**Acceptance Criteria:**
- Auto-retry with backoff.
- Manual retry button.
- Success updates status.  
**Estimation:** 5 story points  
**Covers FR:** FR27

### Story 4.4: Failure Alerts for Managers
**As a manager,** I want to receive alerts when delivery-failure thresholds are exceeded so that I intervene.  
**Acceptance Criteria:**
- Notifications for high failure rates.
- Dashboard alerts.
- Escalation triggers.  
**Estimation:** 3 story points  
**Covers FR:** FR28

### Story 4.5: SLA Risk Alerts
**As a manager,** I want to receive alerts when SLA-risk thresholds are exceeded so that I manage breaches.  
**Acceptance Criteria:**
- Alerts for SLA violations.
- Real-time notifications.
- Actionable links to conversations.  
**Estimation:** 3 story points  
**Covers FR:** FR29

## Epic 5: Governance, Audit, and Configuration
**Derived from FRs:** FR30-FR37  
**Description:** Provide configuration for channels and audit capabilities for governance.

### Story 5.1: Telegram Configuration
**As an admin,** I want to configure Telegram channel settings so that Telegram integration works.  
**Acceptance Criteria:**
- Form for bot token, webhook URL.
- Save encrypts credentials.
- Test connection button.  
**Estimation:** 5 story points  
**Covers FR:** FR30

### Story 5.2: WhatsApp Configuration
**As an admin,** I want to configure WhatsApp Cloud API settings so that WhatsApp integration works.  
**Acceptance Criteria:**
- Form for API key, phone number.
- Encrypted storage.
- Validation for credentials.  
**Estimation:** 5 story points  
**Covers FR:** FR31

### Story 5.3: Email Configuration
**As an admin,** I want to configure Email IMAP/SMTP settings so that Email integration works.  
**Acceptance Criteria:**
- Form for server, credentials.
- Secure storage.
- Connection tests.  
**Estimation:** 5 story points  
**Covers FR:** FR32

### Story 5.4: Secure Credential Storage
**As the system,** I want to store channel credentials securely so that secrets are protected.  
**Acceptance Criteria:**
- AES encryption for sensitive fields.
- No plain text in logs or UI.
- Key management for rotation.  
**Estimation:** 8 story points  
**Covers FR:** FR33

### Story 5.5: Audit Log Recording
**As the system,** I want to record audit logs for critical actions so that governance is maintained.  
**Acceptance Criteria:**
- Logs for user changes, config updates.
- Structured JSON with actor, action, timestamp.
- Stored securely.  
**Estimation:** 5 story points  
**Covers FR:** FR34

### Story 5.6: Audit Log Viewing
**As an admin,** I want to view audit records for governance so that I review actions.  
**Acceptance Criteria:**
- Searchable audit log viewer.
- Filters by date, action, user.
- Export options.  
**Estimation:** 5 story points  
**Covers FR:** FR35

### Story 5.7: Role Change Auditing
**As the system,** I want to log role and permission changes so that changes are traceable.  
**Acceptance Criteria:**
- Audit entries for role assignments.
- Includes before/after states.
- Queryable for admins.  
**Estimation:** 3 story points  
**Covers FR:** FR36

### Story 5.8: Configuration Change Auditing
**As the system,** I want to log high-impact configuration changes so that they are auditable.  
**Acceptance Criteria:**
- Logs for channel config updates.
- Includes details of changes.
- Integrated with audit viewer.  
**Estimation:** 3 story points  
**Covers FR:** FR37

## Epic 6: Analytics and Operational Visibility
**Derived from FRs:** FR38-FR42  
**Description:** Provide dashboards and metrics for operational insights.

### Story 6.1: Conversation Volume Dashboard
**As a manager,** I want to view dashboard metrics for conversation volume and status so that I understand load.  
**Acceptance Criteria:**
- Charts for daily conversations.
- Breakdown by status.
- Real-time updates.  
**Estimation:** 8 story points  
**Covers FR:** FR38

### Story 6.2: Operational Trends View
**As a manager,** I want to view daily operational trends so that I track performance over time.  
**Acceptance Criteria:**
- Trend lines for metrics.
- Date range selectors.
- Comparisons to previous periods.  
**Estimation:** 5 story points  
**Covers FR:** FR39

### Story 6.3: Channel Distribution Metrics
**As a manager,** I want to view channel distribution metrics so that I see usage patterns.  
**Acceptance Criteria:**
- Pie charts for Telegram/WhatsApp/Email.
- Percentages and counts.
- Historical views.  
**Estimation:** 3 story points  
**Covers FR:** FR40

### Story 6.4: Resolution Indicators
**As the system,** I want to provide resolution-related operational indicators so that effectiveness is measured.  
**Acceptance Criteria:**
- Metrics for resolution times.
- Success rates.
- Dashboard integration.  
**Estimation:** 5 story points  
**Covers FR:** FR41

### Story 6.5: Adoption Tracking
**As the system,** I want to support internal tracking of adoption and response-quality outcomes so that progress is monitored.  
**Acceptance Criteria:**
- User activity metrics.
- Response quality scores.
- Reports for internal use.  
**Estimation:** 5 story points  
**Covers FR:** FR42

## Epic 7: Admin and Platform Operations
**Derived from FRs:** FR43-FR46  
**Description:** Enable admin management of users, profiles, and platform settings.

### Story 7.1: User Profile Management
**As an admin,** I want to manage user profiles and role assignments from the admin workspace so that I control access.  
**Acceptance Criteria:**
- Table of users with edit options.
- Role assignment dropdown.
- Bulk actions for enable/disable.  
**Estimation:** 5 story points  
**Covers FR:** FR43

### Story 7.2: Platform Settings Management
**As an admin,** I want to manage baseline platform settings so that I configure the system.  
**Acceptance Criteria:**
- Settings page for global configs.
- Save and apply changes.
- Restart notifications if needed.  
**Estimation:** 5 story points  
**Covers FR:** FR44

### Story 7.3: Single-Tenant Operation Support
**As the system,** I want to support internal single-tenant operation so that the organization uses it securely.  
**Acceptance Criteria:**
- Tenant isolation logic.
- Shared workspace for org.
- No multi-tenant features yet.  
**Estimation:** 8 story points  
**Covers FR:** FR45

### Story 7.4: Concurrent User Support
**As the system,** I want to support approximately 100 concurrent internal operators so that the team scales.  
**Acceptance Criteria:**
- Performance testing for 100 users.
- Scalable backend.
- Monitoring for load.  
**Estimation:** 13 story points  
**Covers FR:** FR46

## Epic 8: Production Hardening
**Derived from:** Post-MVP Retrospective (2026-04-29) action items  
**Description:** Address critical security gaps, infrastructure reliability, and test coverage before production deployment with real users.

### Story 8.1: Staging Migration Validation
**As the system,** I want all 5 Alembic migrations validated on staging so that schema correctness is confirmed before production.  
**Acceptance Criteria:**
- All 5 migrations applied cleanly on a staging Supabase instance.
- Schema matches expected models (User, Conversation, Message, AuditLog, GeneralSettings).
- Any syntax or ordering issues resolved.
- Migration rollback tested at least once.  
**Estimation:** 5 story points  
**Priority:** Critical

### Story 8.2: Environment Variables Documentation
**As a developer,** I want a complete `.env.example` file so that deployment is reproducible without tribal knowledge.  
**Acceptance Criteria:**
- All env vars present: `DELIVERY_ALERT_THRESHOLD`, `DELIVERY_ALERT_WINDOW_MINUTES`, `SLA_CHECK_INTERVAL_SECONDS`, `SLA_THRESHOLD_MINUTES`, `EMAIL_POLL_INTERVAL_SECONDS`, `AGENT_AUTO_REPLY`, `AGENT_AUTO_REPLY_CONFIDENCE`, `WORKER_CONCURRENCY`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, plus all existing vars.
- Each var has: description comment, type hint, and safe default.
- `.env.example` committed to repo root.
- `README` updated with pointer to `.env.example`.  
**Estimation:** 3 story points  
**Priority:** Critical

### Story 8.3: AES-256 Credential Encryption
**As the system,** I want channel credentials encrypted at rest using AES-256 so that `whatsapp_access_token`, `email_password`, and `twilio_auth_token` are not stored in plaintext.  
**Acceptance Criteria:**
- `DATABASE_ENCRYPTION_KEY` env var consumed at startup.
- `GeneralSettings` model encrypts/decrypts sensitive fields transparently.
- Existing plaintext values migrated via Alembic data migration.
- No plaintext secrets appear in DB, logs, or API responses.
- App refuses to start if `DATABASE_ENCRYPTION_KEY` is missing.  
**Estimation:** 8 story points  
**Priority:** Critical

### Story 8.4: Redis Streams Queue Migration
**As the system,** I want the agent task queue backed by Redis Streams so that Railway restarts do not lose in-flight tasks.  
**Acceptance Criteria:**
- `src/shared/queue.py` implements `RedisStreamQueue` using `aiomqtt` or `redis-py` streams.
- `asyncio.Queue` fallback retained for local dev when `REDIS_URL` is absent.
- Worker consumes from Redis Streams with consumer group and ack on completion.
- Failed messages land in a dead-letter stream, not silently dropped.
- `REDIS_URL` documented in `.env.example`.  
**Estimation:** 8 story points  
**Priority:** Critical

### Story 8.5: Pytest Suite for Critical Services
**As a developer,** I want pytest coverage for 5 critical services so that regressions are caught automatically.  
**Acceptance Criteria:**
- Test files for: `MessageService`, `ChannelService`, `UserService`, `AIService`, `DeliveryAlertService`.
- 80%+ line coverage per service.
- Tests use real DB (test schema) — no mocks for DB layer.
- CI step added to run pytest on every push.  
**Estimation:** 13 story points  
**Priority:** Important

### Story 8.6: Playwright E2E Tests
**As a developer,** I want Playwright tests for critical user flows so that UI regressions are caught in CI.  
**Acceptance Criteria:**
- Flow covered: login → inbox load → open conversation → send message → message visible.
- Tests run headless in CI (GitHub Actions or Railway build hook).
- Screenshots on failure saved as artifacts.
- Test suite passes on current codebase before merge.  
**Estimation:** 8 story points  
**Priority:** Important

### Story 8.7: Granular Rate Limiting
**As the system,** I want per-endpoint rate limits configured so that abuse is mitigated.  
**Acceptance Criteria:**
- Login: 10 requests/min per IP.
- Signup: 5 requests/min per IP.
- General API: 60 requests/min per authenticated user.
- Rate limit headers (`X-RateLimit-*`) returned on all limited endpoints.
- 429 response with `Retry-After` header on breach.  
**Estimation:** 5 story points  
**Priority:** Important

### Story 8.8: API Key Startup Validation
**As the system,** I want the application to fail fast on startup if required API keys are missing so that silent misconfiguration is prevented.  
**Acceptance Criteria:**
- `OPENAI_API_KEY` validated at startup; app exits with clear error if absent.
- Same pattern applied to `DATABASE_ENCRYPTION_KEY` (Story 8.3).
- Validation runs before any route registration.
- Error message names the missing variable and links to `.env.example`.  
**Estimation:** 2 story points  
**Priority:** Important

### Story 8.9: MessageService Refactoring
**As a developer,** I want `MessageService` split into focused sub-services so that each file respects SRP and is under 150 lines.  
**Acceptance Criteria:**
- `MessageService` decomposed into at least: `MessageCreationService`, `DeliveryService`, `BroadcastService`.
- No existing public interface broken (same method signatures, same behavior).
- All existing tests (Story 8.5) pass after refactor.
- Each new file < 150 lines.  
**Estimation:** 5 story points  
**Priority:** Nice-to-have

### Story 8.10: Telegram Bot Configuration UI
**As an admin,** I want to configure the Telegram bot token from the settings UI so that it no longer requires an env var restart.  
**Acceptance Criteria:**
- Telegram section in settings page includes bot token field.
- Save stores token via existing `GeneralSettings` (encrypted per Story 8.3).
- Bot re-initializes on token update without server restart.
- Test connection button verifies the token against Telegram API.  
**Estimation:** 5 story points  
**Priority:** Nice-to-have

## Epic 11: Projects / Pipeline Kanban
**Derived from:** Post-Epic 10 navigation expansion and pipeline workspace direction  
**Description:** Turn `Projects` into a real pipeline workspace with kanban management, project editing, filters, and high-level operational visibility for projects and message-driven demands.

### Story 11.1: Projects Workspace Shell and Header
**As an operator,** I want the `Projects` area to open into a real workspace shell so that the domain feels active and ready for pipeline work instead of acting like a placeholder.  
**Acceptance Criteria:**
- Projects page includes a real workspace header and shell.
- View toggles and primary CTA are visible.
- Filters and KPI areas have defined placement.
- The shell supports the concept of project cards created from message demands.
- All visible labels are in English.  
**Estimation:** 3 story points  
**Priority:** High

### Story 11.2: Kanban Board Columns and Project Cards
**As an operator,** I want to see project cards organized by stage in a kanban board so that I can understand the pipeline at a glance.  
**Acceptance Criteria:**
- Default Projects view renders a kanban board.
- Initial stages include Lead, Qualification, Proposal, Negotiation, Closed.
- Cards surface title, work type, owner, channel, priority, tags, due date, and progress.
- Cards can visually indicate when they originated from a conversation demand.
- Card hierarchy supports fast scanning.  
**Estimation:** 5 story points  
**Priority:** High

### Story 11.3: Project Create/Edit and Stage Movement
**As an operator,** I want to create, edit, and move projects between stages so that the pipeline is operational rather than static.  
**Acceptance Criteria:**
- New project flow exists from the Projects workspace.
- Existing project can be opened and edited.
- Projects can move between stages.
- A marked message demand can become a project card in the pipeline.
- Stage movement gives clear visual feedback.  
**Estimation:** 5 story points  
**Priority:** High

### Story 11.4: Pipeline Filters, KPIs, and Secondary Views
**As an operator or manager,** I want to filter the pipeline and see high-level project metrics so that I can quickly focus on the right projects and demands.  
**Acceptance Criteria:**
- Filters exist for search, owner, priority, channel, and origin type when relevant.
- KPI strip surfaces pipeline totals and health.
- Secondary views such as List and Timeline are available if included in scope.
- Layout remains aligned with the new Omnichat visual system.  
**Estimation:** 5 story points  
**Priority:** Medium

## Epic 12: Projects Backend Foundation
**Derived from:** Epic 11 frontend implementation + party mode backend roundtable 2026-05-02  
**Description:** Create the first persisted backend domain for `Projects`, with official stage support, CRUD APIs, and explicit message-to-project provenance.

### Story 12.1: Project Domain Model and Stage Persistence
**As the system,** I want persisted `Project` and `ProjectStage` entities so that the pipeline has a real backend foundation.  
**Acceptance Criteria:**
- `Project` model exists with title, description/demand summary, stage, priority, source linkage, owner, due date, progress, and timestamps.
- `ProjectStage` model or persisted stage definition exists.
- Official first-release stages are seeded as `Lead`, `Qualification`, `Proposal`, `Negotiation`, `Closed`.
- Migration is reversible and consistent with existing backend patterns.  
**Estimation:** 5 story points  
**Priority:** High

### Story 12.2: Projects CRUD API and Filters
**As an operator,** I want the `Projects` workspace to load and update real project data so that the kanban no longer depends on local state.  
**Acceptance Criteria:**
- API supports list, create, detail, update, delete, and stage movement.
- `GET /api/projects` supports filters for search, stage, owner, priority, channel, and source type.
- Stage movement is handled by an explicit backend mutation.
- API responses are shaped for the existing card-oriented frontend.  
**Estimation:** 8 story points  
**Priority:** High

### Story 12.3: Message-to-Project Conversion Flow
**As an operator,** I want to turn a real message demand into a project so that project cards can originate from live omnichannel work.  
**Acceptance Criteria:**
- Backend supports explicit creation from message.
- Created project persists `source_type`, `source_message_id`, and `source_conversation_id`.
- Channel and contact context are derived from the real source records when possible.
- Invalid or orphaned source references are rejected explicitly.  
**Estimation:** 5 story points  
**Priority:** High

### Story 12.4: Projects Backend Test Coverage and Frontend Wiring
**As a developer,** I want test coverage and frontend integration for the new Projects backend so that the page can be validated with real persisted data safely.  
**Acceptance Criteria:**
- Service and API tests cover CRUD, filters, stage movement, and message conversion.
- The Projects frontend reads from the backend instead of local seeded state.
- The UI preserves the official commercial stages from backend data.
- Error and empty states remain usable when no real projects exist.  
**Estimation:** 5 story points  
**Priority:** High

## FR to Epic/Story Mapping

| FR  | Epic | Story |
|-----|------|-------|
| FR1 | 1    | 1.1   |
| FR2 | 1    | 1.2   |
| FR3 | 1    | 1.3   |
| FR4 | 1    | 1.4   |
| FR5 | 1    | 1.5   |
| FR6 | 1    | 1.6   |
| FR7 | 1    | 1.7   |
| FR8 | 1    | 1.8   |
| FR9 | 1    | 1.9   |
| FR10| 2    | 2.1   |
| FR11| 2    | 2.2   |
| FR12| 2    | 2.3   |
| FR13| 2    | 2.4   |
| FR14| 2    | 2.4   |
| FR15| 2    | 2.5   |
| FR16| 2    | 2.6   |
| FR17| 2    | 2.7   |
| FR18| 2    | 2.8   |
| FR19| 3    | 3.1   |
| FR20| 3    | 3.2   |
| FR21| 3    | 3.3   |
| FR22| 3    | 3.4   |
| FR23| 3    | 3.5   |
| FR24| 3    | 3.6   |
| FR25| 4    | 4.1   |
| FR26| 4    | 4.2   |
| FR27| 4    | 4.3   |
| FR28| 4    | 4.4   |
| FR29| 4    | 4.5   |
| FR30| 5    | 5.1   |
| FR31| 5    | 5.2   |
| FR32| 5    | 5.3   |
| FR33| 5    | 5.4   |
| FR34| 5    | 5.5   |
| FR35| 5    | 5.6   |
| FR36| 5    | 5.7   |
| FR37| 5    | 5.8   |
| FR38| 6    | 6.1   |
| FR39| 6    | 6.2   |
| FR40| 6    | 6.3   |
| FR41| 6    | 6.4   |
| FR42| 6    | 6.5   |
| FR43| 7    | 7.1   |
| FR44| 7    | 7.2   |
| FR45| 7    | 7.3   |
| FR46| 7    | 7.4   |
