-- DevTracker tables migration
-- Creates dev_projects and dev_tasks tables for development tracking

-- Projects table (开发PO)
CREATE TABLE IF NOT EXISTS dev_projects (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'planning',
  priority    TEXT NOT NULL DEFAULT 'medium',
  start_date  TEXT NOT NULL,
  end_date    TEXT NOT NULL,
  progress    INTEGER NOT NULL DEFAULT 0,
  owner       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tasks table (开发任务)
CREATE TABLE IF NOT EXISTS dev_tasks (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'backlog',
  assignee    TEXT NOT NULL DEFAULT '',
  priority    TEXT NOT NULL DEFAULT 'medium',
  due_date    TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES dev_projects(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dev_tasks_project_id ON dev_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_dev_tasks_status ON dev_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dev_projects_status ON dev_projects(status);
