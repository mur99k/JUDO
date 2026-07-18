-- SQLite schema for local development.
-- Mirrors schema-postgres.sql; applied idempotently by migrate.js.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  password TEXT NOT NULL,
  profileImage TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'coach')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT NOT NULL,
  nationalId TEXT UNIQUE,
  age INTEGER,
  phone TEXT,
  parentPhone TEXT,
  photo TEXT,
  password TEXT,
  category TEXT,
  status TEXT DEFAULT 'نشط' CHECK(status IN ('نشط', 'منتهي', 'موقوف', 'بانتظار الدفع', 'ملغي')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('حاضر', 'غائب', 'معذر')),
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(studentId, date)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  days INTEGER DEFAULT 30,
  amount REAL NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  status TEXT DEFAULT 'نشط' CHECK(status IN ('نشط', 'منتهي', 'موقوف', 'بانتظار الدفع', 'ملغي')),
  paymentMethod TEXT,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coach_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coachId INTEGER NOT NULL,
  studentId INTEGER NOT NULL,
  FOREIGN KEY (coachId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_studentId ON subscriptions(studentId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_startDate ON subscriptions(startDate);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_coach_groups_coachId ON coach_groups(coachId);
CREATE INDEX IF NOT EXISTS idx_coach_groups_studentId ON coach_groups(studentId);
