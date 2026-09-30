import { isSafePost, sessionCookie, json } from '../lib/auth.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  if (!isSafePost(req)) return json({ error: 'Bad request' }, 400);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(req, '', 0) });
};

export const config = { path: '/api/logout' };
