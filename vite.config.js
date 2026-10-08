import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { verifyCredentials } from './src/config/adminAccounts.js';
import { EVENT_TEAMS } from './src/config/teams.js';
import {
  checkMongoConnection,
  getAttendanceLogs,
  getAttendanceCounts,
  logAttendance,
  getStudents,
  saveStudent
} from './netlify/lib/mongodb.js';

// Preload environment variables into process.env so MongoDB client can access MONGODB_URI
const devEnv = loadEnv('development', process.cwd(), '');
if (devEnv.MONGODB_URI) process.env.MONGODB_URI = devEnv.MONGODB_URI;
if (devEnv.MONGODB_DB_NAME) process.env.MONGODB_DB_NAME = devEnv.MONGODB_DB_NAME;

function localDevApiPlugin() {
  let currentDevSession = null;

  return {
    name: 'local-dev-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');

        // Local Dev Mock: /api/session
        if (url.pathname === '/api/session') {
          res.setHeader('Content-Type', 'application/json');
          if (currentDevSession) {
            res.end(JSON.stringify({ authenticated: true, ...currentDevSession }));
          } else {
            res.statusCode = 401;
            res.end(JSON.stringify({ authenticated: false }));
          }
          return;
        }

        // Local Dev Mock: /api/login
        if (url.pathname === '/api/login' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const username = String(data.username || '').trim().toLowerCase();
              const password = String(data.password || '');
              const adminKey = String(data.adminKey || '').trim();

              const verified = verifyCredentials(username, password, adminKey);
              if (verified) {
                currentDevSession = verified;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true, ...verified }));
                return;
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 401;
              res.end(JSON.stringify({ error: 'Invalid credentials' }));
              return;
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: e.message }));
              return;
            }
          });
          return;
        }

        // Local Dev Mock: /api/logout
        if (url.pathname === '/api/logout' && req.method === 'POST') {
          currentDevSession = null;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // Local Dev API: /api/students
        if (url.pathname === '/api/students') {
          const dataPath = path.resolve('data', 'students.json');

          if (req.method === 'GET') {
            try {
              let dept = url.searchParams.get('department') || 'all';
              if (currentDevSession?.department && currentDevSession.department !== 'all') {
                dept = currentDevSession.department;
              }
              const search = (url.searchParams.get('search') || '').toLowerCase().trim();

              const mongoStatus = await checkMongoConnection();
              if (mongoStatus.connected) {
                const students = await getStudents({ department: dept !== 'all' ? dept : '', search });
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ students, source: 'mongodb' }));
                return;
              }

              let students = [];
              if (fs.existsSync(dataPath)) {
                students = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
              }
              const filtered = students.filter((s) => {
                if (dept !== 'all' && s.department !== dept) return false;
                if (search) {
                  const name = (s.name || '').toLowerCase();
                  const roll = (s.rollNumber || '').toLowerCase();
                  const contact = (s.contact || '').toLowerCase();
                  if (!name.includes(search) && !roll.includes(search) && !contact.includes(search)) return false;
                }
                return true;
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ students: filtered, source: 'vite_dev_server' }));
              return;
            } catch (e) {
              console.error('[vite dev api] Error in /api/students GET:', e);
            }
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                let cleanDept = String(data.department || '').trim().toLowerCase();
                if (currentDevSession?.department && currentDevSession.department !== 'all') {
                  cleanDept = currentDevSession.department;
                }
                const cleanRoll = String(data.rollNumber || '').trim().toUpperCase();
                const loggedBy = currentDevSession?.username || 'dev_admin';

                const newStudent = {
                  id: `STU_${Date.now()}`,
                  name: String(data.name || '').trim(),
                  rollNumber: cleanRoll,
                  contact: String(data.contact || '').trim(),
                  year: data.year || '2nd Year',
                  classBatch: String(data.classBatch || 'General').trim().toUpperCase(),
                  department: cleanDept,
                  createdAt: new Date().toISOString(),
                };

                const mongoStatus = await checkMongoConnection();
                if (mongoStatus.connected) {
                  try {
                    await saveStudent({
                      name: newStudent.name,
                      rollNumber: cleanRoll,
                      contact: newStudent.contact,
                      year: newStudent.year,
                      classBatch: newStudent.classBatch,
                      department: cleanDept,
                      addedBy: loggedBy,
                    });
                  } catch (mErr) {
                    console.warn('[vite dev api] Mongo student write warning:', mErr.message);
                  }
                }

                let students = [];
                if (fs.existsSync(dataPath)) {
                  students = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                }
                students = [newStudent, ...students.filter((s) => !(s.rollNumber === cleanRoll && s.department === cleanDept))];
                fs.writeFileSync(dataPath, JSON.stringify(students, null, 2), 'utf8');
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 201;
                res.end(JSON.stringify({ student: newStudent, message: 'Student registered in department' }));
                return;
              } catch (e) {
                console.error('[vite dev api] Error in /api/students POST:', e);
                res.statusCode = 400;
                res.end(JSON.stringify({ error: e.message }));
                return;
              }
            });
            return;
          }
        }

        // Local Dev API: /api/attendance
        if (url.pathname === '/api/attendance') {
          const logsPath = path.resolve('data', 'attendance_logs.json');
          const studentsPath = path.resolve('data', 'students.json');

          if (req.method === 'GET') {
            try {
              let dept = url.searchParams.get('department') || 'all';
              if (currentDevSession?.department && currentDevSession.department !== 'all') {
                dept = currentDevSession.department;
              }
              const search = (url.searchParams.get('search') || '').toLowerCase().trim();
              const type = url.searchParams.get('type') || 'logs';

              const mongoStatus = await checkMongoConnection();
              if (mongoStatus.connected) {
                if (type === 'counts') {
                  const counts = await getAttendanceCounts({ department: dept !== 'all' ? dept : '', search });
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ counts, source: 'mongodb' }));
                  return;
                }
                const logs = await getAttendanceLogs({ department: dept !== 'all' ? dept : '', search });
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ logs, source: 'mongodb' }));
                return;
              }

              let logs = [];
              if (fs.existsSync(logsPath)) {
                const raw = fs.readFileSync(logsPath, 'utf8');
                if (raw.trim()) logs = JSON.parse(raw);
              }

              const filtered = logs.filter((l) => {
                if (dept !== 'all' && l.dutyDepartment?.id !== dept) return false;
                if (search) {
                  const name = (l.studentDetails?.name || '').toLowerCase();
                  const roll = (l.studentDetails?.rollNumber || '').toLowerCase();
                  const contact = (l.studentDetails?.contact || '').toLowerCase();
                  if (!name.includes(search) && !roll.includes(search) && !contact.includes(search)) return false;
                }
                return true;
              });

              if (type === 'counts') {
                const map = new Map();
                filtered.forEach((log) => {
                  const roll = log.studentDetails?.rollNumber;
                  if (!roll) return;
                  if (!map.has(roll)) {
                    map.set(roll, {
                      rollNumber: roll,
                      name: log.studentDetails?.name,
                      contact: log.studentDetails?.contact || '',
                      department: log.dutyDepartment?.id,
                      year: log.studentDetails?.year,
                      classBatch: log.studentDetails?.classBatch,
                      dutyDates: [],
                      totalLecturesSkipped: 0,
                    });
                  }
                  const item = map.get(roll);
                  if (log.attendanceLog?.date && !item.dutyDates.includes(log.attendanceLog.date)) {
                    item.dutyDates.push(log.attendanceLog.date);
                  }
                  item.totalLecturesSkipped += (log.attendanceLog?.totalLecturesSkipped || 0);
                });

                const counts = Array.from(map.values()).map((c) => ({
                  ...c,
                  totalDaysAttended: c.dutyDates.length,
                }));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ counts, source: 'vite_dev_server' }));
                return;
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ logs: filtered, source: 'vite_dev_server' }));
              return;
            } catch (e) {
              console.error('[vite dev api] Error in /api/attendance GET:', e);
            }
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const cleanRoll = String(data.rollNumber || '').trim().toUpperCase();
                const cleanDept = String(data.teamId || '').trim().toLowerCase();
                const loggedBy = currentDevSession?.username || 'dev_admin';

                const entry = {
                  id: `LOG_${Date.now()}`,
                  event: 'ENIGMA 2026',
                  submittedAt: new Date().toISOString(),
                  loggedBy,
                  studentDetails: {
                    name: String(data.name || '').trim(),
                    rollNumber: cleanRoll,
                    contact: String(data.contact || '').trim(),
                    year: data.year || '2nd Year',
                    classBatch: String(data.classBatch || 'General').trim().toUpperCase(),
                  },
                  dutyDepartment: {
                    id: cleanDept,
                    name: (EVENT_TEAMS.find((t) => t.id === cleanDept)?.name) || cleanDept,
                    badge: (EVENT_TEAMS.find((t) => t.id === cleanDept)?.badge) || 'Duty',
                  },
                  attendanceLog: {
                    date: data.date,
                    totalLecturesSkipped: (data.lectures?.length || 0) + (data.extraAttendance || 0),
                    extraAttendance: data.extraAttendance || 0,
                    skippedLectureNumbers: data.lectures || [],
                    remarks: data.remarks || '',
                  },
                };

                const mongoStatus = await checkMongoConnection();
                if (mongoStatus.connected) {
                  try {
                    await saveStudent({
                      name: entry.studentDetails.name,
                      rollNumber: cleanRoll,
                      contact: entry.studentDetails.contact,
                      year: entry.studentDetails.year,
                      classBatch: entry.studentDetails.classBatch,
                      department: cleanDept,
                      addedBy: loggedBy,
                    });
                    await logAttendance({
                      studentDetails: entry.studentDetails,
                      dutyDepartment: entry.dutyDepartment,
                      attendanceLog: entry.attendanceLog,
                      loggedBy,
                    });
                  } catch (mErr) {
                    console.warn('[vite dev api] Live Mongo write error:', mErr.message);
                  }
                }

                // Also update local file cache
                let logs = [];
                if (fs.existsSync(logsPath)) {
                  const raw = fs.readFileSync(logsPath, 'utf8');
                  if (raw.trim()) logs = JSON.parse(raw);
                }
                logs.unshift(entry);
                fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), 'utf8');

                // Auto-upsert student into students.json if not present
                if (data.name && data.rollNumber && data.teamId) {
                  try {
                    let students = [];
                    if (fs.existsSync(studentsPath)) {
                      students = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
                    }
                    const exists = students.some((s) => s.rollNumber === cleanRoll && s.department === cleanDept);
                    if (!exists) {
                      students.unshift({
                        id: `STU_${Date.now()}`,
                        name: entry.studentDetails.name,
                        rollNumber: cleanRoll,
                        contact: entry.studentDetails.contact,
                        year: entry.studentDetails.year,
                        classBatch: entry.studentDetails.classBatch,
                        department: cleanDept,
                        createdAt: new Date().toISOString(),
                      });
                      fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2), 'utf8');
                    }
                  } catch (e) {
                    console.error('[vite dev api] Student auto-upsert error:', e);
                  }
                }

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 201;
                res.end(JSON.stringify({ entry, storedInMongo: mongoStatus.connected }));
                return;
              } catch (e) {
                console.error('[vite dev api] Error in /api/attendance POST:', e);
                res.statusCode = 400;
                res.end(JSON.stringify({ error: e.message }));
                return;
              }
            });
            return;
          }
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localDevApiPlugin()],
});
