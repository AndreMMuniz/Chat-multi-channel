const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('auth_user');
    return u ? (JSON.parse(u) as T) : null;
  } catch {
    return null;
  }
}

export function setAuth(accessToken: string, refreshToken: string, user: object) {
  localStorage.setItem('auth_token', accessToken);
  localStorage.setItem('auth_refresh_token', refreshToken);
  localStorage.setItem('auth_user', JSON.stringify(user));
  const expires = new Date(Date.now() + 3600 * 1000).toUTCString();
  document.cookie = `auth_token=${accessToken}; path=/; samesite=lax; expires=${expires}`;
}

export function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('auth_user');
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init.headers as Record<string, string>) || {}),
    },
  });
  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
  }
  return res;
}
