/** Shared API envelope types — mirrors backend schemas/common.py */

export interface ApiMeta {
  timestamp: string;
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

/** WebSocket sequenced event — mirrors backend core/websocket.py */
export interface SequencedEvent {
  id: string;
  sequence: number;
  conversation_id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  requires_ack: boolean;
}
