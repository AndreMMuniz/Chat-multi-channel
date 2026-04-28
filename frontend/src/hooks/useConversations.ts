"use client";

import { useState, useCallback, useRef } from "react";
import { conversationsApi } from "@/lib/api/index";
import type { Conversation, Message } from "@/types/chat";

export interface UseConversationsReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationRef: React.RefObject<Conversation | null>;
  loading: boolean;
  fetchConversations: () => Promise<void>;
  selectConversation: (conv: Conversation) => Promise<void>;
  /** Called by WS handler when a new message arrives */
  onNewMessage: (msg: Message, refetchIfMissing: () => void) => void;
  /** Called by WS handler when a conversation is updated */
  onConversationUpdated: () => void;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  // Stable ref so WS closure always reads current active conversation
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

    if (conv.is_unread) {
      try {
        await conversationsApi.updateConversation(conv.id, { is_unread: false });
        setConversations(prev =>
          prev.map(c => (c.id === conv.id ? { ...c, is_unread: false } : c))
        );
      } catch {
        // non-critical, ignore
      }
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

  const onConversationUpdated = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    activeConversation,
    activeConversationRef,
    loading,
    fetchConversations,
    selectConversation,
    onNewMessage,
    onConversationUpdated,
  };
}
