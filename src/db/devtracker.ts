import { getDb } from "./client";

export type ProjectStatus = "planning" | "inProgress" | "completed" | "archived";
export type TaskStatus =
  | "pending"
  | "inProgress"
  | "draftDone"
  | "qaReview"
  | "readyToSubmit"
  | "submitted"
  | "archived";
export type Priority = "high" | "medium" | "low";
export type DeliverableType = "slides" | "lab" | "notes" | "other";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "待启动",
  inProgress: "进行中",
  completed: "已完成",
  archived: "已归档",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "待启动",
  inProgress: "制作中",
  draftDone: "初稿完成",
  qaReview: "QA评审中",
  readyToSubmit: "待提交",
  submitted: "已提交",
  archived: "已归档",
};

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  slides: "PPT",
  lab: "实验手册",
  notes: "讲师备注",
  other: "其他",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const WIP_LIMITS: Partial<Record<TaskStatus, number>> = {
  inProgress: 3,
};

export function getQuarterNumber(dateStr: string): number {
  if (!dateStr) return 1;
  return Math.floor(new Date(`${dateStr}T00:00:00`).getMonth() / 3) + 1;
}

export function getQuarterLabel(dateStr: string): string {
  return `Q${getQuarterNumber(dateStr)}`;
}

export type SubTask = {
  id: string;
  title: string;
  done: boolean;
};

export type RefLink = {
  id: string;
  title: string;
  url: string;
};

export type QAChecklist = {
  feedbackReceived: boolean;
  annotationsResolved: boolean;
  cloudVerified: boolean;
};

export type DevProjectInput = {
  code: string;
  title: string;
  status?: ProjectStatus;
  priority?: Priority;
  startDate: string;
  endDate: string;
  owner?: string;
  source?: string;
  poCount?: number;
  description?: string;
  progress?: number;
};

export type DevProjectRecord = {
  id: string;
  code: string;
  title: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  endDate: string;
  progress: number;
  owner: string;
  source: string;
  poCount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type DevProjectSummaryRecord = DevProjectRecord & {
  deliverableCount: number;
  pendingCount: number;
  inProgressCount: number;
  draftDoneCount: number;
  qaReviewCount: number;
  readyToSubmitCount: number;
  submittedCount: number;
  archivedCount: number;
  slidesCount: number;
  labCount: number;
};

export type DevTaskInput = {
  projectId: string;
  title: string;
  description?: string;
  deliverableType?: DeliverableType;
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  dueDate?: string;
  blocker?: string;
  orderIndex?: number;
  contextNote?: string;
  docUrl?: string;
  baselineUrl?: string;
  finalDocUrl?: string;
  refs?: RefLink[];
  subTasks?: SubTask[];
  reviewerName?: string;
  reviewerEta?: string;
  qaChecklist?: QAChecklist;
  draftCompletedAt?: string;
  qaCompletedAt?: string;
  submittedAt?: string;
};

export type DevTaskRecord = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  deliverableType: DeliverableType;
  status: TaskStatus;
  priority: Priority;
  assignee: string;
  dueDate: string;
  blocker: string;
  orderIndex: number;
  contextNote: string;
  docUrl: string;
  baselineUrl: string;
  finalDocUrl: string;
  refs: RefLink[];
  subTasks: SubTask[];
  reviewerName: string;
  reviewerEta: string;
  qaChecklist: QAChecklist;
  draftCompletedAt: string;
  qaCompletedAt: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DevStats = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueDeliverables: number;
  readyToSubmitDeliverables: number;
  qaDeliverables: number;
  missingKeyDeliverables: number;
};

export type TaskOrderUpdate = {
  id: string;
  status: TaskStatus;
  orderIndex: number;
};

const ACTIVE_TASK_STATUSES: TaskStatus[] = [
  "pending",
  "inProgress",
  "draftDone",
  "qaReview",
  "readyToSubmit",
  "submitted",
];

const KEY_DELIVERABLES: DeliverableType[] = ["slides", "lab"];

