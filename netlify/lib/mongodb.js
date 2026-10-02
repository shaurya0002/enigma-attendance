import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/enigma';
const dbName = process.env.MONGODB_DB_NAME || 'enigma';

let client;

export const COLLECTIONS = {
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  ATTENDANCE_COUNTS: 'attendance_counts',
};

/**
 * Global connection caching for serverless / Netlify Function environments.
 * Prevents opening new socket pools on every incoming request.
 */
function getClientPromise() {
  if (!process.env.MONGODB_URI && !global._mongoClientPromise) {
    console.warn('[mongodb] MONGODB_URI not found in environment. Defaulting to local connection.');
  }

  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
    });
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

/**
 * Returns database handle.
 */
export async function getDb() {
  const c = await getClientPromise();
  return c.db(dbName);
}

/**
 * Checks if MongoDB is reachable.
 */
export async function checkMongoConnection() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return { connected: true, dbName };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

let indexesInitialized = false;

/**
 * Initializes required indexes for department filtration, student identity uniqueness,
 * and attendance search performance.
 */
export async function ensureIndexes() {
  if (indexesInitialized) return;
  try {
    const db = await getDb();

    // Students indexes: unique rollNumber per department & search index
    await db.collection(COLLECTIONS.STUDENTS).createIndex(
      { rollNumber: 1, department: 1 },
      { unique: true, name: 'uniq_student_dept_roll' }
    );
    await db.collection(COLLECTIONS.STUDENTS).createIndex(
      { department: 1, name: 1 },
      { name: 'idx_dept_name' }
    );

    // Attendance records indexes: fast department & date filters
    await db.collection(COLLECTIONS.ATTENDANCE).createIndex(
      { department: 1, date: -1 },
      { name: 'idx_dept_date' }
    );
    await db.collection(COLLECTIONS.ATTENDANCE).createIndex(
      { rollNumber: 1, date: -1 },
      { name: 'idx_roll_date' }
    );

    // Attendance cumulative counts indexes
    await db.collection(COLLECTIONS.ATTENDANCE_COUNTS).createIndex(
      { rollNumber: 1, department: 1 },
      { unique: true, name: 'uniq_count_roll_dept' }
    );
    await db.collection(COLLECTIONS.ATTENDANCE_COUNTS).createIndex(
      { department: 1, totalDaysAttended: -1 },
      { name: 'idx_dept_attendance_rank' }
    );

    indexesInitialized = true;
  } catch (err) {
    console.warn('[mongodb] Index initialization warning:', err.message);
  }
}

/**
 * Inserts or updates student credentials for a department.
 */
export async function saveStudent({ name, rollNumber, year, classBatch, department, addedBy }) {
  await ensureIndexes();
  const db = await getDb();
  const cleanRoll = rollNumber.trim().toUpperCase();
  const cleanDept = department.trim().toLowerCase();

  const filter = { rollNumber: cleanRoll, department: cleanDept };
  const update = {
    $set: {
      name: name.trim(),
      rollNumber: cleanRoll,
      year,
      classBatch: classBatch.trim().toUpperCase(),
      department: cleanDept,
      updatedAt: new Date(),
    },
    $setOnInsert: {
      createdAt: new Date(),
      addedBy: addedBy || 'admin',
    },
  };

  const result = await db.collection(COLLECTIONS.STUDENTS).findOneAndUpdate(
    filter,
    update,
    { upsert: true, returnDocument: 'after' }
  );

  return result;
}

/**
 * Searches and filters students based on department and keyword (name, roll, class).
 * Department filter can be scoped to specific department admin access.
 */
export async function getStudents({ department, search, year, limit = 100, skip = 0 }) {
  await ensureIndexes();
  const db = await getDb();
  const query = {};

  if (department && department !== 'all') {
    query.department = department.trim().toLowerCase();
  }

  if (year && year !== 'all') {
    query.year = year;
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { rollNumber: { $regex: s, $options: 'i' } },
      { classBatch: { $regex: s, $options: 'i' } },
    ];
  }

  const cursor = db.collection(COLLECTIONS.STUDENTS)
    .find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return cursor.toArray();
}

