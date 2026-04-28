/**
 * Typed API client that auto-unwraps {data, meta} responses from the backend.
 * Import these helpers instead of raw apiFetch wherever possible.
 */

import { apiFetch } from './api';
import type { ApiResponse, ApiErrorResponse } from '@/types/api';

// Re-export for convenience
export type { ApiResponse, ApiMeta } from '@/types/api';

// Alias for backward compat
type ApiError = ApiErrorResponse;

// ── Core unwrap helpers ──────────────────────────────────────────────────────

/** Fetch and unwrap a single {data, meta} response. Throws on error. */
/** Fetch and unwrap a single {data, meta} response. Throws on error. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    const msg = (body as ApiError).error?.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

/** Fetch list + pagination metadata. */
export async function apiGetList<T>(path: string): Promise<ApiResponse<T[]>> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    const msg = (body as ApiError).error?.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
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
    const json = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    const msg = (json as ApiError).error?.message ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  const json = (await res.json()) as ApiResponse<TResult>;
  return json.data;
}
