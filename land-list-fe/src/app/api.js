const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

/** Wired from `index.js` to avoid circular imports with the auth slice. */
let dispatchClearSession = null;

export function configureApiAuthHandler(handler) {
  dispatchClearSession = handler;
}

function authHeader(getState) {
  const token = getState?.().auth?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path, { method = 'GET', query, body, getState, headers, skipAuth = false } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(skipAuth ? {} : authHeader(getState)),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (
      res.status === 401 &&
      !skipAuth &&
      getState?.()?.auth?.token
    ) {
      dispatchClearSession?.();
    }
    const message = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { API_BASE_URL };

