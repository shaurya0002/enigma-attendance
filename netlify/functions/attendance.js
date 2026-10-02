/* eslint-disable no-control-regex */
import crypto from 'node:crypto';
import { getConfig, getAdmin, isSafePost, readJson, json } from '../lib/auth.js';
import { readLogs, writeLogs } from '../lib/storage.js';
import {
  checkMongoConnection,
  logAttendance,
  getAttendanceLogs,
  getAttendanceCounts,
  saveStudent,
} from '../lib/mongodb.js';
import { EVENT_TEAMS, ACADEMIC_YEARS, STANDARD_LECTURES } from '../../src/config/teams.js';

const clean = (v, max) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';

/** Rebuilds the entry from validated fields only — never trusts client-supplied shape/ids/timestamps. */
function buildEntry(input, admin) {
  const name = clean(input?.name, 80);
  const rollNumber = clean(input?.rollNumber, 30).toUpperCase();
  const classBatch = clean(input?.classBatch, 20).toUpperCase();
  const remarks = clean(input?.remarks, 200);
  const date = clean(input?.date, 10);
  const team = EVENT_TEAMS.find((t) => t.id === input?.teamId);
  const validLectureIds = STANDARD_LECTURES.map((l) => l.id);
  const lectures = Array.isArray(input?.lectures) ? [...new Set(input.lectures)] : [];

  if (!name) return { error: 'Student name is required' };
  if (!rollNumber) return { error: 'Roll number is required' };
  if (!classBatch) return { error: 'Class / batch is required' };
  if (!ACADEMIC_YEARS.includes(input?.year)) return { error: 'Invalid academic year' };
  if (!team) return { error: 'Invalid team' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Invalid date' };
  if (!lectures.length || !lectures.every((n) => validLectureIds.includes(n))) return { error: 'Invalid lectures' };
  lectures.sort((a, b) => a - b);

  return {
    entry: {
      id: `LOG_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      event: 'ENIGMA 2026',
      submittedAt: new Date().toISOString(),
      loggedBy: admin,
      studentDetails: { name, rollNumber, year: input.year, classBatch },
      dutyDepartment: { id: team.id, name: team.name, badge: team.badge },
      attendanceLog: {
        date,
        totalLecturesSkipped: lectures.length,
        skippedLectureNumbers: lectures,
        skippedLecturesDetail: lectures.map((id) => ({
          lectureNumber: id,
          timeSlot: STANDARD_LECTURES.find((l) => l.id === id).time,
        })),
        remarks: remarks || 'Logged during ENIGMA 2026 event duties',
      },
    },
  };
}

export default async (req) => {
  const cfg = getConfig();
  if (!cfg) return json({ error: 'Server not configured' }, 500);

  const admin = getAdmin(req, cfg);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(req.url, 'http://localhost');
  const searchParams = url.searchParams;

  try {
    // -------------------------------------------------------------
    // GET /api/attendance: Filter logs or cumulative counts by department
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const department = searchParams.get('department') || 'all';
      const search = searchParams.get('search') || '';
      const type = searchParams.get('type') || 'logs'; // 'logs' or 'counts'
      const date = searchParams.get('date') || '';

      const mongoStatus = await checkMongoConnection();

      if (mongoStatus.connected) {
        if (type === 'counts') {
          const counts = await getAttendanceCounts({ department, search });
          return json({ counts, source: 'mongodb' });
        }

        const logs = await getAttendanceLogs({ department, search, date });
        return json({ logs, source: 'mongodb' });
      }

      // Offline / Local File Storage Fallback
      const allLogs = await readLogs();
      const filtered = allLogs.filter((log) => {
        if (department !== 'all' && log.dutyDepartment?.id !== department) return false;
        if (date && log.attendanceLog?.date !== date) return false;
        if (search) {
          const s = search.toLowerCase();
          const name = log.studentDetails?.name?.toLowerCase() || '';
          const roll = log.studentDetails?.rollNumber?.toLowerCase() || '';
          const cls = log.studentDetails?.classBatch?.toLowerCase() || '';
          if (!name.includes(s) && !roll.includes(s) && !cls.includes(s)) return false;
        }
        return true;
      });

      return json({ logs: filtered, source: 'local_storage', warning: 'MongoDB not connected' });
    }

    // -------------------------------------------------------------
    // POST /api/attendance: Log attendance and update total days count
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      if (!isSafePost(req)) return json({ error: 'Bad request' }, 400);
      const { data, tooLarge } = await readJson(req, 8000);
      if (tooLarge) return json({ error: 'Payload too large' }, 413);

      const { entry, error } = buildEntry(data, admin);
      if (error) return json({ error }, 400);

      const mongoStatus = await checkMongoConnection();

      if (mongoStatus.connected) {
        // 1. Ensure student credentials / identity are registered in MongoDB
        await saveStudent({
          name: entry.studentDetails.name,
          rollNumber: entry.studentDetails.rollNumber,
          year: entry.studentDetails.year,
          classBatch: entry.studentDetails.classBatch,
          department: entry.dutyDepartment.id,
          addedBy: admin,
        });

        // 2. Insert attendance record & atomically increment all-days attendance counts
        await logAttendance({
          studentDetails: entry.studentDetails,
          dutyDepartment: entry.dutyDepartment,
          attendanceLog: entry.attendanceLog,
          loggedBy: admin,
        });
      }

      // Always backup to local storage
      const logs = await readLogs();
      await writeLogs([entry, ...logs]);

      return json({ entry, storedInMongo: mongoStatus.connected }, 201);
    }

    return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
  } catch (err) {
    console.error('[attendance]', err);
    return json({ error: 'Storage backend error', message: err.message }, 502);
  }
};

export const config = { path: '/api/attendance' };