const DELIVERABLE_WEIGHTS: Record<DeliverableType, number> = {
  slides: 50,
  lab: 40,
  notes: 10,
  other: 10,
};

const STATUS_PROGRESS: Record<TaskStatus, number> = {
  pending: 0,
  inProgress: 35,
  draftDone: 60,
  qaReview: 75,
  readyToSubmit: 90,
  submitted: 100,
  archived: 100,
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseInt(value, 10) || 0;
  return 0;
};

const parseJSON = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const defaultQA = (): QAChecklist => ({
  feedbackReceived: false,
  annotationsResolved: false,
  cloudVerified: false,
});

const normalizeTaskStatus = (value: unknown): TaskStatus => {
  switch (value) {
    case "backlog":
      return "pending";
    case "inDev":
      return "inProgress";
    case "selfQA":
      return "draftDone";
    case "peerReview":
      return "qaReview";
    case "done":
      return "submitted";
    case "pending":
    case "inProgress":
    case "draftDone":
    case "qaReview":
    case "readyToSubmit":
    case "submitted":
    case "archived":
      return value;
    default:
      return "pending";
  }
};

const normalizeDeliverableType = (value: unknown): DeliverableType => {
  switch (value) {
    case "slides":
    case "lab":
    case "notes":
    case "other":
      return value;
    default:
      return "other";
  }
};

