"use client";

import { useState, useCallback, useRef } from "react";
import { conversationsApi } from "@/lib/api/index";
import type { Conversation, Message, UpdateConversationRequest } from "@/types/chat";

export interface UseConversationsReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationRef: React.RefObject<Conversation | null>;
  loading: boolean;
  /** Unread notification count per conversation_id (for non-active conversations) */
  notifCounts: Record<string, number>;
  /** Current viewers (display names) of the active conversation */
  activeViewers: string[];
  fetchConversations: () => Promise<void>;
  selectConversation: (conv: Conversation) => Promise<void>;
  updateConversation: (id: string, data: UpdateConversationRequest) => Promise<void>;
  /** Called by WS handler when a new message arrives (full message for subscribers) */
  onNewMessage: (msg: Message, refetchIfMissing: () => void) => void;
  /** Called by WS handler for lightweight notifications (non-subscriber clients) */
  onConversationNotification: (conversationId: string) => void;
  /** Called by WS handler when presence changes */
  onPresenceUpdate: (conversationId: string, viewers: string[]) => void;
  /** Called by WS handler when conversation list needs refresh */
  onConversationUpdated: () => void;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifCounts, setNotifCounts] = useState<Record<string, number>>({});
  const [activeViewers, setActiveViewers] = useState<string[]>([]);

  const activeConversationRef = useRef<Conversation | null>(null);

  const setActive = (conv: Conversation | null) => {
    activeConversationRef.current = conv;
    setActiveConversation(conv);
  };

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await conversationsApi.getConversations();
      setConversations(data);
    } catch (err) {
      console.error("fetchConversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectConversation = useCallback(async (conv: Conversation) => {
    setActive(conv);
    // Clear notification badge for this conversation
    setNotifCounts(prev => {
      if (!prev[conv.id]) return prev;
      const next = { ...prev };
      delete next[conv.id];
      return next;
    });
    // Clear viewers (will be populated by presence_update from server)
    setActiveViewers([]);

    if (conv.is_unread) {
      try {
        await conversationsApi.updateConversation(conv.id, { is_unread: false });
        setConversations(prev =>
          prev.map(c => (c.id === conv.id ? { ...c, is_unread: false } : c))
        );
      } catch {
        // non-critical
      }
    }
  }, []);

  const updateConversation = useCallback(async (id: string, data: UpdateConversationRequest) => {
    try {
      const updatedConversation = await conversationsApi.updateConversation(id, data);
      setConversations(prev =>
        prev.map(c => (c.id === id ? { ...c, ...updatedConversation } : c))
      );
      if (activeConversationRef.current?.id === id) {
        setActive({ ...activeConversationRef.current, ...updatedConversation });
      }
    } catch (err) {
      console.error("updateConversation:", err);
    }
  }, []);

  const onNewMessage = useCallback(
    (msg: Message, refetchIfMissing: () => void) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversation_id);
        if (idx === -1) {
          refetchIfMissing();
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          last_message: msg.content,
          last_message_date: msg.created_at,
          is_unread: msg.inbound,
        };
        const [conv] = updated.splice(idx, 1);
        return [conv, ...updated];
      });
    },
    []
  );

  const onConversationNotification = useCallback((conversationId: string) => {
    // Only increment if this is NOT the currently active conversation
    if (activeConversationRef.current?.id === conversationId) return;
    setNotifCounts(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] ?? 0) + 1,
    }));
    // Also bump it to top of the list
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === conversationId);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const [conv] = updated.splice(idx, 1);
      return [conv, ...updated];
    });
  }, []);

  const onPresenceUpdate = useCallback((conversationId: string, viewers: string[]) => {
    if (activeConversationRef.current?.id === conversationId) {
      setActiveViewers(viewers);
    }
  }, []);

  const onConversationUpdated = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    activeConversation,
    activeConversationRef,
    loading,
    notifCounts,
    activeViewers,
    fetchConversations,
    selectConversation,
    updateConversation,
    onNewMessage,
    onConversationNotification,
    onPresenceUpdate,
    onConversationUpdated,
  };
}
