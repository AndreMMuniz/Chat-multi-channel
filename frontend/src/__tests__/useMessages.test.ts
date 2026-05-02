/**
 * Tests for useMessages hook — sequence ordering, deduplication, optimistic updates.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Message } from "@/types/chat";

// Pure helper functions extracted from useMessages logic for unit testing

function sortBySequence(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.conversation_sequence - b.conversation_sequence);
}

function appendDeduped(messages: Message[], newMsg: Message): Message[] {
  if (messages.some((m) => m.id === newMsg.id)) return messages;
  return sortBySequence([...messages, newMsg]);
}

function replaceTemp(messages: Message[], tempId: string, real: Message): Message[] {
  if (messages.some((m) => m.id === real.id)) {
    return messages.filter((m) => m.id !== tempId);
  }
  return sortBySequence(messages.map((m) => (m.id === tempId ? real : m)));
}

function makeMsg(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-1",
    conversation_id: "conv-1",
    content: "Hello",
    inbound: true,
    message_type: "text",
    conversation_sequence: 1,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("sortBySequence", () => {
  it("sorts messages by conversation_sequence ascending", () => {
    const msgs = [
      makeMsg({ id: "c", conversation_sequence: 3 }),
      makeMsg({ id: "a", conversation_sequence: 1 }),
      makeMsg({ id: "b", conversation_sequence: 2 }),
    ];
    const sorted = sortBySequence(msgs);
    expect(sorted.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("handles empty array", () => {
    expect(sortBySequence([])).toEqual([]);
  });

  it("does not mutate the original array", () => {
    const msgs = [makeMsg({ conversation_sequence: 2 }), makeMsg({ id: "b", conversation_sequence: 1 })];
    sortBySequence(msgs);
    expect(msgs[0].conversation_sequence).toBe(2);
  });
});

describe("appendDeduped", () => {
  it("appends new message in sequence order", () => {
    const existing = [makeMsg({ id: "a", conversation_sequence: 1 })];
    const newMsg = makeMsg({ id: "b", conversation_sequence: 2 });
    const result = appendDeduped(existing, newMsg);
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe("b");
  });

  it("ignores duplicate message by id", () => {
    const existing = [makeMsg({ id: "dup", conversation_sequence: 1 })];
    const dup = makeMsg({ id: "dup", conversation_sequence: 1 });
    const result = appendDeduped(existing, dup);
    expect(result).toHaveLength(1);
  });

  it("inserts in the middle by sequence", () => {
    const existing = [
      makeMsg({ id: "a", conversation_sequence: 1 }),
      makeMsg({ id: "c", conversation_sequence: 3 }),
    ];
    const mid = makeMsg({ id: "b", conversation_sequence: 2 });
    const result = appendDeduped(existing, mid);
    expect(result.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });
});

describe("replaceTemp", () => {
  it("replaces temp message with real message", () => {
    const temp = makeMsg({ id: "temp-123", conversation_sequence: 999 });
    const real = makeMsg({ id: "real-1", conversation_sequence: 5 });
    const result = replaceTemp([temp], "temp-123", real);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("real-1");
  });

  it("removes temp if real already present (WS delivered first)", () => {
    const temp = makeMsg({ id: "temp-123", conversation_sequence: 999 });
    const real = makeMsg({ id: "real-1", conversation_sequence: 5 });
    const result = replaceTemp([temp, real], "temp-123", real);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("real-1");
  });

  it("sorts result after replacement", () => {
    const temp = makeMsg({ id: "temp-999", conversation_sequence: 999 });
    const prev = makeMsg({ id: "prev", conversation_sequence: 1 });
    const real = makeMsg({ id: "real", conversation_sequence: 2 });
    const result = replaceTemp([prev, temp], "temp-999", real);
    expect(result.map((m) => m.id)).toEqual(["prev", "real"]);
  });
});