const mapProjectRow = (row: Record<string, unknown>): DevProjectRecord => ({
  id: row.id as string,
  code: row.code as string,
  title: row.title as string,
  status: (row.status as ProjectStatus) ?? "planning",
  priority: (row.priority as Priority) ?? "medium",
  startDate: row.start_date as string,
  endDate: row.end_date as string,
  progress: toNumber(row.progress),
  owner: (row.owner as string) ?? "",
  source: (row.source as string) ?? "",
  poCount: toNumber(row.po_count),
  description: (row.description as string) ?? "",
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const mapTaskRow = (row: Record<string, unknown>): DevTaskRecord => ({
  id: row.id as string,
  projectId: row.project_id as string,
  title: row.title as string,
  description: (row.description as string) ?? "",
  deliverableType: normalizeDeliverableType(row.deliverable_type),
  status: normalizeTaskStatus(row.status),
  priority: (row.priority as Priority) ?? "medium",
  assignee: (row.assignee as string) ?? "",
  dueDate: (row.due_date as string) ?? "",
  blocker: (row.blocker as string) ?? "",
  orderIndex: toNumber(row.order_index),
  contextNote: (row.context_note as string) ?? "",
  docUrl: (row.doc_url as string) ?? "",
  baselineUrl: (row.baseline_url as string) ?? "",
  finalDocUrl: (row.final_doc_url as string) ?? "",
  refs: parseJSON<RefLink[]>(row.refs, []),
  subTasks: parseJSON<SubTask[]>(row.sub_tasks, []),
  reviewerName: (row.reviewer_name as string) ?? "",
  reviewerEta: (row.reviewer_eta as string) ?? "",
  qaChecklist: parseJSON<QAChecklist>(row.qa_checklist, defaultQA()),
  draftCompletedAt: (row.draft_completed_at as string) ?? "",
  qaCompletedAt: (row.qa_completed_at as string) ?? "",
  submittedAt: (row.submitted_at as string) ?? "",
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

async function ensureTables() {
  const db = await getDb();

  await db.execute(`
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
      source      TEXT NOT NULL DEFAULT '',
      po_count    INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS dev_tasks (
      id                 TEXT PRIMARY KEY,
      project_id         TEXT NOT NULL,
      title              TEXT NOT NULL,
      description        TEXT NOT NULL DEFAULT '',
      deliverable_type   TEXT NOT NULL DEFAULT 'slides',
      status             TEXT NOT NULL DEFAULT 'pending',
      assignee           TEXT NOT NULL DEFAULT '',
      priority           TEXT NOT NULL DEFAULT 'medium',
      due_date           TEXT NOT NULL DEFAULT '',
      blocker            TEXT NOT NULL DEFAULT '',
      order_index        INTEGER NOT NULL DEFAULT 0,
      context_note       TEXT NOT NULL DEFAULT '',
      doc_url            TEXT NOT NULL DEFAULT '',
      baseline_url       TEXT NOT NULL DEFAULT '',
      final_doc_url      TEXT NOT NULL DEFAULT '',
      refs               TEXT NOT NULL DEFAULT '[]',
      sub_tasks          TEXT NOT NULL DEFAULT '[]',
      reviewer_name      TEXT NOT NULL DEFAULT '',
      reviewer_eta       TEXT NOT NULL DEFAULT '',
      qa_checklist       TEXT NOT NULL DEFAULT '{}',
      draft_completed_at TEXT NOT NULL DEFAULT '',
      qa_completed_at    TEXT NOT NULL DEFAULT '',
      submitted_at       TEXT NOT NULL DEFAULT '',
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES dev_projects(id) ON DELETE CASCADE
    )
  `);

  const projectColumns: [string, string][] = [
    ["source", "TEXT NOT NULL DEFAULT ''"],
    ["po_count", "INTEGER NOT NULL DEFAULT 0"],
  ];
  for (const [col, def] of projectColumns) {
    try {
      await db.execute(`ALTER TABLE dev_projects ADD COLUMN ${col} ${def}`);
    } catch {
      // ignore existing column
    }
  }

  const taskColumns: [string, string][] = [
    ["deliverable_type", "TEXT NOT NULL DEFAULT 'slides'"],
    ["assignee", "TEXT NOT NULL DEFAULT ''"],
    ["blocker", "TEXT NOT NULL DEFAULT ''"],
    ["context_note", "TEXT NOT NULL DEFAULT ''"],
    ["doc_url", "TEXT NOT NULL DEFAULT ''"],
    ["baseline_url", "TEXT NOT NULL DEFAULT ''"],
    ["final_doc_url", "TEXT NOT NULL DEFAULT ''"],
    ["refs", "TEXT NOT NULL DEFAULT '[]'"],
    ["sub_tasks", "TEXT NOT NULL DEFAULT '[]'"],
    ["reviewer_name", "TEXT NOT NULL DEFAULT ''"],
    ["reviewer_eta", "TEXT NOT NULL DEFAULT ''"],
    ["qa_checklist", "TEXT NOT NULL DEFAULT '{}'"],
    ["draft_completed_at", "TEXT NOT NULL DEFAULT ''"],
    ["qa_completed_at", "TEXT NOT NULL DEFAULT ''"],
    ["submitted_at", "TEXT NOT NULL DEFAULT ''"],
  ];

  for (const [col, def] of taskColumns) {
    try {
      await db.execute(`ALTER TABLE dev_tasks ADD COLUMN ${col} ${def}`);
    } catch {
      // ignore existing column
    }
  }

  await db.execute(`
    UPDATE dev_tasks
    SET status = CASE status
      WHEN 'backlog' THEN 'pending'
      WHEN 'inDev' THEN 'inProgress'
      WHEN 'selfQA' THEN 'draftDone'
      WHEN 'peerReview' THEN 'qaReview'
      WHEN 'done' THEN 'submitted'
      ELSE status
    END
    WHERE status IN ('backlog', 'inDev', 'selfQA', 'peerReview', 'done')
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_dev_tasks_project_id ON dev_tasks(project_id)
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_dev_tasks_status ON dev_tasks(status)
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_dev_projects_status ON dev_projects(status)
  `);
}

let _tablesReady: Promise<void> | null = null;
function tablesReady() {
  if (!_tablesReady) _tablesReady = ensureTables();
  return _tablesReady;
}

export async function listDevProjects(): Promise<DevProjectRecord[]> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM dev_projects ORDER BY updated_at DESC"
  );
  return rows.map(mapProjectRow);
}

export async function listDevProjectSummaries(): Promise<DevProjectSummaryRecord[]> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT
       p.*,
       COUNT(t.id) as deliverable_count,
       SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
       SUM(CASE WHEN t.status = 'inProgress' THEN 1 ELSE 0 END) as in_progress_count,
       SUM(CASE WHEN t.status = 'draftDone' THEN 1 ELSE 0 END) as draft_done_count,
       SUM(CASE WHEN t.status = 'qaReview' THEN 1 ELSE 0 END) as qa_review_count,
       SUM(CASE WHEN t.status = 'readyToSubmit' THEN 1 ELSE 0 END) as ready_to_submit_count,
       SUM(CASE WHEN t.status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
       SUM(CASE WHEN t.status = 'archived' THEN 1 ELSE 0 END) as archived_count,
       SUM(CASE WHEN t.deliverable_type = 'slides' THEN 1 ELSE 0 END) as slides_count,
       SUM(CASE WHEN t.deliverable_type = 'lab' THEN 1 ELSE 0 END) as lab_count
     FROM dev_projects p
     LEFT JOIN dev_tasks t ON t.project_id = p.id
     GROUP BY p.id
     ORDER BY p.updated_at DESC`
  );

  return rows.map(row => ({
    ...mapProjectRow(row),
    deliverableCount: toNumber(row.deliverable_count),
    pendingCount: toNumber(row.pending_count),
    inProgressCount: toNumber(row.in_progress_count),
    draftDoneCount: toNumber(row.draft_done_count),
    qaReviewCount: toNumber(row.qa_review_count),
    readyToSubmitCount: toNumber(row.ready_to_submit_count),
    submittedCount: toNumber(row.submitted_count),
    archivedCount: toNumber(row.archived_count),
    slidesCount: toNumber(row.slides_count),
    labCount: toNumber(row.lab_count),
  }));
}

export async function getDevProject(id: string): Promise<DevProjectRecord | null> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM dev_projects WHERE id = $1",
    [id]
  );
  return rows[0] ? mapProjectRow(rows[0]) : null;
}

export async function createDevProject(input: DevProjectInput): Promise<string> {
  await tablesReady();
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO dev_projects
      (id, code, title, status, priority, start_date, end_date, progress, owner, source, po_count, description, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      id,
      input.code,
      input.title,
      input.status ?? "planning",
      input.priority ?? "medium",
      input.startDate,
      input.endDate,
      input.progress ?? 0,
      input.owner ?? "",
      input.source ?? "",
      input.poCount ?? 0,
      input.description ?? "",
      now,
      now,
    ]
  );

  return id;
}

export async function updateDevProject(id: string, patch: Partial<DevProjectInput>): Promise<void> {
  await tablesReady();
  const db = await getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const push = (col: string, val: unknown) => {
    sets.push(`${col} = $${idx++}`);
    values.push(val);
  };

  if (patch.code !== undefined) push("code", patch.code);
  if (patch.title !== undefined) push("title", patch.title);
  if (patch.status !== undefined) push("status", patch.status);
  if (patch.priority !== undefined) push("priority", patch.priority);
  if (patch.startDate !== undefined) push("start_date", patch.startDate);
  if (patch.endDate !== undefined) push("end_date", patch.endDate);
  if (patch.progress !== undefined) push("progress", patch.progress);
  if (patch.owner !== undefined) push("owner", patch.owner);
  if (patch.source !== undefined) push("source", patch.source);
  if (patch.poCount !== undefined) push("po_count", patch.poCount);
  if (patch.description !== undefined) push("description", patch.description);
  push("updated_at", new Date().toISOString());

  await db.execute(
    `UPDATE dev_projects SET ${sets.join(", ")} WHERE id = $${idx}`,
    [...values, id]
  );
}

export async function deleteDevProject(id: string): Promise<void> {
  await tablesReady();
  const db = await getDb();
  await db.execute("DELETE FROM dev_tasks WHERE project_id = $1", [id]);
  await db.execute("DELETE FROM dev_projects WHERE id = $1", [id]);
}

function getDeliverableWeight(type: DeliverableType) {
  return DELIVERABLE_WEIGHTS[type] ?? DELIVERABLE_WEIGHTS.other;
}

export async function updateProjectProgress(projectId: string): Promise<number> {
  await tablesReady();
  const db = await getDb();
  const taskRows = await db.select<Record<string, unknown>[]>(
    "SELECT deliverable_type, status FROM dev_tasks WHERE project_id = $1",
    [projectId]
  );

  const tasks = taskRows.map(row => ({
    deliverableType: normalizeDeliverableType(row.deliverable_type),
    status: normalizeTaskStatus(row.status),
  }));
  if (tasks.length === 0) {
    await db.execute(
      "UPDATE dev_projects SET progress = 0, updated_at = $1 WHERE id = $2",
      [new Date().toISOString(), projectId]
    );
    return 0;
  }

  const weightedTotal = tasks.reduce((sum, task) => sum + getDeliverableWeight(task.deliverableType), 0);
  const weightedDone = tasks.reduce(
    (sum, task) => sum + (getDeliverableWeight(task.deliverableType) * STATUS_PROGRESS[task.status]) / 100,
    0
  );
  const progress = weightedTotal > 0 ? Math.round((weightedDone / weightedTotal) * 100) : 0;

  await db.execute(
    "UPDATE dev_projects SET progress = $1, updated_at = $2 WHERE id = $3",
    [progress, new Date().toISOString(), projectId]
  );
  return progress;
}

export async function getTasksByProject(projectId: string, includeArchived = false): Promise<DevTaskRecord[]> {
  await tablesReady();
  const db = await getDb();
  const statuses = includeArchived
    ? [...ACTIVE_TASK_STATUSES, "archived"]
    : ACTIVE_TASK_STATUSES;
  const statusSql = statuses.map(status => `'${status}'`).join(", ");

  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT * FROM dev_tasks
     WHERE project_id = $1
       AND status IN (${statusSql})
     ORDER BY
       CASE status
         WHEN 'pending' THEN 0
         WHEN 'inProgress' THEN 1
         WHEN 'draftDone' THEN 2
         WHEN 'qaReview' THEN 3
         WHEN 'readyToSubmit' THEN 4
         WHEN 'submitted' THEN 5
         WHEN 'archived' THEN 6
         ELSE 7
       END ASC,
       due_date ASC,
       order_index ASC,
       created_at ASC`,
    [projectId]
  );
  return rows.map(mapTaskRow);
}

export async function getArchivedTasksByProject(projectId: string): Promise<DevTaskRecord[]> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT * FROM dev_tasks
     WHERE project_id = $1 AND status = 'archived'
     ORDER BY updated_at DESC`,
    [projectId]
  );
  return rows.map(mapTaskRow);
}

export async function createDevTask(input: DevTaskInput): Promise<string> {
  await tablesReady();
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const status = input.status ?? "pending";

  const maxOrderResult = await db.select<Record<string, unknown>[]>(
    "SELECT COALESCE(MAX(order_index), -1) as max_order FROM dev_tasks WHERE project_id = $1 AND status = $2",
    [input.projectId, status]
  );
  const orderIndex = toNumber(maxOrderResult[0]?.max_order) + 1;

  await db.execute(
    `INSERT INTO dev_tasks
       (id, project_id, title, description, deliverable_type, status, assignee, priority, due_date, blocker, order_index,
        context_note, doc_url, baseline_url, final_doc_url, refs, sub_tasks, reviewer_name, reviewer_eta,
        qa_checklist, draft_completed_at, qa_completed_at, submitted_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
    [
      id,
      input.projectId,
      input.title,
      input.description ?? "",
      input.deliverableType ?? "slides",
      status,
      input.assignee ?? "",
      input.priority ?? "medium",
      input.dueDate ?? "",
      input.blocker ?? "",
      input.orderIndex ?? orderIndex,
      input.contextNote ?? "",
      input.docUrl ?? "",
      input.baselineUrl ?? "",
      input.finalDocUrl ?? "",
      JSON.stringify(input.refs ?? []),
      JSON.stringify(input.subTasks ?? []),
      input.reviewerName ?? "",
      input.reviewerEta ?? "",
      JSON.stringify(input.qaChecklist ?? defaultQA()),
      input.draftCompletedAt ?? (status === "draftDone" ? now : ""),
      input.qaCompletedAt ?? (status === "readyToSubmit" || status === "submitted" || status === "archived" ? now : ""),
      input.submittedAt ?? (status === "submitted" || status === "archived" ? now : ""),
      now,
      now,
    ]
  );

  await updateProjectProgress(input.projectId);
  return id;
}

