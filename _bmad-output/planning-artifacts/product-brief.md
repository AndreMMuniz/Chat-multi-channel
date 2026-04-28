# Product Brief: Omnichannel Customer Support Hub (Omnichat)

## Executive Summary
Omnichat is a multi-channel customer support platform that centralizes customer conversations from Telegram, WhatsApp, Email, and SMS into one agent workspace. Instead of forcing support teams to operate in disconnected tools, Omnichat provides a single inbox, role-based operations, and AI-assisted response workflows.

The product addresses a common operational gap in small and mid-sized support teams: fragmented channels, inconsistent response quality, and poor governance around who can perform sensitive actions. Omnichat combines conversation operations and administrative control in one system, with configurable RBAC, audit visibility, and a modern web UI.

Now is a strong timing window because multi-channel support expectations have become standard, while many teams still rely on manual processes and tool switching. Omnichat can win by reducing operational friction quickly with a focused, execution-first product.

## The Problem
Support teams typically work across separate apps for messaging, email, and social channels. This creates context switching, slower response times, and inconsistent customer experience.

Operational controls are also weak in many setups. Teams often lack granular permissions, clear approval flows for staff onboarding, and auditability for high-risk admin actions.

As volume grows, this fragmentation increases cost: delayed response times, lower agent productivity, avoidable errors, and weaker accountability.

## The Solution
Omnichat provides:
- A unified conversation workspace for multi-channel interactions
- Authentication and access control integrated with Supabase Auth
- Granular RBAC via custom user types and permission flags
- Admin workspace for users, roles, settings, and dashboard analytics
- AI-assisted response capabilities to accelerate agent workflows
- Real-time updates via WebSocket for collaborative operations

The intended outcome is a faster, safer support operation with clearer ownership and less channel fragmentation.

## What Makes This Different
Primary differentiation is the combination of:
- Practical omni-channel operations in one lightweight stack
- Built-in configurable RBAC as a first-class capability, not an afterthought
- Direct operational controls (settings, roles, approval flow, audit logs)
- Execution speed on a modern architecture (FastAPI + Next.js)

The near-term moat is product cohesion and implementation speed for teams that need pragmatic, deployable support tooling quickly.

## Who This Serves
Primary users:
- Support agents handling day-to-day conversations
- Team leads managing quality and throughput
- Operations admins responsible for user lifecycle, permissions, and system settings

Secondary users:
- Business owners who need visibility into support performance and operational risk

## Success Criteria
User and workflow outcomes:
- Reduced first-response time across channels
- Increased agent throughput per shift
- Reduced context switching between tools

Business and operational outcomes:
- Adoption of role-based governance (all users assigned proper roles)
- Measurable use of audit logs for sensitive operations
- Stable weekly growth in handled conversations without proportional staffing increase

Platform quality outcomes:
- Secure-by-default access controls on operational endpoints
- Reliable channel ingestion and outbound delivery for supported channels

## Scope
In scope for v1:
- Unified inbox for at least Telegram and web-origin conversations
- Admin panel for users, roles, settings, and core dashboard KPIs
- Authentication flow (login/signup/recovery) with approval support
- File upload support for conversation attachments
- Baseline AI suggestion flow integrated into chat operations

Out of scope for v1:
- Full CRM suite and advanced ticket orchestration
- Deep analytics/BI exports beyond core dashboard metrics
- Advanced workforce management (scheduling, QA scoring)
- Full enterprise compliance packaging (SOC2, ISO) in first release

## Vision
Over the next 2-3 years, Omnichat can evolve from a unified inbox into a full customer operations console: channel orchestration, SLA automation, AI-assisted triage and drafting, performance intelligence, and deeper integration with sales/service systems.

The long-term vision is to become the operating layer for customer conversations where teams can respond faster, govern access safely, and continuously improve support quality with AI and automation.
