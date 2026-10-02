import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let memoryCache = [];

function resolveDataFilePath() {
  const projectDir = process.cwd();
  const localDir = path.resolve(projectDir, 'data');
  const localPath = path.join(localDir, 'attendance_logs.json');

  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return localPath;
  } catch {
    return path.join(os.tmpdir(), 'enigma_attendance_logs.json');
  }
}

export async function readLogs() {
  const filePath = resolveDataFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          memoryCache = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[storage] Error reading file, falling back to cache:', err.message);
  }
  return memoryCache;
}

export async function writeLogs(logs) {
  if (!Array.isArray(logs)) return;
  memoryCache = logs;
  const filePath = resolveDataFilePath();
  try {
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.warn('[storage] Error saving to disk, retained in memory cache:', err.message);
  }
}
