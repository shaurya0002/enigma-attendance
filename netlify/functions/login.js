import {
  getConfig, verifyPassword, burnPasswordCheck, safeEqual, signSession, sessionCookie,
  isSafePost, readJson, json, lockedFor, recordFail, clearFails, SESSION_TTL_S,
} from '../lib/auth.js';
import { verifyCredentials } from '../../src/config/adminAccounts.js';

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

  // 1. Verify against central ADMIN_ACCOUNTS (department admins + master admins)
  let verified = verifyCredentials(username, password, adminKey);

  // 2. Legacy / env-fallback verification
  if (!verified && cfg.users?.has(username)) {
    const stored = cfg.users.get(username);
    const passOk = verifyPassword(password, stored);
    const keyOk = safeEqual(adminKey, cfg.adminKey);
    if (passOk && keyOk) {
      verified = {
        username,
        name: username,
        department: 'all',
        role: 'master_admin',
        departmentName: 'All Departments',
      };
    }
  }

  if (!verified) {
    burnPasswordCheck(password);
    recordFail(ipKey);
    if (username) recordFail(userKey);
    await sleep(400 + Math.random() * 200);
    return json({ error: 'Invalid credentials' }, 401);
  }

  clearFails(userKey);
  return json(
    {
      ok: true,
      username: verified.username,
      name: verified.name,
      department: verified.department,
      role: verified.role,
      departmentName: verified.departmentName,
    },
    200,
    {
      'Set-Cookie': sessionCookie(req, signSession(verified, cfg.secret), SESSION_TTL_S),
    }
  );
};

export const config = { path: '/api/login' };
