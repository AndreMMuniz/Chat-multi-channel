/** Chat domain types — mirrors backend models/models.py + schemas/chat.py */

export type ChannelType = "TELEGRAM" | "WHATSAPP" | "EMAIL" | "SMS" | "WEB";
export type ConversationStatus = "OPEN" | "CLOSED" | "PENDING";
export type ConversationTag = "SUPPORT" | "SALES" | "GENERAL";
export type MessageType = "text" | "image" | "file" | "audio";

export interface Contact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  channel_identifier?: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  channel: ChannelType;
  status: ConversationStatus;
  tag?: ConversationTag;
  is_unread: boolean;
  last_message?: string;
  last_message_date?: string;
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
  tag?: ConversationTag;
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
  daily_messages: DayPoint[];
  period_days: number;
  current_period_conversations: number;
  prev_period_conversations: number;
  current_period_messages: number;
  prev_period_messages: number;
}
