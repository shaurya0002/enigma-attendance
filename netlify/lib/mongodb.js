import { MongoClient } from 'mongodb';
import { readStudents } from './storage.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/enigma';
const dbName = process.env.MONGODB_DB_NAME || 'enigma';

let client;

export const COLLECTIONS = {
  STUDENTS: 'students',
  ATTENDANCE: 'attendance',
  ATTENDANCE_COUNTS: 'attendance_counts',
};

function getClientPromise() {
  if (!process.env.MONGODB_URI && !global._mongoClientPromise) {
    console.warn('[mongodb] MONGODB_URI not found in environment. Defaulting to local connection.');
  }

  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 2000,
    });
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

export async function getDb() {
  const c = await getClientPromise();
  return c.db(dbName);
}

let lastConnectionCheck = { time: 0, status: null };

export async function checkMongoConnection() {
  const now = Date.now();
  if (lastConnectionCheck.status && now - lastConnectionCheck.time < 10000) {
    return lastConnectionCheck.status;
  }
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const res = { connected: true, dbName };
    lastConnectionCheck = { time: now, status: res };
    return res;
  } catch (err) {
    const res = { connected: false, error: err.message };
    lastConnectionCheck = { time: now, status: res };
    return res;
  }
}

let indexesInitialized = false;

export async function ensureIndexes() {
  if (indexesInitialized) return;
  try {
    const db = await getDb();

    // Students indexes
    await db.collection(COLLECTIONS.STUDENTS).createIndex(
      { rollNumber: 1, department: 1 },
      { unique: true, name: 'uniq_student_dept_roll' }
    );
    await db.collection(COLLECTIONS.STUDENTS).createIndex(
      { department: 1, name: 1 },
      { name: 'idx_dept_name' }
    );
    await db.collection(COLLECTIONS.STUDENTS).createIndex(
      { contact: 1, department: 1 },
      { name: 'idx_contact_dept' }
    );

    // Attendance records indexes
    await db.collection(COLLECTIONS.ATTENDANCE).createIndex(
      { department: 1, date: -1 },
      { name: 'idx_dept_date' }
    );
    await db.collection(COLLECTIONS.ATTENDANCE).createIndex(
      { rollNumber: 1, date: -1 },
      { name: 'idx_roll_date' }
    );

    // Cumulative counts indexes
    await db.collection(COLLECTIONS.ATTENDANCE_COUNTS).createIndex(
      { rollNumber: 1, department: 1 },
      { unique: true, name: 'uniq_count_roll_dept' }
    );

    // Seed default students if collection is currently empty
    const count = await db.collection(COLLECTIONS.STUDENTS).countDocuments();
    if (count === 0) {
      const defaultList = await readStudents();
      if (defaultList && defaultList.length > 0) {
        const docs = defaultList.map((s) => ({
          ...s,
          rollNumber: String(s.rollNumber).trim().toUpperCase(),
          contact: String(s.contact || '').trim(),
          department: s.department.trim().toLowerCase(),
          createdAt: new Date(),
        }));
        await db.collection(COLLECTIONS.STUDENTS).insertMany(docs, { ordered: false });
        console.log(`[mongodb] Automatically seeded ${docs.length} student credentials into database.`);
      }
    }

    indexesInitialized = true;
  } catch (err) {
    console.warn('[mongodb] Index/seed warning:', err.message);
  }
}

export async function saveStudent({ name, rollNumber, contact, year, classBatch, department, addedBy }) {
  await ensureIndexes();
  const db = await getDb();
  const cleanRoll = rollNumber.trim().toUpperCase();
  const cleanDept = department.trim().toLowerCase();
  const cleanContact = String(contact || '').trim();

  const filter = { rollNumber: cleanRoll, department: cleanDept };
  const update = {
    $set: {
      name: name.trim(),
      rollNumber: cleanRoll,
      contact: cleanContact,
      year,
      classBatch: (classBatch || 'General').trim().toUpperCase(),
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

export async function getStudents({ department, search, year, limit = 150, skip = 0 }) {
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
      { contact: { $regex: s, $options: 'i' } },
    ];
  }

  const cursor = db.collection(COLLECTIONS.STUDENTS)
    .find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return cursor.toArray();
}

export async function logAttendance({ studentDetails, dutyDepartment, attendanceLog, loggedBy }) {
  await ensureIndexes();
  const db = await getDb();

  const cleanRoll = studentDetails.rollNumber.trim().toUpperCase();
  const cleanDept = dutyDepartment.id.trim().toLowerCase();
  const date = attendanceLog.date;
  const extraAttendance = Number(attendanceLog.extraAttendance) || 0;
  const totalLecturesSkipped = (attendanceLog.skippedLectureNumbers?.length || 0) + extraAttendance;

  const entry = {
    studentDetails: {
      name: studentDetails.name,
      rollNumber: cleanRoll,
      contact: studentDetails.contact || '',
      year: studentDetails.year,
      classBatch: studentDetails.classBatch || 'General',
    },
    dutyDepartment: {
      id: cleanDept,
      name: dutyDepartment.name,
      badge: dutyDepartment.badge,
    },
    attendanceLog: {
      date,
      totalLecturesSkipped,
      extraAttendance,
      skippedLectureNumbers: attendanceLog.skippedLectureNumbers || [],
      skippedLecturesDetail: attendanceLog.skippedLecturesDetail || [],
      remarks: attendanceLog.remarks,
    },
    loggedBy: loggedBy || 'admin',
    createdAt: new Date(),
  };

  // 1. Insert daily detailed attendance record
  await db.collection(COLLECTIONS.ATTENDANCE).insertOne(entry);

  // 2. Atomically update cumulative attendance count for all days
  await db.collection(COLLECTIONS.ATTENDANCE_COUNTS).updateOne(
    { rollNumber: cleanRoll, department: cleanDept },
    {
      $set: {
        name: studentDetails.name,
        rollNumber: cleanRoll,
        contact: studentDetails.contact || '',
        department: cleanDept,
        year: studentDetails.year,
        classBatch: studentDetails.classBatch || 'General',
        lastLoggedAt: new Date(),
      },
      $addToSet: { dutyDates: date },
      $inc: { totalLecturesSkipped },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

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

export async function getAttendanceLogs({ department, search, date, limit = 150, skip = 0 }) {
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
      { 'studentDetails.contact': { $regex: s, $options: 'i' } },
    ];
  }

  return db.collection(COLLECTIONS.ATTENDANCE)
    .find(query)
    .sort({ 'attendanceLog.date': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

export async function getAttendanceCounts({ department, search, limit = 150, skip = 0 }) {
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
      { contact: { $regex: s, $options: 'i' } },
    ];
  }

  return db.collection(COLLECTIONS.ATTENDANCE_COUNTS)
    .find(query)
    .sort({ totalDaysAttended: -1, name: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}
