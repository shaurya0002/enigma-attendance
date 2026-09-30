async function call(path, options = {}) {
  try {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Network error' } };
  }
}

export const checkSession = () => call('/api/session');
export const login = (username, password, adminKey) =>
  call('/api/login', { method: 'POST', body: JSON.stringify({ username, password, adminKey }) });
export const logout = () => call('/api/logout', { method: 'POST', body: '{}' });
export const listLogs = () => call('/api/attendance');
export const addLog = (payload) =>
  call('/api/attendance', { method: 'POST', body: JSON.stringify(payload) });
