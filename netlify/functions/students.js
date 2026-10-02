import { getConfig, getAdmin, isSafePost, readJson, json } from '../lib/auth.js';
import { saveStudent, getStudents, checkMongoConnection } from '../lib/mongodb.js';
import { EVENT_TEAMS, ACADEMIC_YEARS } from '../../src/config/teams.js';

export default async (req) => {
  const cfg = getConfig();
  if (!cfg) return json({ error: 'Server not configured' }, 500);

  const admin = getAdmin(req, cfg);
  if (!admin) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(req.url, 'http://localhost');
  const searchParams = url.searchParams;

  try {
    // -------------------------------------------------------------
    // GET /api/students: Search & filter students by department
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const department = searchParams.get('department') || 'all';
      const search = searchParams.get('search') || '';
      const year = searchParams.get('year') || 'all';

      const mongoStatus = await checkMongoConnection();
      if (!mongoStatus.connected) {
        return json({
          warning: 'MongoDB not currently connected',
          error: mongoStatus.error,
          students: [],
        }, 200);
      }

      const students = await getStudents({ department, search, year });
      return json({ students });
    }

    // -------------------------------------------------------------
    // POST /api/students: Department admin enters student credentials
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      if (!isSafePost(req)) return json({ error: 'Bad request' }, 400);
      const { data, tooLarge } = await readJson(req, 8000);
      if (tooLarge) return json({ error: 'Payload too large' }, 413);

      const name = typeof data?.name === 'string' ? data.name.trim().slice(0, 80) : '';
      const rollNumber = typeof data?.rollNumber === 'string' ? data.rollNumber.trim().toUpperCase().slice(0, 30) : '';
      const year = data?.year;
      const classBatch = typeof data?.classBatch === 'string' ? data.classBatch.trim().toUpperCase().slice(0, 20) : '';
      const department = typeof data?.department === 'string' ? data.department.trim().toLowerCase() : '';

      if (!name) return json({ error: 'Student name is required' }, 400);
      if (!rollNumber) return json({ error: 'Roll number is required' }, 400);
      if (!ACADEMIC_YEARS.includes(year)) return json({ error: 'Invalid academic year' }, 400);
      if (!classBatch) return json({ error: 'Class / batch is required' }, 400);
      if (!EVENT_TEAMS.some((t) => t.id === department)) return json({ error: 'Invalid department' }, 400);

      const mongoStatus = await checkMongoConnection();
      if (!mongoStatus.connected) {
        return json({
          error: 'MongoDB is required to register student credentials',
          details: mongoStatus.error,
        }, 503);
      }

      const student = await saveStudent({
        name,
        rollNumber,
        year,
        classBatch,
        department,
        addedBy: admin,
      });

      return json({ student, message: 'Student credential registered successfully' }, 201);
    }

    return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
  } catch (err) {
    console.error('[students]', err);
    return json({ error: 'Database operation failed', message: err.message }, 500);
  }
};

export const config = { path: '/api/students' };
