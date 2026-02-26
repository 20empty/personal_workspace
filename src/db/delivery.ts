import { getDb } from "./client";

/* ───────── Types ───────── */

export type ClassType = "overseas" | "domestic" | "centralized";

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  overseas: "海外出差培训",
  domestic: "国内出差培训",
  centralized: "集中培训",
};

export type DeliveryClassInput = {
  title: string;
  code: string;
  location: string;
  startDate: string;
  endDate: string;
  classType?: ClassType;
  learners?: number;
  status?: string;
  stage?: string;
  progress?: number;
  nextSession?: string;
  focus?: string[];
  archiveState?: string;
  notes?: string | null;
};

export type DeliveryClassRecord = {
  id: string;
  code: string;
  title: string;
  location: string;
  status: string;
  stage: string;
  classType: ClassType;
  startDate: string;
  endDate: string;
  learners: number;
  progress: number;
  nextSession: string;
  focus: string[];
  archiveState: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SopTaskRecord = {
  id: string;
  classId: string;
  stage: string;        // "pre" | "during" | "post"
  title: string;
  status: string;       // "pending" | "completed"
  orderIndex: number;
  createdAt: string;
};

export type CourseRecord = {
  id: string;
  classId: string;
  name: string;
  days: string;
  startDate: string;
  endDate: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

/* ───────── Helpers ───────── */

const parseFocus = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
};

const serializeFocus = (value?: string[]): string =>
  JSON.stringify(value ?? []);

const mapRow = (row: Record<string, unknown>): DeliveryClassRecord => ({
  id: row.id as string,
  code: row.code as string,
  title: row.title as string,
  location: row.location as string,
  status: row.status as string,
  stage: row.stage as string,
  classType: (row.class_type as ClassType) ?? "centralized",
  startDate: row.start_date as string,
  endDate: row.end_date as string,
  learners: (row.learners as number) ?? 0,
  progress: (row.progress as number) ?? 0,
  nextSession: (row.next_session as string) ?? "待确认",
  focus: parseFocus(row.focus),
  archiveState: (row.archive_state as string) ?? "待归档",
  notes: (row.notes as string) ?? null,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const mapSopRow = (row: Record<string, unknown>): SopTaskRecord => ({
  id: row.id as string,
  classId: row.class_id as string,
  stage: row.stage as string,
  title: row.title as string,
  status: row.status as string,
  orderIndex: (row.order_index as number) ?? 0,
  createdAt: row.created_at as string,
});

const mapCourseRow = (row: Record<string, unknown>): CourseRecord => ({
  id: row.id as string,
  classId: row.class_id as string,
  name: row.name as string,
  days: row.days as string,
  startDate: row.start_date as string,
  endDate: row.end_date as string,
  orderIndex: (row.order_index as number) ?? 0,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

/* ───────── SOP Templates ───────── */

type SopItem = { stage: string; title: string };

const COMMON_TASKS: SopItem[] = [
  { stage: "pre", title: "建群及通知" },
  { stage: "pre", title: "收集学员基础信息" },
  { stage: "pre", title: "开营仪式准备" },
  { stage: "during", title: "每日考勤" },
  { stage: "during", title: "课堂记录/答疑汇总" },
  { stage: "during", title: "阶段性测验/作业跟进" },
  { stage: "post", title: "收集课程反馈" },
  { stage: "post", title: "发放结业证书" },
  { stage: "post", title: "讲师课程复盘报告" },
];

const OVERSEAS_TASKS: SopItem[] = [
  { stage: "pre", title: "办理签证及机票及当地住宿行程确认" },
  { stage: "pre", title: "跨国网络/授课环境(VPN等)测试" },
  { stage: "pre", title: "跨文化注意事项及当地风俗确认" },
  { stage: "during", title: "每日工作日报及跨时区同步汇报" },
  { stage: "post", title: "差旅报销结算" },
  { stage: "post", title: "海外培训特殊档案归档" },
];

const DOMESTIC_TASKS: SopItem[] = [
  { stage: "pre", title: "高铁/机票及当地住宿安排" },
  { stage: "pre", title: "场地设备提前一天到场测试" },
  { stage: "post", title: "差旅报销结算" },
];

const CENTRALIZED_TASKS: SopItem[] = [
  { stage: "pre", title: "确认学员差旅及集中住宿安排" },
  { stage: "pre", title: "确认主讲教室及分组讨论室预订" },
  { stage: "pre", title: "接机/接站安排（可选）" },
  { stage: "during", title: "集中性破冰活动组织" },
  { stage: "during", title: "晚间辅导/自习安排" },
  { stage: "post", title: "欢送及返程确认" },
];

function getSopTemplate(classType: ClassType): SopItem[] {
  const specific: Record<ClassType, SopItem[]> = {
    overseas: OVERSEAS_TASKS,
    domestic: DOMESTIC_TASKS,
    centralized: CENTRALIZED_TASKS,
  };
  // Merge common + specific, then sort by stage order (pre → during → post)
  const stageOrder: Record<string, number> = { pre: 0, during: 1, post: 2 };
  const merged = [...COMMON_TASKS, ...specific[classType]];
  merged.sort((a, b) => (stageOrder[a.stage] ?? 0) - (stageOrder[b.stage] ?? 0));
  return merged;
}

/* ───────── Ensure Tables Exist ───────── */

async function ensureTables() {
  const db = await getDb();
  // Add class_type column if missing (for existing databases)
  try {
    await db.execute(
      `ALTER TABLE delivery_classes ADD COLUMN class_type TEXT NOT NULL DEFAULT 'centralized'`
    );
  } catch {
    // column already exists – ignore
  }
  await db.execute(`
    CREATE TABLE IF NOT EXISTS delivery_sop_tasks (
      id          TEXT PRIMARY KEY,
      class_id    TEXT NOT NULL,
      stage       TEXT NOT NULL,
      title       TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES delivery_classes(id) ON DELETE CASCADE
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS delivery_courses (
      id          TEXT PRIMARY KEY,
      class_id    TEXT NOT NULL,
      name        TEXT NOT NULL,
      days        TEXT NOT NULL,
      start_date  TEXT NOT NULL,
      end_date    TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES delivery_classes(id) ON DELETE CASCADE
    )
  `);
}

let _tablesReady: Promise<void> | null = null;
function tablesReady() {
  if (!_tablesReady) _tablesReady = ensureTables();
  return _tablesReady;
}

/* ───────── CRUD: Delivery Classes ───────── */

export async function listDeliveryClasses(): Promise<DeliveryClassRecord[]> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM delivery_classes ORDER BY start_date DESC"
  );
  return rows.map(mapRow);
}

export async function getDeliveryClass(
  id: string
): Promise<DeliveryClassRecord | null> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM delivery_classes WHERE id = $1",
    [id]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createDeliveryClass(
  input: DeliveryClassInput
): Promise<string> {
  await tablesReady();
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const classType = input.classType ?? "centralized";
  await db.execute(
    `INSERT INTO delivery_classes
       (id, code, title, location, status, stage, class_type, start_date, end_date,
        learners, progress, next_session, focus, archive_state, notes,
        created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      id,
      input.code,
      input.title,
      input.location,
      input.status ?? "已排期",
      input.stage ?? "upcoming",
      classType,
      input.startDate,
      input.endDate,
      input.learners ?? 0,
      input.progress ?? 0,
      input.nextSession ?? "待确认",
      serializeFocus(input.focus),
      input.archiveState ?? "待归档",
      input.notes ?? null,
      now,
      now,
    ]
  );

  // Auto-generate SOP tasks from the template
  await seedSopTasksForClass(id, classType);

  return id;
}

export async function updateDeliveryClass(
  id: string,
  patch: Partial<DeliveryClassInput>
): Promise<void> {
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
  if (patch.location !== undefined) push("location", patch.location);
  if (patch.status !== undefined) push("status", patch.status);
  if (patch.stage !== undefined) push("stage", patch.stage);
  if (patch.classType !== undefined) push("class_type", patch.classType);
  if (patch.startDate !== undefined) push("start_date", patch.startDate);
  if (patch.endDate !== undefined) push("end_date", patch.endDate);
  if (patch.learners !== undefined) push("learners", patch.learners);
  if (patch.progress !== undefined) push("progress", patch.progress);
  if (patch.nextSession !== undefined) push("next_session", patch.nextSession);
  if (patch.focus !== undefined) push("focus", serializeFocus(patch.focus));
  if (patch.archiveState !== undefined)
    push("archive_state", patch.archiveState);
  if (patch.notes !== undefined) push("notes", patch.notes ?? null);

  push("updated_at", new Date().toISOString());

  await db.execute(
    `UPDATE delivery_classes SET ${sets.join(", ")} WHERE id = $${idx}`,
    [...values, id]
  );
}

export async function deleteDeliveryClass(id: string): Promise<void> {
  await tablesReady();
  const db = await getDb();
  // Delete associated records first
  await db.execute("DELETE FROM delivery_courses WHERE class_id = $1", [id]);
  await db.execute("DELETE FROM delivery_sop_tasks WHERE class_id = $1", [id]);
  await db.execute("DELETE FROM delivery_classes WHERE id = $1", [id]);
}

/* ───────── CRUD: SOP Tasks ───────── */

export async function getSopTasksByClassId(
  classId: string
): Promise<SopTaskRecord[]> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM delivery_sop_tasks WHERE class_id = $1 ORDER BY order_index ASC",
    [classId]
  );
  return rows.map(mapSopRow);
}

export async function toggleSopTaskStatus(
  taskId: string,
  newStatus: string
): Promise<void> {
  await tablesReady();
  const db = await getDb();
  await db.execute(
    "UPDATE delivery_sop_tasks SET status = $1 WHERE id = $2",
    [newStatus, taskId]
  );
}

/**
 * Seed SOP tasks for a class. If tasks already exist for the class, skip.
 */
export async function seedSopTasksForClass(
  classId: string,
  classType: ClassType
): Promise<void> {
  const db = await getDb();
  const existing = await db.select<Record<string, unknown>[]>(
    "SELECT COUNT(*) as cnt FROM delivery_sop_tasks WHERE class_id = $1",
    [classId]
  );
  const count = (existing[0]?.cnt as number) ?? 0;
  if (count > 0) return; // already seeded

  const template = getSopTemplate(classType);
  const now = new Date().toISOString();
  for (let i = 0; i < template.length; i++) {
    const item = template[i];
    const taskId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO delivery_sop_tasks (id, class_id, stage, title, status, order_index, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [taskId, classId, item.stage, item.title, "pending", i, now]
    );
  }
}

/* ───────── CRUD: Courses ───────── */

export async function getCoursesByClassId(
  classId: string
): Promise<CourseRecord[]> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM delivery_courses WHERE class_id = $1 ORDER BY start_date ASC, order_index ASC",
    [classId]
  );
  return rows.map(mapCourseRow);
}

export async function createDeliveryCourse(
  input: Omit<CourseRecord, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  await tablesReady();
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO delivery_courses
       (id, class_id, name, days, start_date, end_date, order_index, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      input.classId,
      input.name,
      input.days,
      input.startDate,
      input.endDate,
      input.orderIndex,
      now,
      now,
    ]
  );
  return id;
}

export async function deleteDeliveryCourse(id: string): Promise<void> {
  await tablesReady();
  const db = await getDb();
  await db.execute("DELETE FROM delivery_courses WHERE id = $1", [id]);
}
