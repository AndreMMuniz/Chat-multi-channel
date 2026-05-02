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

export async function assignConversation(
  conversationId: string,
  assignedUserId: string | null
): Promise<import("@/types/chat").Conversation> {
  return apiMutate<{ assigned_user_id: string | null }, import("@/types/chat").Conversation>(
    `/chat/conversations/${conversationId}/assign`,
    "PATCH",
    { assigned_user_id: assignedUserId }
  );
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await apiMutate<undefined, void>(
    `/chat/conversations/${conversationId}`,
    "DELETE"
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
