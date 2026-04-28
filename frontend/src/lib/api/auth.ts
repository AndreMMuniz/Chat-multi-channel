/** Auth API — login, logout, signup, password reset */

import { apiFetch, setAuth, clearAuth } from "@/lib/api";
import type { AuthPayload } from "@/types/auth";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function login(email: string, password: string): Promise<AuthPayload> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message ?? json?.detail ?? "Login failed");
  }
  const payload: AuthPayload = json?.data ?? json;
  if (!payload?.access_token) throw new Error("No token received");
  setAuth(payload.access_token, payload.refresh_token, payload.user);
  return payload;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
  clearAuth();
}

export async function signup(data: {
  email: string;
  password: string;
  full_name: string;
}): Promise<void> {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message ?? json?.detail ?? "Signup failed");
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message ?? json?.detail ?? "Failed to send reset email");
  }
}

export async function setPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/set-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ new_password: newPassword }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.error?.message ?? json?.detail ?? "Failed to set password");
  }
}
