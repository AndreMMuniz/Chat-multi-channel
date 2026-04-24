const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('auth_token');
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
  // access_token in sessionStorage (cleared on tab close, not accessible cross-tab)
  sessionStorage.setItem('auth_token', accessToken);
  // refresh_token only stored if needed for manual refresh; HttpOnly cookie is the primary mechanism
  sessionStorage.setItem('auth_refresh_token', refreshToken);
  // user info in localStorage for UI display only (no sensitive data)
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function clearAuth() {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('auth_user');
}

let _refreshing: Promise<boolean> | null = null;

async function _tryRefresh(): Promise<boolean> {
  if (_refreshing) return _refreshing;
  _refreshing = fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (r) => {
      if (!r.ok) return false;
      const data = await r.json().catch(() => null);
      if (data?.access_token) {
        sessionStorage.setItem('auth_token', data.access_token);
      }
      return r.ok;
    })
    .catch(() => false)
    .finally(() => { _refreshing = null; });
  return _refreshing;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init.headers as Record<string, string>) || {}),
    },
  });

  if (res.status === 401) {
    const refreshed = await _tryRefresh();
    if (refreshed) {
      const newToken = getToken();
      return fetch(`${BASE}${path}`, {
        ...init,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...((init.headers as Record<string, string>) || {}),
        },
      });
    }
    clearAuth();
    window.location.href = '/login';
  }

  return res;
}
