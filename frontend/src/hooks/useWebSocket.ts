"use client";

import { useEffect, useRef, useCallback } from "react";
import type { SequencedEvent } from "@/types/api";

export type { SequencedEvent };

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/chat/ws";

export type WsEventHandler = (event: SequencedEvent) => void;

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages a singleton WebSocket connection.
 *
 * Usage:
 *   const { subscribe, unsubscribe } = useWebSocket(handler);
 *
 * When a conversation is selected call `subscribe(conversationId)`.
 * The hook will automatically ack every sequenced event it receives.
 */
export function useWebSocket(onEvent: WsEventHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const subscribedRef = useRef<Set<string>>(new Set());

  // Keep ref in sync so the socket closure always calls the latest handler
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // ── Connect ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    function connect() {
      if (!alive) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        // Re-subscribe to all tracked conversations on reconnect
        subscribedRef.current.forEach((id) => {
          ws.send(JSON.stringify({ type: "subscribe", conversation_id: id }));
        });
      };

      ws.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data as string) as SequencedEvent;

          // Auto-acknowledge sequenced events
          if (event.requires_ack && event.conversation_id && event.sequence > 0) {
            ws.send(
              JSON.stringify({
                type: "ack",
                conversation_id: event.conversation_id,
                sequence: event.sequence,
              })
            );
          }

          onEventRef.current(event);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (alive) {
          // Reconnect after 3 s
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    // Keep-alive ping every 25 s (server timeout is 30 s)
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
  }, []); // connect once on mount

  // ── Public API ─────────────────────────────────────────────────────────────

  const subscribe = useCallback((conversationId: string) => {
    subscribedRef.current.add(conversationId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "subscribe", conversation_id: conversationId })
      );
    }
  }, []);

  const unsubscribe = useCallback((conversationId: string) => {
    subscribedRef.current.delete(conversationId);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "unsubscribe", conversation_id: conversationId })
      );
    }
  }, []);

  return { subscribe, unsubscribe };
}
