"use client";

import { useState, useCallback, useEffect } from "react";
import { quickRepliesApi } from "@/lib/api/index";
import type { QuickReply } from "@/types/quickReply";

/**
 * Hook for chat input: searches quick replies as the user types "/..."
 * Returns matches and a function to pick one.
 */
export function useQuickReplySearch() {
  const [matches, setMatches] = useState<QuickReply[]>([]);
  const [open, setOpen] = useState(false);

  const search = useCallback(async (value: string) => {
    if (!value.startsWith("/") || value.length < 1) {
      setMatches([]);
      setOpen(false);
      return;
    }
    try {
      const results = await quickRepliesApi.searchQuickReplies(value);
      setMatches(results);
      setOpen(results.length > 0);
    } catch {
      setMatches([]);
      setOpen(false);
    }
  }, []);

  const close = useCallback(() => {
    setMatches([]);
    setOpen(false);
  }, []);

  return { matches, open, search, close };
}

/**
 * Hook for admin management: full CRUD with local state.
 */
export function useQuickRepliesAdmin() {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await quickRepliesApi.listQuickReplies();
      setQuickReplies(data);
    } catch {
      setError("Failed to load quick replies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (shortcut: string, content: string) => {
    const created = await quickRepliesApi.createQuickReply({ shortcut, content });
    setQuickReplies(prev => [...prev, created].sort((a, b) => a.shortcut.localeCompare(b.shortcut)));
    return created;
  }, []);

  const update = useCallback(async (id: string, data: { shortcut?: string; content?: string }) => {
    const updated = await quickRepliesApi.updateQuickReply(id, data);
    setQuickReplies(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await quickRepliesApi.deleteQuickReply(id);
    setQuickReplies(prev => prev.filter(r => r.id !== id));
  }, []);

  return { quickReplies, loading, error, load, create, update, remove };
}
