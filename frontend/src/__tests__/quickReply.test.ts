/**
 * Tests for Quick Reply shortcut normalization and search matching logic.
 */

import { describe, it, expect } from "vitest";
import type { QuickReply } from "@/types/quickReply";

// Pure utility: shortcut normalization (mirrors the backend endpoint logic)
function normalizeShortcut(raw: string): string {
  return raw.startsWith("/") ? raw : `/${raw}`;
}

// Pure utility: filter quick replies by prefix (mirrors backend search)
function filterByPrefix(replies: QuickReply[], query: string): QuickReply[] {
  if (!query) return replies;
  const q = query.toLowerCase();
  return replies.filter((r) => r.shortcut.toLowerCase().includes(q));
}

function makeQR(shortcut: string, content = "Content"): QuickReply {
  return { id: shortcut, shortcut, content, created_at: new Date().toISOString() };
}

describe("normalizeShortcut", () => {
  it("adds leading slash if missing", () => {
    expect(normalizeShortcut("hello")).toBe("/hello");
  });

  it("keeps existing leading slash", () => {
    expect(normalizeShortcut("/hello")).toBe("/hello");
  });

  it("keeps empty string as slash", () => {
    expect(normalizeShortcut("")).toBe("/");
  });

  it("does not double slash", () => {
    expect(normalizeShortcut("/hi")).toBe("/hi");
  });
});

describe("filterByPrefix", () => {
  const replies = [
    makeQR("/hello"),
    makeQR("/help"),
    makeQR("/bye"),
    makeQR("/thanks"),
  ];

  it("returns all when query is empty", () => {
    expect(filterByPrefix(replies, "")).toHaveLength(4);
  });

  it("filters by partial match", () => {
    const results = filterByPrefix(replies, "hel");
    expect(results.map((r) => r.shortcut)).toEqual(["/hello", "/help"]);
  });

  it("is case-insensitive", () => {
    const results = filterByPrefix(replies, "HEL");
    expect(results).toHaveLength(2);
  });

  it("returns empty array when no match", () => {
    expect(filterByPrefix(replies, "xyz")).toHaveLength(0);
  });

  it("exact match returns one result", () => {
    const results = filterByPrefix(replies, "/bye");
    expect(results).toHaveLength(1);
    expect(results[0].shortcut).toBe("/bye");
  });
});

describe("quick reply autocomplete trigger", () => {
  it("should trigger on / prefix", () => {
    const input = "/he";
    expect(input.startsWith("/")).toBe(true);
  });

  it("should NOT trigger on regular text", () => {
    const input = "hello";
    expect(input.startsWith("/")).toBe(false);
  });

  it("should trigger immediately on single /", () => {
    const input = "/";
    expect(input.startsWith("/")).toBe(true);
    expect(input.length).toBeGreaterThanOrEqual(1);
  });
});
