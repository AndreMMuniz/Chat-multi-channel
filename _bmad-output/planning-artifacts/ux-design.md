# UX Design Document - Omnichat Multi-Channel Support Platform

**Project:** Chat-multi-channel (Omnichat)
**Author:** AI Assistant (BMad UX Workflow)
**Date:** 2026-04-28
**Based on:** prd.md and architecture.md

## Overview

Omnichat is an internal B2B SaaS platform for managing multi-channel customer support across Telegram, WhatsApp, and Email. This UX design focuses on operational efficiency, reducing managerial overhead, and providing a unified workspace for agents, managers, and admins.

### Design Principles
- **Modularity:** Adaptable to business workflows
- **Simplicity:** Clear, consistent interactions
- **Reliability:** Operational trust through visibility and feedback
- **Role-Based:** Tailored experiences for Admin, Manager, Agent

### Target Users
- **Agents:** Handle conversations, triage, respond
- **Managers:** Monitor operations, intervene when needed
- **Admins:** Configure channels, manage users, audit

## User Flows

### Primary Flow: Agent Conversation Handling

1. **Login:** Agent authenticates via email/password
2. **Unified Inbox:** View prioritized conversation list (SLA risk, unread, channel)
3. **Open Thread:** Click conversation to view message history
4. **Respond:** Type message, send (channel-aware formatting)
5. **Update Status:** Mark read/unread, resolve, escalate
6. **Monitor Delivery:** View send status, retry on failure
7. **Repeat:** Switch conversations seamlessly

### Secondary Flow: Manager Oversight

1. **Dashboard Access:** Login to manager view
2. **Queue Health:** View SLA compliance, channel distribution, response metrics
3. **Intervene:** Reassign conversations, adjust priorities
4. **Alert Response:** Handle delivery failure or SLA breach alerts
5. **Reports:** Review daily trends, operational indicators

### Admin Flow: System Configuration

1. **Admin Login:** Access admin panel
2. **User Management:** Approve requests, assign roles, enable/disable
3. **Channel Setup:** Configure Telegram/WhatsApp/Email credentials
4. **Audit Review:** View logs for governance
5. **Settings:** Adjust platform configurations

### Error Handling Flow.

1. **Delivery Failure:** Agent sees red status, retries or escalates
2. **SLA Breach:** Manager alerted, intervenes
3. **Auth Failure:** Redirect to login with message
4. **Network Error:** Retry with backoff, show offline mode

## Wireframes

### 1. Login Page
```
+-----------------------------------+
|         Omnichat Login            |
+-----------------------------------+
| Email: [input]                    |
| Password: [input]                 |
| [Login Button]                    |
| Forgot Password? [Link]           |
|                                   |
| New User? [Signup Link]           |
+-----------------------------------+
```
- Clean, centered layout
- Email/password fields with validation
- Links for recovery/signup

### 2. Unified Inbox (Agent View)
```
+-----------------------------------+-------------------+
| Channel | SLA Risk | Subject      | Last Msg | Status  |
+-----------------------------------+-------------------+
| TG      | HIGH     | Urgent Order | 2 min    | Unread  |
| WA      | MED      | Billing Q    | 15 min   | Open    |
| EM      | LOW      | Feedback     | 1 hr     | Resolved|
+-----------------------------------+-------------------+
| [New Conversation] [Filters]      | [Queue Health]    |
+-----------------------------------+-------------------+
```
- Table view with sortable columns
- Color coding: Red for high SLA risk
- Channel icons: TG (telegram), WA (whatsapp), EM (email)

### 3. Conversation Thread
```
+-------------------+-------------------+
| From: Customer    | Channel: Telegram |
| Status: Open      | SLA: 12 min left  |
+-------------------+-------------------+
| Customer: Hello   | 10:00 AM          |
| Agent: Hi there!  | 10:02 AM          |
| Customer: Issue   | 10:05 AM          |
+-------------------+-------------------+
| [Type response...]                |
| [Send] [Attach] [Retry Failed]    |
+-------------------+-------------------+
```
- Message bubbles with timestamps
- Delivery status: Sent, Delivered, Failed
- Response input with channel hints

### 4. Manager Dashboard
```
+-----------------------------------+
| Queue Health:                     |
| - Unread: 15                      |
| - SLA Risk: 3                     |
| - Avg Response: 8 min             |
+-----------------------------------+
| Channel Breakdown:                |
| TG: 40% WA: 30% EM: 30%           |
+-----------------------------------+
| [Reassign] [Alerts] [Reports]     |
+-----------------------------------+
```
- Metrics cards
- Visual charts for trends
- Action buttons for intervention

### 5. Admin Panel
```
+-----------------------------------+
| Users:                            |
| - Pending: 2                      |
| - Active: 45                      |
+-----------------------------------+
| [Approve Users] [Manage Roles]    |
+-----------------------------------+
| Channels:                         |
| TG: Configured WA: Pending EM: OK |
+-----------------------------------+
| [Settings] [Audit Logs]           |
+-----------------------------------+
```
- Tabbed interface for different admin functions
- Status indicators for configurations

## Interface Specifications

### Layout Structure
- **Header:** Logo, user menu, notifications, logout
- **Sidebar:** Navigation (Inbox, Dashboard, Admin - role-based)
- **Main Content:** Page-specific views
- **Footer:** Version, help link

### Component Library (Shadcn/UI + Tailwind)
- **Buttons:** Primary (blue), Secondary (gray), Destructive (red)
- **Inputs:** Text, password, textarea with validation states
- **Tables:** Sortable, filterable with pagination
- **Cards:** For metrics, conversation previews
- **Modals:** For confirmations, settings
- **Toasts:** For success/error feedback

### Responsive Design
- **Desktop:** Full layout
- **Tablet:** Collapsible sidebar
- **Mobile:** Stacked layout, swipe for threads

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast mode
- ARIA labels on interactive elements

### Visual Design
- **Colors:** Blue primary (#3B82F6), Gray neutrals, Red alerts
- **Typography:** Inter font, sizes: 14px body, 16px headings
- **Spacing:** 8px grid system
- **Icons:** Lucide React icons

### Interaction Patterns
- **Hover:** Highlight rows/buttons
- **Click:** Primary actions
- **Double-click:** Quick open (conversations)
- **Drag:** Reassign conversations (managers)
- **Real-time:** WebSocket updates for new messages

### Error States
- Field validation: Red border, error text below
- Page errors: Full-screen error with retry
- Network offline: Banner with offline mode

### Loading States
- Skeletons for lists
- Spinners for actions
- Progressive loading for threads

## Validation & Testing

### Usability Testing
- 5 agents: Task completion for response flow
- 3 managers: Dashboard navigation and alerts
- 2 admins: Configuration workflows

### Performance Benchmarks
- Page load: <2s
- Message send: <1s visible feedback
- Real-time updates: <500ms

### Accessibility Audit
- WCAG 2.1 AA compliance
- Color contrast ratios >4.5:1
- Keyboard-only navigation tested

## Implementation Notes

- Built with Next.js 14, TypeScript
- Styled with Tailwind + Shadcn
- State: React Context + TanStack Query
- Real-time: WebSocket events
- Responsive: Mobile-first design

## Next Steps

1. Prototype key screens in Figma
2. User testing with wireframes
3. Iterate based on feedback
4. Develop high-fidelity designs
5. Hand off to development team</content>
<parameter name="filePath">_bmad-output/planning-artifacts/ux-design.md