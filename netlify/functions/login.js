import {
  getConfig, verifyPassword, burnPasswordCheck, safeEqual, signSession, sessionCookie,
  isSafePost, readJson, json, lockedFor, recordFail, clearFails, SESSION_TTL_S,
} from '../lib/auth.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  if (!isSafePost(req)) return json({ error: 'Bad request' }, 400);

  const cfg = getConfig();
  if (!cfg) return json({ error: 'Server not configured' }, 500);

  const { data, tooLarge } = await readJson(req);
  if (tooLarge) return json({ error: 'Bad request' }, 413);

  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const username = typeof data?.username === 'string' ? data.username.trim().toLowerCase().slice(0, 64) : '';
  const password = typeof data?.password === 'string' ? data.password.slice(0, 200) : '';
  const adminKey = typeof data?.adminKey === 'string' ? data.adminKey.trim().slice(0, 32) : '';

  const ipKey = `ip:${ip}`;
  const userKey = `user:${username}`;
  const wait = Math.max(lockedFor(ipKey), lockedFor(userKey));
  if (wait) return json({ error: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': String(wait) });

  // Always run every check so timing doesn't reveal which factor was wrong.
  const stored = cfg.users.get(username);
  let passOk = false;
  if (stored) passOk = verifyPassword(password, stored);
  else burnPasswordCheck(password);
  const keyOk = safeEqual(adminKey, cfg.adminKey);

  if (!(stored && passOk && keyOk)) {
    recordFail(ipKey);
    if (username) recordFail(userKey);
    await sleep(500 + Math.random() * 300);
    return json({ error: 'Invalid credentials' }, 401);
  }

  clearFails(userKey);
  return json({ ok: true, username }, 200, {
    'Set-Cookie': sessionCookie(req, signSession(username, cfg.secret), SESSION_TTL_S),
  });
};

export const config = { path: '/api/login' };
