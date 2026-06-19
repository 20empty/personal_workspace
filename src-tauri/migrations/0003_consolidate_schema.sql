-- Consolidates schema that used to be guarded in the frontend data layer.
-- Existing databases may already have some columns from older app versions; the
-- frontend keeps a narrow compatibility fallback for those cases.

CREATE TABLE IF NOT EXISTS delivery_sop_tasks (
  id          TEXT PRIMARY KEY,
  class_id    TEXT NOT NULL,
  stage       TEXT NOT NULL,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (class_id) REFERENCES delivery_classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS delivery_courses (
  id                 TEXT PRIMARY KEY,
  class_id           TEXT NOT NULL,
  course_template_id TEXT,
  name               TEXT NOT NULL,
  level              TEXT NOT NULL DEFAULT 'L2',
  days               TEXT NOT NULL,
  start_date         TEXT NOT NULL,
  end_date           TEXT NOT NULL,
  order_index        INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (class_id) REFERENCES delivery_classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS delivery_sop_templates (
  id          TEXT PRIMARY KEY,
  class_type  TEXT NOT NULL,
  stage       TEXT NOT NULL,
  title       TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delivery_course_templates (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  level                 TEXT NOT NULL DEFAULT 'L2',
  days                  TEXT NOT NULL,
  schedule_path         TEXT,
  schedule_preview_path TEXT,
  schedule_file_name    TEXT,
  schedule_file_type    TEXT,
  order_index           INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_delivery_courses_class_id ON delivery_courses(class_id);
CREATE INDEX IF NOT EXISTS idx_delivery_sop_tasks_class_id ON delivery_sop_tasks(class_id);
CREATE INDEX IF NOT EXISTS idx_delivery_classes_stage ON delivery_classes(stage);
CREATE INDEX IF NOT EXISTS idx_dev_tasks_project_id ON dev_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_dev_tasks_status ON dev_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dev_projects_status ON dev_projects(status);

UPDATE dev_tasks
SET status = CASE status
  WHEN 'backlog' THEN 'pending'
  WHEN 'inDev' THEN 'inProgress'
  WHEN 'selfQA' THEN 'draftDone'
  WHEN 'peerReview' THEN 'qaReview'
  WHEN 'done' THEN 'submitted'
  ELSE status
END
WHERE status IN ('backlog', 'inDev', 'selfQA', 'peerReview', 'done');
