export interface QuickReply {
  id: string;
  shortcut: string;   // e.g. "/hello"
  content: string;
  created_at: string;
}

export interface QuickReplyCreate {
  shortcut: string;
  content: string;
}

export interface QuickReplyUpdate {
  shortcut?: string;
  content?: string;
}