export type DevTaskPatch = Partial<Omit<DevTaskInput, "projectId">>;

export async function updateDevTask(id: string, patch: DevTaskPatch): Promise<void> {
  await tablesReady();
  const db = await getDb();
  const currentRows = await db.select<Record<string, unknown>[]>(
    "SELECT project_id, status, draft_completed_at, qa_completed_at, submitted_at FROM dev_tasks WHERE id = $1",
    [id]
  );
  const current = currentRows[0];
  if (!current) return;

  const projectId = current.project_id as string;
  const nextStatus = patch.status ?? normalizeTaskStatus(current.status);
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const push = (col: string, val: unknown) => {
    sets.push(`${col} = $${idx++}`);
    values.push(val);
  };

  if (patch.title !== undefined) push("title", patch.title);
  if (patch.description !== undefined) push("description", patch.description);
  if (patch.deliverableType !== undefined) push("deliverable_type", patch.deliverableType);
  if (patch.status !== undefined) push("status", patch.status);
  if (patch.priority !== undefined) push("priority", patch.priority);
  if (patch.assignee !== undefined) push("assignee", patch.assignee);
  if (patch.dueDate !== undefined) push("due_date", patch.dueDate);
  if (patch.blocker !== undefined) push("blocker", patch.blocker);
  if (patch.orderIndex !== undefined) push("order_index", patch.orderIndex);
  if (patch.contextNote !== undefined) push("context_note", patch.contextNote);
  if (patch.docUrl !== undefined) push("doc_url", patch.docUrl);
  if (patch.baselineUrl !== undefined) push("baseline_url", patch.baselineUrl);
  if (patch.finalDocUrl !== undefined) push("final_doc_url", patch.finalDocUrl);
  if (patch.refs !== undefined) push("refs", JSON.stringify(patch.refs));
  if (patch.subTasks !== undefined) push("sub_tasks", JSON.stringify(patch.subTasks));
  if (patch.reviewerName !== undefined) push("reviewer_name", patch.reviewerName);
  if (patch.reviewerEta !== undefined) push("reviewer_eta", patch.reviewerEta);
  if (patch.qaChecklist !== undefined) push("qa_checklist", JSON.stringify(patch.qaChecklist));

  const now = new Date().toISOString();
  if (
    patch.status !== undefined &&
    nextStatus === "draftDone" &&
    !(current.draft_completed_at as string)
  ) {
    push("draft_completed_at", patch.draftCompletedAt ?? now);
  } else if (patch.draftCompletedAt !== undefined) {
    push("draft_completed_at", patch.draftCompletedAt);
  }

  if (
    patch.status !== undefined &&
    (nextStatus === "readyToSubmit" || nextStatus === "submitted" || nextStatus === "archived") &&
    !(current.qa_completed_at as string)
  ) {
    push("qa_completed_at", patch.qaCompletedAt ?? now);
  } else if (patch.qaCompletedAt !== undefined) {
    push("qa_completed_at", patch.qaCompletedAt);
  }

  if (
    patch.status !== undefined &&
    (nextStatus === "submitted" || nextStatus === "archived") &&
    !(current.submitted_at as string)
  ) {
    push("submitted_at", patch.submittedAt ?? now);
  } else if (patch.submittedAt !== undefined) {
    push("submitted_at", patch.submittedAt);
  }

  push("updated_at", now);

  await db.execute(`UPDATE dev_tasks SET ${sets.join(", ")} WHERE id = $${idx}`, [...values, id]);
  await updateProjectProgress(projectId);
}

