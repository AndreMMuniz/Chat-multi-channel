/** Chat domain types — mirrors backend models/models.py + schemas/chat.py */

export type ChannelType = "TELEGRAM" | "WHATSAPP" | "EMAIL" | "SMS" | "WEB";
export type ConversationStatus = "OPEN" | "CLOSED" | "PENDING";
export type ConversationTag = "SUPPORT" | "BILLING" | "FEEDBACK" | "SALES" | "GENERAL" | "SPAM";
export type MessageType = "text" | "image" | "file" | "audio";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed";

export interface Contact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  channel_identifier?: string;
  created_at?: string;
}

export interface AssignedUser {
  id: string;
  full_name: string;
  email: string;
  avatar?: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  channel: ChannelType;
  status: ConversationStatus;
  tag?: ConversationTag | null;
  is_unread: boolean;
  last_message?: string;
  last_message_date?: string;
  first_response_at?: string;
  assigned_user_id?: string;
  assigned_user?: AssignedUser;
  thread_id?: string;
  created_at: string;
  updated_at: string;
  contact: Contact;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  inbound: boolean;
  message_type: MessageType;
  /** Auto-incremented per conversation — guarantees display order */
  conversation_sequence: number;
  image?: string;
  file?: string;
  owner_id?: string;
  created_at: string;
  /** Delivery tracking (Story 4.1) — only set for outbound messages */
  delivery_status?: DeliveryStatus;
  delivery_error?: string;
  retry_count?: number;
}

/** POST /chat/conversations/{id}/messages request */
export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  message_type: MessageType;
  inbound?: boolean;
  owner_id?: string;
  image?: string;
  file?: string;
  idempotency_key?: string;
}

/** PATCH /chat/conversations/{id} request */
export interface UpdateConversationRequest {
  status?: ConversationStatus;
  tag?: ConversationTag | null;
  is_unread?: boolean;
}

// ── Dashboard analytics types ────────────────────────────────────────────────

export interface DayPoint {
  date: string;
  count: number;
}

export interface DashboardStats {
  total_conversations: number;
  open_conversations: number;
  closed_conversations: number;
  pending_conversations: number;
  unread_conversations: number;
  messages_today: number;
  resolution_rate: number;
  avg_resolution_hours: number | null;
  channels: Record<string, number>;
  daily_conversations: DayPoint[];
  prev_daily_conversations: DayPoint[];
  daily_messages: DayPoint[];
  prev_daily_messages: DayPoint[];
  period_days: number;
  current_period_conversations: number;
  prev_period_conversations: number;
  current_period_messages: number;
  prev_period_messages: number;
  // Epic 3 — SLA & Queue Health
  sla_at_risk: number;
  sla_threshold_minutes: number;
  sla_compliance_pct: number;
  avg_first_response_minutes: number | null;
  queue_by_channel: Record<string, number>;
  unassigned_open: number;
  // Epic 6 — Analytics
  p50_resolution_hours: number | null;
  p90_resolution_hours: number | null;
  agent_stats: AgentStat[];
  ai_suggestions_generated: number;
  convs_with_ai: number;
  ai_adoption_pct: number;
}

export interface AgentStat {
  id: string;
  full_name: string;
  conversations_handled: number;
  avg_first_response_min: number | null;
  resolved: number;
  resolution_rate: number;
}
