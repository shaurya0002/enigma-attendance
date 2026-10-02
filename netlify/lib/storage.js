import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

let memoryLogsCache = [];
let memoryStudentsCache = null;

function resolveFilePath(fileName) {
  const projectDir = process.cwd();
  const localDir = path.resolve(projectDir, 'data');
  const localPath = path.join(localDir, fileName);

  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return localPath;
  } catch {
    return path.join(os.tmpdir(), `enigma_${fileName}`);
  }
}

export async function readLogs() {
  const filePath = resolveFilePath('attendance_logs.json');
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          memoryLogsCache = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[storage] Error reading logs, falling back to cache:', err.message);
  }
  return memoryLogsCache;
}

export async function writeLogs(logs) {
  if (!Array.isArray(logs)) return;
  memoryLogsCache = logs;
  const filePath = resolveFilePath('attendance_logs.json');
  try {
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.warn('[storage] Error saving logs to disk, retained in memory cache:', err.message);
  }
}

export async function readStudents() {
  if (memoryStudentsCache && Array.isArray(memoryStudentsCache)) {
    return memoryStudentsCache;
  }
  const filePath = resolveFilePath('students.json');
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          memoryStudentsCache = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[storage] Error reading students file:', err.message);
  }
  return memoryStudentsCache || [];
}

export async function writeStudents(students) {
  if (!Array.isArray(students)) return;
  memoryStudentsCache = students;
  const filePath = resolveFilePath('students.json');
  try {
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(students, null, 2), 'utf8');
  } catch (err) {
    console.warn('[storage] Error writing students to disk:', err.message);
  }
}

export async function searchLocalStudents({ department, search, year }) {
  const students = await readStudents();
  return students.filter((s) => {
    if (department && department !== 'all' && s.department !== department) {
      return false;
    }
    if (year && year !== 'all' && s.year !== year) {
      return false;
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const name = (s.name || '').toLowerCase();
      const roll = (s.rollNumber || '').toLowerCase();
      const contact = (s.contact || '').toLowerCase();
      if (!name.includes(q) && !roll.includes(q) && !contact.includes(q)) {
        return false;
      }
    }
    return true;
  });
}
