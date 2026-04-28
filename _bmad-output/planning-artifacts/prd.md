---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - C:\Users\mandr\Documents\Projetos\Chat-multi-channel\_bmad-output\planning-artifacts\product-brief.md
workflowType: 'prd'
releaseMode: single-release
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
classification:
  projectType: saas_b2b
  domain: general
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - Chat-multi-channel

**Author:** Andre
**Date:** 2026-04-27

## Executive Summary

Omnichat is an internal B2B SaaS customer-support platform designed to help operations teams manage multi-channel service workflows with less managerial overload. The MVP focuses on proving a practical multi-channel operation across Telegram, WhatsApp, and Email in one workspace, replacing fragmented channel handling and reducing response bottlenecks.

The core business problem is not only channel fragmentation, but operational dependency on managers for day-to-day execution. Omnichat addresses this by enabling faster, more consistent response workflows so managers can reallocate time to other critical areas while customer interactions continue to be handled with speed and precision.

The product is intentionally positioned as an internal MVP: fast to validate, low process friction, and aligned with specific operational needs that generic support suites do not address well in early-stage or niche scenarios.

### What Makes This Special

Omnichat differentiates through three principles: modularity, simplicity, and reduced operational cost. Instead of forcing teams into heavyweight support suites, it is designed to adapt to business-specific workflows and constraints with minimal overhead.

The key insight is that support effectiveness depends on execution clarity, not feature volume. Users should choose Omnichat when they need a support operation tailored to their reality, where existing tools fail to fit channel mix, team management patterns, or required process flexibility.

## Project Classification

- **Project Type:** SaaS B2B (with web app + API backend characteristics)
- **Domain:** General
- **Complexity:** Medium
- **Project Context:** Greenfield
- **Release Goal:** Internal MVP

## Success Criteria

### User Success

Support agents and supervisors should be able to handle Telegram, WhatsApp, and Email conversations from a single interface without channel switching. User success is achieved when teams can maintain stable response operations with less managerial intervention and clearer day-to-day execution ownership.

Primary user success signals:
- Agents can triage and respond across channels from one workspace.
- Managers spend less time on manual coordination and escalations.
- Internal teams report improved confidence in response pace and operational control.

### Business Success

For the internal MVP phase, business success is defined by operational validation rather than external revenue outcomes. The product must prove that multi-channel support can run with measurable response performance and meaningful internal adoption.

Business success signals:
- Daily usage reaches broad internal adoption among target users.
- Response performance targets are consistently met.
- Team-level operational satisfaction improves due to faster, more predictable response handling.

### Technical Success

The MVP must deliver reliable performance for core conversation workflows (open conversation, read context, send message) and stable multi-channel message handling.

Technical success requires:
- Platform availability target maintained during MVP operation.
- Core interaction latency low enough to support real-time operational work.
- Message delivery reliability acceptable for proof-of-concept operation while highlighting improvement priorities.

### Measurable Outcomes

- **First response time:** `< 15 minutes` target.
- **SLA compliance:** `95%` of incoming conversations responded to within `20 minutes`.
- **Internal adoption:** `70%` of target internal users active daily within `30-60 days`.
- **Availability:** `99.5%`.
- **Core UI/API responsiveness:** key actions (open/send) around `<= 2 seconds`.
- **Outbound message failure threshold (MVP):** up to `5%` maximum tolerated failure rate, with explicit tracking and remediation backlog.
- **Operational quality trend:** measurable reduction in response time and improved internal team satisfaction regarding response speed.

## Product Scope

### MVP - Minimum Viable Product

- Unified inbox for **Telegram, WhatsApp, and Email**.
- Conversation lifecycle basics (inbox list, thread view, response send, status handling).
- Internal user authentication and role-based access control baseline.
- Core operational visibility for managers (response pace and queue health).
- Baseline reliability instrumentation (uptime, latency, delivery failures).

### Growth Features (Post-MVP)

