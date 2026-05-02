"use client";

import { useState, useCallback } from "react";
import { aiApi } from "@/lib/api/index";

export type SuggestionsSource = "cache" | "generated" | null;

export interface UseAISuggestionsReturn {
  suggestions: string[];
  source: SuggestionsSource;
  generatedAt: Date | null;
  loading: boolean;
  generating: boolean;
  fetchCached: (conversationId: string) => Promise<void>;
  generate: (conversationId: string) => Promise<void>;
  clear: () => void;
}

export function useAISuggestions(): UseAISuggestionsReturn {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [source, setSource] = useState<SuggestionsSource>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchCached = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const result = await aiApi.getSuggestions(conversationId);
      const s = result.suggestions ?? [];
      setSuggestions(s);
      setSource(s.length > 0 ? "cache" : null);
      setGeneratedAt(s.length > 0 ? new Date() : null);
    } catch {
      setSuggestions([]);
      setSource(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const generate = useCallback(async (conversationId: string) => {
    setGenerating(true);
    try {
      const result = await aiApi.generateSuggestions(conversationId);
      const s = result.suggestions ?? [];
      setSuggestions(s);
      setSource(s.length > 0 ? "generated" : null);
      setGeneratedAt(s.length > 0 ? new Date() : null);
    } catch {
      setSuggestions([]);
      setSource(null);
    } finally {
      setGenerating(false);
    }
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setSource(null);
    setGeneratedAt(null);
  }, []);

  return { suggestions, source, generatedAt, loading, generating, fetchCached, generate, clear };
}
