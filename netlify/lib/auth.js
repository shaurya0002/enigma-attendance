import crypto from 'node:crypto';

export const COOKIE_NAME = 'enigma_session';
export const SESSION_TTL_S = 8 * 60 * 60; // 8 hours

/* ---------- config ---------- */
export function getConfig() {
  const env = process.env;
  const problems = [];

  const secret = env.SESSION_SECRET || '';
  if (secret.length < 32) problems.push('SESSION_SECRET (min 32 chars)');

  const adminKey = env.ADMIN_KEY || '';
  if (!/^[A-Za-z]{8}$/.test(adminKey)) problems.push('ADMIN_KEY (exactly 8 letters)');

  let users = null;
  try {
    const parsed = JSON.parse(env.ADMIN_USERS || '');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      users = new Map(
        Object.entries(parsed)
          .filter(([, v]) => typeof v === 'string' && v.length > 0)
          .map(([k, v]) => [k.trim().toLowerCase(), v])
      );
    }
  } catch { /* handled below */ }
  if (!users || users.size === 0) problems.push('ADMIN_USERS (JSON object of username -> password)');

  if (!env.JSONBIN_MASTER_KEY) problems.push('JSONBIN_MASTER_KEY');
  if (!env.JSONBIN_BIN_ID) problems.push('JSONBIN_BIN_ID');

  if (problems.length) {
    console.error('[config] Missing/invalid env vars:', problems.join(', '));
    return null;
  }
  return { secret, adminKey, users };
}

/* ---------- crypto helpers ---------- */
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
export const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

const DUMMY_HASH = `scrypt$${'00'.repeat(16)}$${'00'.repeat(64)}`;

/** stored = plaintext OR "scrypt$<saltHex>$<hashHex>" (see scripts/tools.mjs) */
export function verifyPassword(input, stored) {
  if (stored.startsWith('scrypt$')) {
    const [, saltHex, hashHex] = stored.split('$');
    const expected = Buffer.from(hashHex || '', 'hex');
    if (!saltHex || expected.length === 0) return false;
    const derived = crypto.scryptSync(String(input), Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(derived, expected);
  }
  return safeEqual(input, stored);
}
export const burnPasswordCheck = (input) => { verifyPassword(input, DUMMY_HASH); };

/* ---------- session token (HMAC-signed, HttpOnly cookie) ---------- */
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const hmac = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest();

export function signSession(username, secret) {
  const payload = b64u(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S }));
  return `${payload}.${b64u(hmac(payload, secret))}`;
}

function verifySession(token, secret) {
  if (typeof token !== 'string') return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = hmac(payload, secret);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const { u, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof u !== 'string' || typeof exp !== 'number' || exp < Date.now() / 1000) return null;
    return u;
  } catch { return null; }
}

function readCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

/** Returns the admin username if the request has a valid session for a still-existing admin. */
export function getAdmin(req, cfg) {
  const u = verifySession(readCookie(req, COOKIE_NAME), cfg.secret);
  return u && cfg.users.has(u) ? u : null;
}

export function sessionCookie(req, value, maxAge) {
  const secure = new URL(req.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

/* ---------- request guards ---------- */
/** CSRF defence for state-changing requests: same-origin + JSON only. */
export function isSafePost(req) {
  const origin = req.headers.get('origin');
  if (!origin || origin !== new URL(req.url).origin) return false;
  return (req.headers.get('content-type') || '').toLowerCase().startsWith('application/json');
}

export async function readJson(req, maxBytes = 4000) {
  const text = await req.text();
  if (text.length > maxBytes) return { tooLarge: true };
  try { return { data: JSON.parse(text) }; } catch { return { data: null }; }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

/* ---------- brute-force lockout (best-effort, per warm function instance) ---------- */
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map();

export function lockedFor(key) {
  const f = fails.get(key);
  if (!f) return 0;
  if (Date.now() - f.first > WINDOW_MS) { fails.delete(key); return 0; }
  return f.n >= MAX_FAILS ? Math.ceil((WINDOW_MS - (Date.now() - f.first)) / 1000) : 0;
}
export function recordFail(key) {
  if (fails.size > 5000) fails.clear();
  const f = fails.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) fails.set(key, { n: 1, first: Date.now() });
  else f.n++;
}
export const clearFails = (key) => fails.delete(key);
