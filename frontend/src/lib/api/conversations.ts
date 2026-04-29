/** Conversations & messages API */

import { apiGetList, apiMutate } from "@/lib/apiClient";
import type { ApiResponse } from "@/types/api";
import type {
  Conversation,
  Message,
  SendMessageRequest,
  UpdateConversationRequest,
} from "@/types/chat";

export async function getConversations(
  limit = 100
): Promise<ApiResponse<Conversation[]>> {
  return apiGetList<Conversation>(`/chat/conversations?limit=${limit}`);
}

export async function getMessages(
  conversationId: string,
  limit = 100
): Promise<ApiResponse<Message[]>> {
  return apiGetList<Message>(
    `/chat/conversations/${conversationId}/messages?limit=${limit}`
  );
}

export async function sendMessage(
  conversationId: string,
  payload: Omit<SendMessageRequest, "conversation_id">
): Promise<Message> {
  return apiMutate<SendMessageRequest, Message>(
    `/chat/conversations/${conversationId}/messages`,
    "POST",
    { conversation_id: conversationId, ...payload }
  );
}

export async function updateConversation(
  conversationId: string,
  data: UpdateConversationRequest
): Promise<Conversation> {
  return apiMutate<UpdateConversationRequest, Conversation>(
    `/chat/conversations/${conversationId}`,
    "PATCH",
    data
  );
}

export async function retryMessage(
  conversationId: string,
  messageId: string
): Promise<Message> {
  return apiMutate<undefined, Message>(
    `/chat/conversations/${conversationId}/messages/${messageId}/retry`,
    "POST"
  );
}
