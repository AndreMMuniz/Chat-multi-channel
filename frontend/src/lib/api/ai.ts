/** AI Suggestions API */

import { apiGet, apiMutate } from "@/lib/apiClient";

export interface AISuggestionsPayload {
  suggestions: string[];
  conversation_id: string;
}

export async function getSuggestions(
  conversationId: string
): Promise<AISuggestionsPayload> {
  return apiGet<AISuggestionsPayload>(
    `/chat/conversations/${conversationId}/suggestions`
  );
}

export async function generateSuggestions(
  conversationId: string
): Promise<AISuggestionsPayload> {
  return apiMutate<undefined, AISuggestionsPayload>(
    `/chat/conversations/${conversationId}/suggestions/generate`,
    "POST"
  );
}
