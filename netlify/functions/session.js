import { getConfig, getAdmin, json } from '../lib/auth.js';

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405, { Allow: 'GET' });
  const cfg = getConfig();
  if (!cfg) return json({ error: 'Server not configured' }, 500);
  const username = getAdmin(req, cfg);
  return username ? json({ authenticated: true, username }) : json({ authenticated: false }, 401);
};

export const config = { path: '/api/session' };