- Deeper workflow automation (routing rules, smart assignment, SLA breach alerts).
- Stronger analytics (team-level performance dashboards, trend analysis, comparative periods).
- Expanded governance (finer audit workflows, advanced role templates, approval automations).
- AI-assisted response enhancements and suggestion quality tuning.

### Vision (Future)

- Full customer operations console for multi-team support at scale.
- Proactive operations layer with intelligent triage, prioritization, and workload balancing.
- Cross-channel orchestration with stronger automation, policy enforcement, and continuous quality optimization.

## User Journeys

### Journey 1 - Agent Success Path (Primary User)

Mariana starts her shift with a full queue spread across Telegram, WhatsApp, and Email. Before Omnichat, she had to switch tools and track priorities manually; now she opens one inbox and immediately sees unread conversations ordered by urgency and SLA pressure.

She triages each thread, responds using channel-appropriate context, and updates conversation status without leaving the workspace. Her critical moment comes when she resolves multiple cross-channel requests in sequence with no tool switching and no loss of context.

By the end of the shift, Mariana has cleared high-priority tickets faster and with lower cognitive load. The new reality is predictable execution: fewer missed messages, less rework, and more confidence in response quality.

### Journey 2 - Agent Edge Case / Recovery Path (Primary User)

A high-value customer sends near-simultaneous messages through WhatsApp and Email, while one outbound reply fails due to channel instability. Mariana sees delivery feedback in Omnichat, identifies the failed send, and retries through the correct channel workflow.

She escalates the thread when SLA risk increases and leaves a clean internal trail for manager review. The emotional peak is the recovery moment: instead of panic and guesswork, she follows a clear path to restore communication.

The resolution is controlled service continuity. Even with delivery failures or channel noise, the team maintains response standards and avoids silent customer drop-off.

### Journey 3 - Manager Operations Journey (Admin/Operations User)

Carlos is responsible for team performance but cannot spend the day in manual coordination. He opens Omnichat to monitor response pace, unread load, and SLA compliance, then identifies bottlenecks by channel and shift.

He intervenes only where needed: reassigns workload, adjusts priorities, and validates whether the team is staying under the defined response thresholds. The key value moment is when he sees operations running without constant supervision.

His new baseline is management by exception, not by firefighting. Time previously spent chasing updates is redirected to planning, process improvement, and other business-critical tasks.

### Journey 4 - System Admin Governance Journey (Support/Troubleshooting)

Ana configures user access, role permissions, and channel settings for the internal MVP operation. She ensures the right people have the right permissions, validates that channel credentials are active, and checks audit visibility for sensitive actions.

When onboarding new agents, she grants role-based access without exposing admin-level settings. If an access or configuration issue appears, she uses centralized settings and logs to diagnose and correct quickly.

Her success state is governance with low friction: secure operations, clearer accountability, and stable platform administration that does not block frontline support work.

### Journey Requirements Summary

These journeys reveal required capabilities for the MVP:
- Unified multi-channel inbox (Telegram, WhatsApp, Email) with consistent thread handling.
- Fast triage and response flows with status updates and unread visibility.
- Delivery feedback and retry paths for failed outbound messages.
- SLA-aware queue management and operational oversight for managers.
- Role-based access control and safe admin configuration workflows.
- Auditability for sensitive configuration and user-management actions.
- Reliability telemetry (availability, latency, message failure rate) tied to success metrics.

## Domain-Specific Requirements

### Compliance & Regulatory

- No formal external compliance certification is required for the internal MVP release.
- The product must still maintain baseline internal governance practices for access control, change traceability, and operational accountability.

### Technical Constraints

- Role-based access control is mandatory for all internal users.
- Audit logging is required for sensitive administrative actions (user management, role changes, and settings updates).
- Channel credentials and sensitive configuration data must be stored securely and never exposed in plain text through operational interfaces.
- The platform must maintain the MVP technical targets already defined (availability, latency, and failure-rate thresholds).

### Integration Requirements

