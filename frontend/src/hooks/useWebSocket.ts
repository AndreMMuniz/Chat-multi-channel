"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getStoredUser } from "@/lib/api";
import type { SequencedEvent } from "@/types/api";
import type { StoredUser } from "@/types/auth";

export type { SequencedEvent };

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/chat/ws";

export type WsEventHandler = (event: SequencedEvent) => void;

/**
 * Manages a singleton WebSocket connection.
 * - Sends `identify` once on connect so the server knows the operator's name.
 * - Automatically re-subscribes to all tracked conversations on reconnect.
 * - Exposes `connectionState` for UI banners.
 * - Auto-acks every sequenced event.
 */
export function useWebSocket(onEvent: WsEventHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const subscribedRef = useRef<Set<string>>(new Set());
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;
    let attempt = 0;

    function connect() {
      if (!alive) return;
      setConnectionState(attempt === 0 ? "connecting" : "reconnecting");

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        setConnectionState("connected");

        // Identify the operator
        const user = getStoredUser<StoredUser>();
        if (user) {
          ws.send(JSON.stringify({
            type: "identify",
            user_id: user.id,
            display_name: user.full_name,
          }));
        }

        // Re-subscribe to all tracked conversations
        subscribedRef.current.forEach((id) => {
          ws.send(JSON.stringify({ type: "subscribe", conversation_id: id }));
        });
      };

      ws.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data as string) as SequencedEvent;

          // Auto-ack sequenced events
          if (event.requires_ack && event.conversation_id && event.sequence > 0) {
            ws.send(JSON.stringify({
              type: "ack",
              conversation_id: event.conversation_id,
              sequence: event.sequence,
            }));
          }

          onEventRef.current(event);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (alive) {
          attempt++;
          setConnectionState("reconnecting");
          // Exponential backoff: 3s, 6s, 12s, max 30s
          const delay = Math.min(3000 * Math.pow(1.5, attempt - 1), 30_000);
          reconnectTimer = setTimeout(connect, delay);
        } else {
          setConnectionState("disconnected");
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    // Keep-alive ping every 25s
    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25_000);

    return () => {
      alive = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(ping);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  const subscribe = useCallback((conversationId: string) => {
    subscribedRef.current.add(conversationId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "subscribe", conversation_id: conversationId }));
    }
  }, []);

  const unsubscribe = useCallback((conversationId: string) => {
    subscribedRef.current.delete(conversationId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "unsubscribe", conversation_id: conversationId }));
    }
  }, []);

  return { subscribe, unsubscribe, connectionState };
}