export async function deleteDevTask(id: string): Promise<void> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT project_id FROM dev_tasks WHERE id = $1",
    [id]
  );
  const projectId = rows[0]?.project_id as string;

  await db.execute("DELETE FROM dev_tasks WHERE id = $1", [id]);
  if (projectId) await updateProjectProgress(projectId);
}

export async function moveDevTask(id: string, newStatus: TaskStatus, newOrderIndex: number): Promise<void> {
  await tablesReady();
  const db = await getDb();
  const currentRows = await db.select<Record<string, unknown>[]>(
    "SELECT project_id, status, order_index, draft_completed_at, qa_completed_at, submitted_at FROM dev_tasks WHERE id = $1",
    [id]
  );
  const current = currentRows[0];
  if (!current) return;

  const projectId = current.project_id as string;
  const oldStatus = normalizeTaskStatus(current.status);
  const oldOrderIndex = toNumber(current.order_index);
  const now = new Date().toISOString();

  const patchColumns = ["status = $1", "order_index = $2", "updated_at = $3"];
  const patchValues: unknown[] = [newStatus, newOrderIndex, now];
  let idx = 4;

  if (newStatus === "draftDone" && !(current.draft_completed_at as string)) {
    patchColumns.push(`draft_completed_at = $${idx++}`);
    patchValues.push(now);
  }
  if (
    (newStatus === "readyToSubmit" || newStatus === "submitted" || newStatus === "archived") &&
    !(current.qa_completed_at as string)
  ) {
    patchColumns.push(`qa_completed_at = $${idx++}`);
    patchValues.push(now);
  }
  if ((newStatus === "submitted" || newStatus === "archived") && !(current.submitted_at as string)) {
    patchColumns.push(`submitted_at = $${idx++}`);
    patchValues.push(now);
  }

  await db.execute(
    `UPDATE dev_tasks SET ${patchColumns.join(", ")} WHERE id = $${idx}`,
    [...patchValues, id]
  );

  if (oldStatus !== newStatus) {
    await db.execute(
      `UPDATE dev_tasks SET order_index = order_index - 1, updated_at = $1
       WHERE project_id = $2 AND status = $3 AND order_index > $4`,
      [now, projectId, oldStatus, oldOrderIndex]
    );
  }

  await db.execute(
    `UPDATE dev_tasks SET order_index = order_index + 1, updated_at = $1
     WHERE project_id = $2 AND status = $3 AND order_index >= $4 AND id != $5`,
    [now, projectId, newStatus, newOrderIndex, id]
  );

  await updateProjectProgress(projectId);
}