- Telegram integration is required for inbound and outbound operational messaging.
- WhatsApp Cloud API integration is required for inbound and outbound messaging flows.
- Email integration via IMAP/SMTP is required for conversation ingestion and response handling.
- Cross-channel message normalization is required so agents can operate from one unified inbox model.

### Risk Mitigations

- Primary operational risks: outbound message delivery failure and SLA degradation.
- Mitigation baseline:
  - per-channel delivery failure monitoring,
  - retry strategy for failed outbound sends,
  - manager-facing alerting when failure/SLA thresholds are exceeded.
- The MVP must provide enough observability to detect degradation early and trigger corrective action before queue instability escalates.

## Innovation & Novel Patterns

### Detected Innovation Areas

- **Operational reliability by design** as a product differentiator, not just a unified inbox.
- **SLA-risk-driven prioritization** to guide queue ordering and intervention decisions.
- **Resilient outbound orchestration** (channel-aware retry, failure classification, and recovery flow).
- **Management by exception** model, reducing routine managerial dependency.
- **Governed operations baseline** (RBAC, auditability, and safer configuration handling) as part of core product behavior.

### Market Context & Competitive Landscape

- Many support tools provide channel aggregation, but internal teams still struggle with execution predictability under operational stress.
- The differentiator here is not novelty theater; it is a practical shift from "message collection" to **reliable conversation operations**.
- For internal MVP use, competitive edge is defined by modular fit, lower operational overhead, and adaptability to specific business workflows.

### Validation Approach

- Validate whether SLA performance remains stable during high-load and cross-channel concurrency scenarios.
- Measure reduction in manager intervention required for daily queue handling.
- Track failure-recovery effectiveness for outbound messages by channel.
- Confirm that agents complete core workflows faster with less context switching.
- Run controlled internal pilot cycles comparing pre-Omnichat vs Omnichat operational metrics.

### Risk Mitigation

- **Risk:** delivery failures degrade trust.  
  **Mitigation:** channel-level monitoring, retry strategy, and manager alerts.
- **Risk:** SLA drift under burst traffic.  
  **Mitigation:** risk-based prioritization and early degradation signals.
- **Risk:** adoption drop due to workflow friction.  
  **Mitigation:** simplify core actions and reinforce "next best action" UX.
- **Risk:** governance gaps create operational instability.  
  **Mitigation:** strict RBAC boundaries, auditable admin actions, and config guardrails.

## SaaS B2B Specific Requirements

### Project-Type Overview

Omnichat is specified as an internal **single-tenant SaaS B2B** platform for support operations. The MVP is focused on operational execution quality (multi-channel response reliability, SLA control, and governance) rather than commercial packaging or external customer onboarding flows.

The product must support an internal organization model with clear role separation and controlled administrative authority, while preserving flexibility to evolve role structures over time.

### Technical Architecture Considerations

- **Tenancy model (MVP):** single-tenant.
- **Access model:** RBAC with baseline roles `Admin`, `Manager`, and `Agent`.
- **Role extensibility:** the system must allow creation of additional custom roles beyond baseline profiles.
- **Integration boundary (MVP):** no mandatory external enterprise integrations beyond channel connectors (Telegram, WhatsApp, Email).
- **Scalability baseline:** architecture and runtime behavior should support approximately **100 concurrent internal operators** without severe degradation of core flows.

### Tenant Model

- Single internal tenant for MVP operations.
- Shared operational workspace with role-scoped permissions.
- Tenant isolation features for multi-tenant scenarios are explicitly out of MVP scope.

### RBAC Matrix / Permission Model

- Baseline roles:
  - `Admin`: full governance and system configuration control.
  - `Manager`: operational supervision, SLA tracking, and team-level oversight.
  - `Agent`: conversation handling and response execution.
- Role model must be extensible with custom profiles.
- Permission grants must be explicit, auditable, and safely reversible.
- Critical operations must require role-appropriate permission checks at API and UI levels.

### Integration Profile

- In-scope integrations for MVP:
  - Telegram
  - WhatsApp Cloud API
  - Email (IMAP/SMTP)
