const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('auth_user');
    return u ? (JSON.parse(u) as T) : null;
  } catch {
    return null;
  }
}

export function setAuth(user: object) {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('auth_user');
}

let _refreshing: Promise<boolean> | null = null;

async function _tryRefresh(): Promise<boolean> {
  if (_refreshing) return _refreshing;
  _refreshing = fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { _refreshing = null; });
  return _refreshing;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) || {}),
    },
  });

  if (res.status === 401) {
    const refreshed = await _tryRefresh();
    if (refreshed) {
      return fetch(`${BASE}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...((init.headers as Record<string, string>) || {}),
        },
      });
    }
    clearAuth();
    window.location.href = '/login';
  }

  return res;
}
