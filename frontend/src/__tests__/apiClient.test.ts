/**
 * Tests for apiClient helpers — verify {data, meta} unwrapping.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock apiFetch so tests don't make real HTTP requests
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  getToken: vi.fn(() => "mock-token"),
}));

import { apiGet, apiGetList, apiMutate } from "@/lib/apiClient";
import { apiFetch } from "@/lib/api";

const mockFetch = vi.mocked(apiFetch);

function mockResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("apiGet", () => {
  beforeEach(() => vi.clearAllMocks());

  it("unwraps data from {data, meta} envelope", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ data: { id: "1", name: "Test" }, meta: { timestamp: "2026" } })
    );
    const result = await apiGet<{ id: string; name: string }>("/test");
    expect(result.id).toBe("1");
    expect(result.name).toBe("Test");
  });

  it("throws with error.message on HTTP error", async () => {
    mockFetch.mockReturnValue(
      mockResponse(
        { error: { code: "NOT_FOUND", message: "Resource not found", timestamp: "" } },
        false,
        404
      )
    );
    await expect(apiGet("/test")).rejects.toThrow("Resource not found");
  });

  it("throws with generic message if json() rejects", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("no body")),
      } as Response)
    );
    await expect(apiGet("/test")).rejects.toThrow("HTTP 500");
  });
});

describe("apiGetList", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns data array and meta", async () => {
    const mockData = [{ id: "1" }, { id: "2" }];
    const mockMeta = { total: 2, page: 1, page_size: 20, has_next: false };
    mockFetch.mockReturnValue(mockResponse({ data: mockData, meta: mockMeta }));

    const result = await apiGetList<{ id: string }>("/items");
    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.meta.has_next).toBe(false);
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ error: { message: "Forbidden" } }, false, 403)
    );
    await expect(apiGetList("/items")).rejects.toThrow("Forbidden");
  });
});

describe("apiMutate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends POST and unwraps response", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ data: { id: "new", name: "Created" }, meta: {} })
    );
    const result = await apiMutate<{ name: string }, { id: string; name: string }>(
      "/items",
      "POST",
      { name: "Created" }
    );
    expect(result.id).toBe("new");
  });

  it("sends PATCH request", async () => {
    mockFetch.mockReturnValue(mockResponse({ data: { id: "1" }, meta: {} }));
    await apiMutate("/items/1", "PATCH", { name: "Updated" });
    expect(mockFetch).toHaveBeenCalledWith(
      "/items/1",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("sends DELETE without body", async () => {
    mockFetch.mockReturnValue(mockResponse({ data: {}, meta: {} }));
    await apiMutate("/items/1", "DELETE");
    const call = mockFetch.mock.calls[0][1] as RequestInit;
    expect(call.method).toBe("DELETE");
  });

  it("throws on error response", async () => {
    mockFetch.mockReturnValue(
      mockResponse({ error: { message: "Conflict" } }, false, 409)
    );
    await expect(apiMutate("/items", "POST", {})).rejects.toThrow("Conflict");
  });
});
