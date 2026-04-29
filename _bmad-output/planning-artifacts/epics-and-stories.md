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