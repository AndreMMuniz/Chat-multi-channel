"use client";

import { useState, useCallback } from "react";
import { aiApi } from "@/lib/api/index";

export interface UseAISuggestionsReturn {
  suggestions: string[];
  loading: boolean;
  generating: boolean;
  fetchCached: (conversationId: string) => Promise<void>;
  generate: (conversationId: string) => Promise<void>;
  clear: () => void;
}

export function useAISuggestions(): UseAISuggestionsReturn {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchCached = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const result = await aiApi.getSuggestions(conversationId);
      setSuggestions(result.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const generate = useCallback(async (conversationId: string) => {
    setGenerating(true);
    try {
      const result = await aiApi.generateSuggestions(conversationId);
      setSuggestions(result.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setGenerating(false);
    }
  }, []);

  const clear = useCallback(() => setSuggestions([]), []);

  return { suggestions, loading, generating, fetchCached, generate, clear };
}
