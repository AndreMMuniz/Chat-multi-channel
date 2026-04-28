import { apiGet, apiGetList, apiMutate } from "@/lib/apiClient";
import type { ApiResponse } from "@/types/api";
import type { QuickReply, QuickReplyCreate, QuickReplyUpdate } from "@/types/quickReply";

export async function listQuickReplies(): Promise<ApiResponse<QuickReply[]>> {
  return apiGetList<QuickReply>("/admin/quick-replies?limit=100");
}

export async function searchQuickReplies(q: string): Promise<QuickReply[]> {
  return apiGet<QuickReply[]>(`/admin/quick-replies/search?q=${encodeURIComponent(q)}`);
}

export async function createQuickReply(data: QuickReplyCreate): Promise<QuickReply> {
  return apiMutate<QuickReplyCreate, QuickReply>("/admin/quick-replies", "POST", data);
}

export async function updateQuickReply(id: string, data: QuickReplyUpdate): Promise<QuickReply> {
  return apiMutate<QuickReplyUpdate, QuickReply>(`/admin/quick-replies/${id}`, "PATCH", data);
}

export async function deleteQuickReply(id: string): Promise<void> {
  await apiMutate(`/admin/quick-replies/${id}`, "DELETE");
}