export async function batchUpdateTaskOrder(updates: TaskOrderUpdate[]): Promise<void> {
  await tablesReady();
  const db = await getDb();
  const now = new Date().toISOString();

  for (const update of updates) {
    await db.execute(
      `UPDATE dev_tasks SET status = $1, order_index = $2, updated_at = $3 WHERE id = $4`,
      [update.status, update.orderIndex, now, update.id]
    );
  }
}

export async function getDevStats(): Promise<DevStats> {
  await tablesReady();
  const [projects, summaries] = await Promise.all([listDevProjects(), listDevProjectSummaries()]);
  const db = await getDb();
  const taskRows = await db.select<Record<string, unknown>[]>("SELECT * FROM dev_tasks");
  const tasks = taskRows.map(mapTaskRow);

  const today = new Date().toISOString().slice(0, 10);
  const overdueDeliverables = tasks.filter(
    task => task.status !== "submitted" && task.status !== "archived" && task.dueDate && task.dueDate < today
  ).length;

  return {
    totalProjects: projects.length,
    activeProjects: projects.filter(project => project.status === "planning" || project.status === "inProgress").length,
    completedProjects: projects.filter(project => project.status === "completed").length,
    overdueDeliverables,
    readyToSubmitDeliverables: tasks.filter(task => task.status === "readyToSubmit").length,
    qaDeliverables: tasks.filter(task => task.status === "qaReview").length,
    missingKeyDeliverables: summaries.filter(summary => summary.slidesCount === 0 || summary.labCount === 0).length,
  };
}

export function getProjectMissingDeliverables(summary: Pick<DevProjectSummaryRecord, "slidesCount" | "labCount">) {
  return KEY_DELIVERABLES.filter(type => {
    if (type === "slides") return summary.slidesCount === 0;
    return summary.labCount === 0;
  });
}
