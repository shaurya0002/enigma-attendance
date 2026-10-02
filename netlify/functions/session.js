import { getConfig, getAdmin, json } from '../lib/auth.js';

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405, { Allow: 'GET' });
  const cfg = getConfig();
  if (!cfg) return json({ error: 'Server not configured' }, 500);
  const admin = getAdmin(req, cfg);
  if (!admin) return json({ authenticated: false }, 401);

  return json({
    authenticated: true,
    username: admin.username,
    name: admin.name,
    department: admin.department,
    role: admin.role,
    departmentName: admin.departmentName,
  });
};

export const config = { path: '/api/session' };