- Out of scope for MVP:
  - CRM integrations
  - ERP integrations
  - General external webhook orchestration as a required capability

### Implementation Considerations

- **Commercial packaging:** subscription tiers/plans are out of scope for internal MVP.
- **User provisioning:** self-signup with admin approval is accepted for MVP, with admin-managed role assignment and activation controls.
- **Audit coverage baseline:** log all critical events that affect security posture, governance, or software behavior, including:
  - role and permission changes,
  - channel configuration updates,
  - user enable/disable/delete actions,
  - other high-impact administrative actions.
- **Operational target:** preserve reliability and SLA visibility at the defined concurrency baseline (100 users).

## Project Scoping

### Strategy & Philosophy

**Approach:** Single-release internal MVP focused on operational validation, response reliability, and governance readiness.  
**Resource Requirements:** Lean cross-functional team covering backend/API, frontend, integrations (Telegram/WhatsApp/Email), and QA/operations validation.

### Complete Feature Set

**Core User Journeys Supported:**
- Agent success path for multi-channel triage and response.
- Agent recovery path for delivery failures and SLA-risk handling.
- Manager oversight journey for queue/SLA supervision and intervention.
- Admin governance journey for RBAC, channel configuration, and audit-backed operations.

**Must-Have Capabilities:**
- Unified inbox for Telegram, WhatsApp Cloud API, and Email.
- Conversation lifecycle core (list, thread, reply, status, unread control).
- SLA visibility and risk-aware operational prioritization.
- Delivery failure observability and retry workflow.
- RBAC baseline (`Admin`, `Manager`, `Agent`) with extensible custom roles.
- Critical-event audit logging and secure channel credential handling.
- Self-signup with admin approval and controlled activation.
- Reliability instrumentation aligned to targets (availability, latency, failure rate).
- Single-tenant architecture supporting ~100 concurrent internal operators.

**Nice-to-Have Capabilities:**
- Advanced automation (smart routing, richer SLA automations).
- Expanded analytics depth and comparative performance views.
- Enhanced AI assistance quality and deeper recommendation logic.
- Broader governance templates and administrative workflow enhancements.

### Risk Mitigation Strategy

**Technical Risks:** Channel delivery instability, SLA drift under concurrency, and configuration-induced incidents.  
**Mitigation:** Channel-level monitoring, retry strategy, early SLA risk signals, strict permission checks, and config guardrails.

**Market/Adoption Risks:** Internal teams reverting to old tools if workflows feel slower or unclear.  
**Mitigation:** Keep core flow simpler than current process, enforce fast-path UX for agents, and track adoption + response metrics continuously.

**Resource Risks:** Team bandwidth constraints affecting release quality.  
**Mitigation:** Protect must-have scope, defer nice-to-have items, and prioritize reliability/governance over feature expansion.

## Functional Requirements

### User Identity & Access Management

- FR1: Visitor can create an account request through self-signup.
- FR2: Admin can approve or reject pending account requests.
- FR3: Admin can assign a role to any approved user.
- FR4: Admin can enable or disable user accounts.
- FR5: Admin can create additional custom roles beyond baseline roles.
- FR6: Admin can update permissions for custom roles.
- FR7: System can enforce permission checks for protected actions.
- FR8: User can authenticate and access only authorized areas.
- FR9: User can recover account access through password reset flow.

### Multi-Channel Conversation Operations

- FR10: Agent can view a unified inbox containing Telegram, WhatsApp, and Email conversations.
- FR11: Agent can open a conversation thread and view full message history.
- FR12: Agent can send outbound messages from a conversation thread.
- FR13: System can ingest inbound messages from each supported channel.
- FR14: System can associate inbound and outbound messages to the correct conversation.
- FR15: Agent can update conversation status.
- FR16: Agent can mark conversation read/unread state.
- FR17: System can maintain last message summary and timestamp per conversation.
- FR18: Agent can handle concurrent conversations without leaving the unified workspace.

### SLA & Queue Management

