import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function localDevApiPlugin() {
  return {
    name: 'local-dev-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');

        // Local Dev Mock: /api/session
        if (url.pathname === '/api/session') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ username: 'dev_admin' }));
          return;
        }

        // Local Dev Mock: /api/students
        if (url.pathname === '/api/students') {
          const dataPath = path.resolve('data', 'students.json');

          if (req.method === 'GET') {
            try {
              let students = [];
              if (fs.existsSync(dataPath)) {
                students = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
              }
              const dept = url.searchParams.get('department') || 'all';
              const search = (url.searchParams.get('search') || '').toLowerCase().trim();
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
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                let students = [];
                if (fs.existsSync(dataPath)) {
                  students = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                }
                const cleanRoll = String(data.rollNumber || '').trim().toUpperCase();
                const cleanDept = String(data.department || '').trim().toLowerCase();
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

        // Local Dev Mock: /api/attendance
        if (url.pathname === '/api/attendance') {
          const logsPath = path.resolve('data', 'attendance_logs.json');
          const studentsPath = path.resolve('data', 'students.json');

          if (req.method === 'GET') {
            try {
              let logs = [];
              if (fs.existsSync(logsPath)) {
                const raw = fs.readFileSync(logsPath, 'utf8');
                if (raw.trim()) logs = JSON.parse(raw);
              }
              const type = url.searchParams.get('type') || 'logs';
              const dept = url.searchParams.get('department') || 'all';
              const search = (url.searchParams.get('search') || '').toLowerCase().trim();

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
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                let logs = [];
                if (fs.existsSync(logsPath)) {
                  const raw = fs.readFileSync(logsPath, 'utf8');
                  if (raw.trim()) logs = JSON.parse(raw);
                }

                // Auto-upsert student into students.json if not present
                if (data.name && data.rollNumber && data.teamId) {
                  try {
                    let students = [];
                    if (fs.existsSync(studentsPath)) {
                      students = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
                    }
                    const cleanRoll = String(data.rollNumber).trim().toUpperCase();
                    const cleanDept = String(data.teamId).trim().toLowerCase();
                    const exists = students.some((s) => s.rollNumber === cleanRoll && s.department === cleanDept);
                    if (!exists) {
                      students.unshift({
                        id: `STU_${Date.now()}`,
                        name: String(data.name).trim(),
                        rollNumber: cleanRoll,
                        contact: String(data.contact || '').trim(),
                        year: data.year || '2nd Year',
                        classBatch: String(data.classBatch || 'General').trim().toUpperCase(),
                        department: cleanDept,
                        createdAt: new Date().toISOString(),
                      });
                      fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2), 'utf8');
                    }
                  } catch (e) {
                    console.error('[vite dev api] Student auto-upsert error:', e);
                  }
                }

                const entry = {
                  id: `LOG_${Date.now()}`,
                  event: 'ENIGMA 2026',
                  submittedAt: new Date().toISOString(),
                  loggedBy: 'dev_admin',
                  studentDetails: {
                    name: data.name,
                    rollNumber: data.rollNumber,
                    contact: data.contact,
                    year: data.year,
                    classBatch: data.classBatch || 'General',
                  },
                  dutyDepartment: {
                    id: data.teamId,
                    name: data.teamId,
                    badge: 'Duty',
                  },
                  attendanceLog: {
                    date: data.date,
                    totalLecturesSkipped: (data.lectures?.length || 0) + (data.extraAttendance || 0),
                    extraAttendance: data.extraAttendance || 0,
                    skippedLectureNumbers: data.lectures || [],
                    remarks: data.remarks || '',
                  },
                };
                logs.unshift(entry);
                fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2), 'utf8');
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 201;
                res.end(JSON.stringify({ entry }));
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
