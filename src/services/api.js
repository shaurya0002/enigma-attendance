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

function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.append(k, String(v));
    }
  });
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const checkSession = () => call('/api/session');
export const login = (username, password, adminKey) =>
  call('/api/login', { method: 'POST', body: JSON.stringify({ username, password, adminKey }) });
export const logout = () => call('/api/logout', { method: 'POST', body: '{}' });

// Attendance API
export const listLogs = (params = {}) => call(`/api/attendance${toQuery(params)}`);
export const listAttendanceCounts = (params = {}) =>
  call(`/api/attendance${toQuery({ ...params, type: 'counts' })}`);
export const addLog = (payload) =>
  call('/api/attendance', { method: 'POST', body: JSON.stringify(payload) });

// Students API (Credentials & Department Search Filtration)
export const listStudents = (params = {}) => call(`/api/students${toQuery(params)}`);
export const addStudent = (payload) =>
  call('/api/students', { method: 'POST', body: JSON.stringify(payload) });
