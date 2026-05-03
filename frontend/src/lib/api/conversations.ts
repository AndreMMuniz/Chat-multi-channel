/** Conversations & messages API */

import { apiGetList, apiMutate } from "@/lib/apiClient";
import type { ApiResponse } from "@/types/api";
import type {
  Conversation,
  Message,
  SendMessageRequest,
  UpdateConversationRequest,
} from "@/types/chat";

function normalizeConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    channel: conversation.channel?.toUpperCase() as Conversation["channel"],
    status: conversation.status?.toUpperCase() as Conversation["status"],
    tag: conversation.tag ? (conversation.tag.toUpperCase() as NonNullable<Conversation["tag"]>) : conversation.tag,
  };
}

function toBackendConversationUpdate(data: UpdateConversationRequest) {
  return {
    ...data,
    status: data.status?.toLowerCase(),
    tag: data.tag?.toLowerCase() ?? data.tag,
  };
}

export async function getConversations(
  limit = 100
): Promise<ApiResponse<Conversation[]>> {
  const response = await apiGetList<Conversation>(`/chat/conversations?limit=${limit}`);
  return {
    ...response,
    data: response.data.map(normalizeConversation),
  };
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
  const updated = await apiMutate<ReturnType<typeof toBackendConversationUpdate>, Conversation>(
    `/chat/conversations/${conversationId}`,
    "PATCH",
    toBackendConversationUpdate(data)
  );
  return normalizeConversation(updated);
}

export async function assignConversation(
  conversationId: string,
  assignedUserId: string | null
): Promise<import("@/types/chat").Conversation> {
  const updated = await apiMutate<{ assigned_user_id: string | null }, import("@/types/chat").Conversation>(
    `/chat/conversations/${conversationId}/assign`,
    "PATCH",
    { assigned_user_id: assignedUserId }
  );
  return normalizeConversation(updated);
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

export async function deleteMessage(
  conversationId: string,
  messageId: string
): Promise<{ deleted: boolean; id: string }> {
  return apiMutate<undefined, { deleted: boolean; id: string }>(
    `/chat/conversations/${conversationId}/messages/${messageId}`,
    "DELETE"
  );
}