/**
 * Logs a student's daily duty attendance and updates cumulative attendance count for all days.
 */
export async function logAttendance({ studentDetails, dutyDepartment, attendanceLog, loggedBy }) {
  await ensureIndexes();
  const db = await getDb();

  const cleanRoll = studentDetails.rollNumber.trim().toUpperCase();
  const cleanDept = dutyDepartment.id.trim().toLowerCase();
  const date = attendanceLog.date;

  const entry = {
    studentDetails: {
      name: studentDetails.name,
      rollNumber: cleanRoll,
      year: studentDetails.year,
      classBatch: studentDetails.classBatch,
    },
    dutyDepartment: {
      id: cleanDept,
      name: dutyDepartment.name,
      badge: dutyDepartment.badge,
    },
    attendanceLog: {
      date,
      totalLecturesSkipped: attendanceLog.totalLecturesSkipped,
      skippedLectureNumbers: attendanceLog.skippedLectureNumbers,
      skippedLecturesDetail: attendanceLog.skippedLecturesDetail,
      remarks: attendanceLog.remarks,
    },
    loggedBy: loggedBy || 'admin',
    createdAt: new Date(),
  };

  // 1. Insert daily detailed attendance record
  await db.collection(COLLECTIONS.ATTENDANCE).insertOne(entry);

  // 2. Atomically update cumulative attendance count for all days
  // $addToSet ensures each distinct duty date is only counted once for total days
  await db.collection(COLLECTIONS.ATTENDANCE_COUNTS).updateOne(
    { rollNumber: cleanRoll, department: cleanDept },
    {
      $set: {
        name: studentDetails.name,
        rollNumber: cleanRoll,
        department: cleanDept,
        year: studentDetails.year,
        classBatch: studentDetails.classBatch,
        lastLoggedAt: new Date(),
      },
      $addToSet: { dutyDates: date },
      $inc: { totalLecturesSkipped: attendanceLog.totalLecturesSkipped },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  // Update totalDaysAttended to match dutyDates array size
  const summary = await db.collection(COLLECTIONS.ATTENDANCE_COUNTS).findOne({
    rollNumber: cleanRoll,
    department: cleanDept,
  });

  if (summary && Array.isArray(summary.dutyDates)) {
    await db.collection(COLLECTIONS.ATTENDANCE_COUNTS).updateOne(
      { _id: summary._id },
      { $set: { totalDaysAttended: summary.dutyDates.length } }
    );
  }

  return entry;
}

/**
 * Retrieves attendance logs filtered by department, search, and date.
 */
export async function getAttendanceLogs({ department, search, date, limit = 100, skip = 0 }) {
  await ensureIndexes();
  const db = await getDb();
  const query = {};

  if (department && department !== 'all') {
    query['dutyDepartment.id'] = department.trim().toLowerCase();
  }

  if (date) {
    query['attendanceLog.date'] = date;
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { 'studentDetails.name': { $regex: s, $options: 'i' } },
      { 'studentDetails.rollNumber': { $regex: s, $options: 'i' } },
      { 'studentDetails.classBatch': { $regex: s, $options: 'i' } },
    ];
  }

  return db.collection(COLLECTIONS.ATTENDANCE)
    .find(query)
    .sort({ 'attendanceLog.date': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

/**
 * Retrieves cumulative attendance counts across all days filtered by department and search.
 */
export async function getAttendanceCounts({ department, search, limit = 100, skip = 0 }) {
  await ensureIndexes();
  const db = await getDb();
  const query = {};

  if (department && department !== 'all') {
    query.department = department.trim().toLowerCase();
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { rollNumber: { $regex: s, $options: 'i' } },
    ];
  }

  return db.collection(COLLECTIONS.ATTENDANCE_COUNTS)
    .find(query)
    .sort({ totalDaysAttended: -1, name: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}
