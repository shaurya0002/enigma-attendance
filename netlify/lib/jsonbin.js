const BASE = 'https://api.jsonbin.io/v3/b';
const DEFAULT_JSONBIN_MASTER_KEY = '$2a$10$NpCFhlE4YOaHJWx4LjyZ7OxAtuD5uY5hoorWon0qD7kJWRG6AjMyK';
const DEFAULT_JSONBIN_BIN_ID = '6abd16e2ac6210605a05a03d';

const headers = () => ({ 'X-Master-Key': process.env.JSONBIN_MASTER_KEY || DEFAULT_JSONBIN_MASTER_KEY });
const url = () => `${BASE}/${process.env.JSONBIN_BIN_ID || DEFAULT_JSONBIN_BIN_ID}`;

export async function readLogs() {
  const r = await fetch(`${url()}/latest`, { headers: headers(), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`JSONBin GET ${r.status}`);
  const { record } = await r.json();
  if (Array.isArray(record)) return record;
  if (record && typeof record === 'object' && Array.isArray(record.rows)) return record.rows;
  if (record && typeof record === 'object' && record.id) return [record];
  return [];
}

export async function writeLogs(logs) {
  const r = await fetch(url(), {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(logs),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`JSONBin PUT ${r.status}`);
}
