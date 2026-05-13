"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { SequencedEvent } from "@/types/api";
import type { Conversation, Message } from "@/types/chat";

type MessagesSessionContextValue = {
  conversationsState: ReturnType<typeof useConversations>;
  messagesState: ReturnType<typeof useMessages>;
  connectionState: ReturnType<typeof useWebSocket>["connectionState"];
  activateConversation: (conversation: Conversation) => Promise<void>;
};

const MessagesSessionContext = createContext<MessagesSessionContextValue | null>(null);

export function MessagesSessionProvider({ children }: { children: ReactNode }) {
  const hydratedConversationIdRef = useRef<string | null>(null);
  const conversationsState = useConversations();
  const messagesState = useMessages(() => {});

  const {
    activeConversationRef,
    fetchConversations,
    selectConversation,
    onConversationNotification,
    onConversationUpdated,
    onNewMessage,
    onPresenceUpdate,
  } = conversationsState;

  const { appendMessage, fetchMessages } = messagesState;

  const handleWsEvent = useCallback((event: SequencedEvent) => {
    if (event.type === "new_message") {
      const message = event.data as unknown as Message;
      onNewMessage(message, fetchConversations);
      if (activeConversationRef.current?.id === message.conversation_id) {
        appendMessage(message);
      }
      return;
    }

    if (event.type === "conversation_notification") {
      onConversationNotification(event.conversation_id);
      return;
    }

    if (event.type === "presence_update") {
      const { conversation_id, viewers } = event.data as { conversation_id: string; viewers: string[] };
      onPresenceUpdate(conversation_id, viewers);
      return;
    }

    if (event.type === "message_deleted") {
      if (activeConversationRef.current?.id === event.conversation_id) {
        void fetchMessages(event.conversation_id);
      }
      void fetchConversations();
      return;
    }

    if (event.type === "conversation_updated") {
      onConversationUpdated();
    }
  }, [
    activeConversationRef,
    appendMessage,
    fetchConversations,
    fetchMessages,
    onConversationNotification,
    onConversationUpdated,
    onNewMessage,
    onPresenceUpdate,
  ]);

  const { connectionState, subscribe, unsubscribe } = useWebSocket(handleWsEvent);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const activeConversationId = conversationsState.activeConversation?.id;
    if (!activeConversationId) return;
    if (hydratedConversationIdRef.current === activeConversationId) return;

    hydratedConversationIdRef.current = activeConversationId;
    subscribe(activeConversationId);
    void fetchMessages(activeConversationId);
  }, [conversationsState.activeConversation?.id, fetchMessages, subscribe]);

  const activateConversation = useCallback(async (conversation: Conversation) => {
    if (activeConversationRef.current?.id && activeConversationRef.current.id !== conversation.id) {
      unsubscribe(activeConversationRef.current.id);
    }
    await selectConversation(conversation);
    subscribe(conversation.id);
    await fetchMessages(conversation.id);
  }, [activeConversationRef, fetchMessages, selectConversation, subscribe, unsubscribe]);

  const value = useMemo<MessagesSessionContextValue>(() => ({
    conversationsState,
    messagesState,
    connectionState,
    activateConversation,
  }), [activateConversation, connectionState, conversationsState, messagesState]);

  return (
    <MessagesSessionContext.Provider value={value}>
      {children}
    </MessagesSessionContext.Provider>
  );
}

export function useMessagesSessionContext() {
  const context = useContext(MessagesSessionContext);
  if (!context) {
    throw new Error("useMessagesSessionContext must be used inside <MessagesSessionProvider>");
  }
  return context;
}