- FR19: Manager can view operational indicators for response pace and queue health.
- FR20: System can surface conversations at risk of SLA breach.
- FR21: System can prioritize conversations based on operational risk criteria.
- FR22: Manager can monitor unread and pending workload by channel.
- FR23: Manager can reassign ownership or intervention priority for conversations.
- FR24: System can track first-response SLA compliance for reporting.

### Message Delivery Reliability

- FR25: System can detect outbound delivery failures by channel.
- FR26: System can expose failed-delivery status for operational users.
- FR27: System can execute retry flow for failed outbound messages.
- FR28: Manager can receive alerts when delivery-failure thresholds are exceeded.
- FR29: Manager can receive alerts when SLA-risk thresholds are exceeded.

### Governance, Audit & Configuration

- FR30: Admin can configure Telegram channel settings.
- FR31: Admin can configure WhatsApp Cloud API settings.
- FR32: Admin can configure Email IMAP/SMTP settings.
- FR33: System can store channel credentials securely.
- FR34: System can record audit logs for critical administrative actions.
- FR35: Admin can view audit records for governance-relevant events.
- FR36: System can log role and permission changes as auditable events.
- FR37: System can log high-impact configuration changes as auditable events.

### Analytics & Operational Visibility

- FR38: Manager can view dashboard metrics for conversation volume and status.
- FR39: Manager can view daily operational trends for conversations and messages.
- FR40: Manager can view channel distribution metrics.
- FR41: System can provide resolution-related operational indicators.
- FR42: System can support internal tracking of adoption and response-quality outcomes.

### Admin & Platform Operations

- FR43: Admin can manage user profiles and role assignments from admin workspace.
- FR44: Admin can manage baseline platform settings from admin workspace.
- FR45: System can support internal single-tenant operation for the organization.
- FR46: System can support approximately 100 concurrent internal operators in core workflows.

## Non-Functional Requirements

### Performance

- NFR1: Core operational actions (open conversation, send message) should complete in up to **2 seconds** under normal MVP load conditions.
- NFR2: The platform should sustain defined MVP operation for approximately **100 concurrent internal operators** without severe degradation of core workflows.
- NFR3: SLA monitoring and risk indicators should update frequently enough to support operational intervention before threshold breach.

### Reliability & Availability

- NFR4: Platform availability target for MVP operation is **99.5%**.
- NFR5: Outbound message processing should keep failed-delivery rate within the defined MVP tolerance threshold (**<= 5%**) while failures are tracked and actionable.
- NFR6: The system should provide degradation visibility and alerting to managers when SLA-risk or delivery-failure thresholds are exceeded.

### Security

- NFR7: Access to protected capabilities must be enforced through role-based authorization checks at both API and application layers.
- NFR8: Sensitive channel credentials and secrets must be stored securely and must not be exposed in clear text through operational interfaces.
- NFR9: Authentication and account recovery flows must protect user identity and session integrity.

### Auditability & Governance

- NFR10: Critical administrative actions must be logged with sufficient detail for accountability and post-incident analysis.
- NFR11: Audit records must be queryable by authorized users for governance and operational review.
- NFR12: Role/permission changes and high-impact configuration modifications must be traceable as auditable events.

### Integration Robustness

- NFR13: Channel integrations (Telegram, WhatsApp Cloud API, Email) should handle transient failures with recoverable behavior rather than silent message loss.
- NFR14: Inbound/outbound channel events should be normalized into a consistent conversation model to preserve operational continuity across channels.

### Scalability (MVP Bound)

- NFR15: The MVP architecture should be maintainable and extensible from current single-tenant operation toward future scaling needs without full platform rewrite.
- NFR16: The system should maintain acceptable operational behavior during expected workload peaks inside MVP boundaries.

### Accessibility (Relevant Baseline)

- NFR17: Core operator workflows should support clear, consistent interaction patterns suitable for sustained daily use by internal teams.
- NFR18: The web interface should maintain baseline keyboard accessibility and readable visual contrast for core operational screens.

