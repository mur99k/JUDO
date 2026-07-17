-- Create coaches group mapping table (kept for data integrity / future use)
-- Idempotent creation.
CREATE TABLE IF NOT EXISTS coach_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coachId INTEGER NOT NULL,
  studentId INTEGER NOT NULL,
  FOREIGN KEY (coachId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
);
