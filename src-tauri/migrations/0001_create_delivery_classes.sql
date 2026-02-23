CREATE TABLE IF NOT EXISTS delivery_classes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL,
  stage TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  learners INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  next_session TEXT NOT NULL DEFAULT '待确认',
  focus TEXT NOT NULL DEFAULT '[]',
  archive_state TEXT NOT NULL DEFAULT '待归档',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
