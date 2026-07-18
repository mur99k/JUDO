-- Postgres schema for production (Render Free PostgreSQL).
-- Applied idempotently by src/database/migrate.js.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  fullName TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  password TEXT NOT NULL,
  profileImage TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'coach')),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  fullName TEXT NOT NULL,
  nationalId TEXT UNIQUE,
  age INTEGER,
  phone TEXT,
  parentPhone TEXT,
  photo TEXT,
  password TEXT,
  category TEXT,
  status TEXT DEFAULT 'نشط' CHECK (status IN ('نشط', 'منتهي', 'موقوف', 'بانتظار الدفع', 'ملغي')),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  studentId INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('حاضر', 'غائب', 'معذر')),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (studentId, date)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  studentId INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  days INTEGER DEFAULT 30,
  amount REAL NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  status TEXT DEFAULT 'نشط' CHECK (status IN ('نشط', 'منتهي', 'موقوف', 'بانتظار الدفع', 'ملغي')),
  paymentMethod TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coach_groups (
  id SERIAL PRIMARY KEY,
  coachId INTEGER NOT NULL,
  studentId INTEGER NOT NULL,
  FOREIGN KEY (coachId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_studentId ON subscriptions(studentId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_startDate ON subscriptions(startDate);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_coach_groups_coachId ON coach_groups(coachId);
CREATE INDEX IF NOT EXISTS idx_coach_groups_studentId ON coach_groups(studentId);
