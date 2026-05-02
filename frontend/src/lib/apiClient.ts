/**
 * Typed API client that auto-unwraps {data, meta} responses from the backend.
 * Import these helpers instead of raw apiFetch wherever possible.
 */

import { apiFetch } from './api';
import type { ApiResponse, ApiErrorResponse } from '@/types/api';

// Re-export for convenience
export type { ApiResponse, ApiMeta } from '@/types/api';

/** Extract message from FastAPI responses (handles both our envelope and HTTPException format) */
function extractMsg(body: unknown, status: number): string {
  if (!body || typeof body !== "object") return `HTTP ${status}`;
  const b = body as Record<string, unknown>;
  // Our format: {error: {message}}
  if (typeof (b.error as Record<string,unknown>)?.message === "string")
    return (b.error as Record<string,unknown>).message as string;
  // FastAPI HTTPException with dict: {detail: {error: {message}}}
  if (b.detail && typeof b.detail === "object") {
    const d = b.detail as Record<string, unknown>;
    if (typeof (d.error as Record<string,unknown>)?.message === "string")
      return (d.error as Record<string,unknown>).message as string;
  }
  // FastAPI HTTPException with string: {detail: "..."}
  if (typeof b.detail === "string") return b.detail;
  return `HTTP ${status}`;
}

// ── Core unwrap helpers ──────────────────────────────────────────────────────

/** Fetch and unwrap a single {data, meta} response. Throws on error. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(extractMsg(body, res.status));
  }
  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

/** Fetch list + pagination metadata. */
export async function apiGetList<T>(path: string): Promise<ApiResponse<T[]>> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(extractMsg(body, res.status));
  }
  return res.json() as Promise<ApiResponse<T[]>>;
}

/** POST / PATCH / DELETE that returns {data, meta}. */
export async function apiMutate<TBody, TResult>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  body?: TBody,
): Promise<TResult> {
  const res = await apiFetch(path, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(extractMsg(json, res.status));
  }
  const json = (await res.json()) as ApiResponse<TResult>;
  return json.data;
}
