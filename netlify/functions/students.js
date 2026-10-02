import { getConfig, getAdmin, isSafePost, readJson, json } from '../lib/auth.js';
import { saveStudent, getStudents, checkMongoConnection } from '../lib/mongodb.js';
import { searchLocalStudents, writeStudents, readStudents } from '../lib/storage.js';
import { EVENT_TEAMS, ACADEMIC_YEARS } from '../../src/config/teams.js';

export default async (req) => {
  const cfg = getConfig();
  const url = new URL(req.url, 'http://localhost');
  const searchParams = url.searchParams;

  try {
    // -------------------------------------------------------------
    // GET /api/students: Search & filter students by department
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const admin = cfg ? getAdmin(req, cfg) : null;
      let department = searchParams.get('department') || 'all';
      if (admin?.department && admin.department !== 'all') {
        department = admin.department;
      }
      const search = searchParams.get('search') || '';
      const year = searchParams.get('year') || 'all';

      const mongoStatus = await checkMongoConnection();
      if (mongoStatus.connected) {
        const students = await getStudents({ department, search, year });
        return json({ students, source: 'mongodb' });
      }

      // Offline / Local File Storage Fallback
      const students = await searchLocalStudents({ department, search, year });
      return json({ students, source: 'local_storage', warning: 'Using local storage' });
    }

    // -------------------------------------------------------------
    // POST /api/students: Department admin enters student credentials
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      const admin = cfg ? getAdmin(req, cfg) : null;
      if (!admin) return json({ error: 'Unauthorized' }, 401);
      if (!isSafePost(req)) return json({ error: 'Bad request' }, 400);
      const { data, tooLarge } = await readJson(req, 8000);
      if (tooLarge) return json({ error: 'Payload too large' }, 413);

      const name = typeof data?.name === 'string' ? data.name.trim().slice(0, 80) : '';
      const rollNumber = typeof data?.rollNumber === 'string' ? data.rollNumber.trim().toUpperCase().slice(0, 30) : '';
      const contact = typeof data?.contact === 'string' ? data.contact.trim().slice(0, 20) : '';
      const year = data?.year;
      const classBatch = typeof data?.classBatch === 'string' ? data.classBatch.trim().toUpperCase().slice(0, 20) : 'General';
      let department = typeof data?.department === 'string' ? data.department.trim().toLowerCase() : '';

      // Enforce department admin assignment
      if (admin.department && admin.department !== 'all') {
        department = admin.department;
      }

      if (!name) return json({ error: 'Student name is required' }, 400);
      if (!rollNumber) return json({ error: 'Roll number is required' }, 400);
      if (!ACADEMIC_YEARS.includes(year)) return json({ error: 'Invalid academic year' }, 400);
      if (!EVENT_TEAMS.some((t) => t.id === department)) return json({ error: 'Invalid department' }, 400);

      const mongoStatus = await checkMongoConnection();
      let studentDoc;

      if (mongoStatus.connected) {
        studentDoc = await saveStudent({
          name,
          rollNumber,
          contact,
          year,
          classBatch,
          department,
          addedBy: admin.username,
        });
      } else {
        // Fallback local persistence
        const existing = await readStudents();
        const newStudent = {
          id: `STU_${Date.now()}`,
          name,
          rollNumber,
          contact,
          year,
          classBatch,
          department,
          addedBy: admin.username,
          createdAt: new Date().toISOString(),
        };
        const updated = [newStudent, ...existing.filter((s) => !(s.rollNumber === rollNumber && s.department === department))];
        await writeStudents(updated);
        studentDoc = newStudent;
      }

      return json({ student: studentDoc, message: 'Student credential registered successfully' }, 201);
    }

    return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
  } catch (err) {
    console.error('[students]', err);
    return json({ error: 'Database operation failed', message: err.message }, 500);
  }
};

export const config = { path: '/api/students' };
