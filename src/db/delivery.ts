import { getDb } from "./client";

/* ───────── Types ───────── */

export type ClassType = "overseas" | "domestic" | "centralized" | "online";

// Re-exported from CreateClassModal for use by DeliveryManager
export type SelectedCourse = {
    templateId: string;
    name: string;
    level: string;
    days: number;
    startDate: string;
    endDate: string;
};

export type CreatePayload = Omit<DeliveryClassRecord, "id" | "createdAt" | "updatedAt"> & {
    courses?: SelectedCourse[];
};

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  overseas: "海外出差培训",
  domestic: "国内出差培训",
  centralized: "集中培训",
  online: "在线培训",
};

export type DeliveryClassInput = {
  title: string;
  code: string;
  contractNo?: string;
  location: string;
  startDate: string;
  endDate: string;
  classType?: ClassType;
  learners?: number;
  teacherPo?: number;
  projectSupportPo?: number;
  headteacherPo?: number;
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
  contractNo: string;
  title: string;
  location: string;
  status: string;
  stage: string;
  classType: ClassType;
  startDate: string;
  endDate: string;
  learners: number;
  teacherPo: number;
  projectSupportPo: number;
  headteacherPo: number;
  progress: number;
  nextSession?: string;
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
  courseTemplateId: string | null;
  name: string;
  level: string; // "L2" | "L3" | "L4"
  days: string;
  startDate: string;
  endDate: string;
  schedulePath: string | null;
  schedulePreviewPath: string | null;
  scheduleFileName: string | null;
  scheduleFileType: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type SopTemplateRecord = {
  id: string;
  classType: ClassType;
  stage: string;
  title: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type CourseTemplateRecord = {
  id: string;
  name: string;
  level: string;
  days: string;
  schedulePath: string | null;
  schedulePreviewPath: string | null;
  scheduleFileName: string | null;
  scheduleFileType: string | null;
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
  contractNo: (row.contract_no as string) ?? "",
  title: row.title as string,
  location: row.location as string,
  status: row.status as string,
  stage: row.stage as string,
  classType: (row.class_type as ClassType) ?? "centralized",
  startDate: row.start_date as string,
  endDate: row.end_date as string,
  learners: (row.learners as number) ?? 0,
  teacherPo: toNumber(row.teacher_po),
  projectSupportPo: toNumber(row.project_support_po),
  headteacherPo: toNumber(row.headteacher_po),
  progress: (row.progress as number) ?? 0,
  nextSession: (row.next_session as string) ?? undefined,
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
  courseTemplateId: (row.course_template_id as string) ?? null,
  name: row.name as string,
  level: (row.level as string) ?? "L2",
  days: row.days as string,
  startDate: row.start_date as string,
  endDate: row.end_date as string,
  schedulePath: (row.schedule_path as string) ?? null,
  schedulePreviewPath: (row.schedule_preview_path as string) ?? null,
  scheduleFileName: (row.schedule_file_name as string) ?? null,
  scheduleFileType: (row.schedule_file_type as string) ?? null,
  orderIndex: (row.order_index as number) ?? 0,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const mapSopTemplateRow = (row: Record<string, unknown>): SopTemplateRecord => ({
  id: row.id as string,
  classType: (row.class_type as ClassType) ?? "centralized",
  stage: row.stage as string,
  title: row.title as string,
  orderIndex: toNumber(row.order_index),
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const mapCourseTemplateRow = (row: Record<string, unknown>): CourseTemplateRecord => ({
  id: row.id as string,
  name: row.name as string,
  level: (row.level as string) ?? "L2",
  days: row.days as string,
  schedulePath: (row.schedule_path as string) ?? null,
  schedulePreviewPath: (row.schedule_preview_path as string) ?? null,
  scheduleFileName: (row.schedule_file_name as string) ?? null,
  scheduleFileType: (row.schedule_file_type as string) ?? null,
  orderIndex: toNumber(row.order_index),
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

const ONLINE_TASKS: SopItem[] = [
  { stage: "pre", title: "确认直播平台与会议链接" },
  { stage: "pre", title: "完成讲师及学员设备联调测试" },
  { stage: "pre", title: "发送线上参训指引与课堂规则" },
  { stage: "during", title: "监控在线签到与到课情况" },
  { stage: "during", title: "处理实时互动与技术支持问题" },
  { stage: "during", title: "录屏与课堂资料同步留档" },
  { stage: "post", title: "整理回放链接与课件资料" },
  { stage: "post", title: "收集线上学习反馈与完课数据" },
];

function getDefaultSopTemplate(classType: ClassType): SopItem[] {
  const specific: Record<ClassType, SopItem[]> = {
    overseas: OVERSEAS_TASKS,
    domestic: DOMESTIC_TASKS,
    centralized: CENTRALIZED_TASKS,
    online: ONLINE_TASKS,
  };
  // Merge common + specific, then sort by stage order (pre → during → post)
  const stageOrder: Record<string, number> = { pre: 0, during: 1, post: 2 };
  const merged = [...COMMON_TASKS, ...specific[classType]];
  merged.sort((a, b) => (stageOrder[a.stage] ?? 0) - (stageOrder[b.stage] ?? 0));
  return merged;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value) || 0;
  return 0;
}

/* ───────── Ensure Tables Exist ───────── */

type DeliveryDb = Awaited<ReturnType<typeof getDb>>;

async function getTableColumnNames(db: DeliveryDb, table: string): Promise<Set<string>> {
  const rows = await db.select<Record<string, unknown>[]>(`PRAGMA table_info(${table})`);
  return new Set(rows.map((row) => row.name as string));
}

async function addColumnsIfMissing(
  db: DeliveryDb,
  table: string,
  columns: Array<[name: string, definition: string]>
) {
  const existing = await getTableColumnNames(db, table);
  for (const [name, definition] of columns) {
    if (!existing.has(name)) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    }
  }
}

async function ensureLegacyDeliverySchema(db: DeliveryDb) {
  await addColumnsIfMissing(db, "delivery_classes", [
    ["class_type", "TEXT NOT NULL DEFAULT 'centralized'"],
    ["teacher_po", "INTEGER NOT NULL DEFAULT 0"],
    ["headteacher_po", "INTEGER NOT NULL DEFAULT 0"],
    ["project_support_po", "INTEGER NOT NULL DEFAULT 0"],
    ["contract_no", "TEXT NOT NULL DEFAULT ''"],
  ]);

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
      course_template_id TEXT,
      name        TEXT NOT NULL,
      level       TEXT NOT NULL DEFAULT 'L2',
      days        TEXT NOT NULL,
      start_date  TEXT NOT NULL,
      end_date    TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES delivery_classes(id) ON DELETE CASCADE
    )
  `);
  await addColumnsIfMissing(db, "delivery_courses", [
    ["level", "TEXT NOT NULL DEFAULT 'L2'"],
    ["course_template_id", "TEXT"],
  ]);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS delivery_sop_templates (
      id          TEXT PRIMARY KEY,
      class_type  TEXT NOT NULL,
      stage       TEXT NOT NULL,
      title       TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS delivery_course_templates (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      level       TEXT NOT NULL DEFAULT 'L2',
      days        TEXT NOT NULL,
      schedule_path TEXT,
      schedule_preview_path TEXT,
      schedule_file_name TEXT,
      schedule_file_type TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await addColumnsIfMissing(db, "delivery_course_templates", [
    ["schedule_path", "TEXT"],
    ["schedule_preview_path", "TEXT"],
    ["schedule_file_name", "TEXT"],
    ["schedule_file_type", "TEXT"],
  ]);

  await db.execute("CREATE INDEX IF NOT EXISTS idx_delivery_courses_class_id ON delivery_courses(class_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_delivery_sop_tasks_class_id ON delivery_sop_tasks(class_id)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_delivery_classes_stage ON delivery_classes(stage)");
}

async function ensureDefaultSopTemplates(db: DeliveryDb) {
  const classTypes: ClassType[] = ["overseas", "domestic", "centralized", "online"];
  const ensureTemplatesForClassType = async (classType: ClassType) => {
    const existingTemplates = await db.select<Record<string, unknown>[]>(
      "SELECT COUNT(*) as cnt FROM delivery_sop_templates WHERE class_type = $1",
      [classType]
    );
    if (toNumber(existingTemplates[0]?.cnt) > 0) return;

    const now = new Date().toISOString();
    const stageOrderCounter: Record<string, number> = {
      pre: 0,
      during: 0,
      post: 0,
    };
    for (const item of getDefaultSopTemplate(classType)) {
      const orderIndex = stageOrderCounter[item.stage] ?? 0;
      stageOrderCounter[item.stage] = orderIndex + 1;
      await db.execute(
        `INSERT INTO delivery_sop_templates
           (id, class_type, stage, title, order_index, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [crypto.randomUUID(), classType, item.stage, item.title, orderIndex, now, now]
      );
    }
  };

  for (const classType of classTypes) {
    await ensureTemplatesForClassType(classType);
  }
}

async function ensureTables() {
  const db = await getDb();
  await ensureLegacyDeliverySchema(db);
  await ensureDefaultSopTemplates(db);
}

let _tablesReady: Promise<void> | null = null;
function tablesReady() {
  if (!_tablesReady) _tablesReady = ensureTables();
  return _tablesReady;
}

async function ensureCourseTemplateSchedulePathColumn(_db: DeliveryDb) {
  // Schema is handled by Tauri migrations plus the legacy compatibility pass in ensureTables().
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
       (id, code, contract_no, title, location, status, stage, class_type, start_date, end_date,
        learners, teacher_po, project_support_po, headteacher_po, progress, next_session, focus, archive_state, notes,
        created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      id,
      input.code,
      input.contractNo ?? "",
      input.title,
      input.location,
      input.status ?? "已排期",
      input.stage ?? "upcoming",
      classType,
      input.startDate,
      input.endDate,
      input.learners ?? 0,
      input.teacherPo ?? 0,
      input.projectSupportPo ?? 0,
      input.headteacherPo ?? 0,
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
  if (patch.contractNo !== undefined) push("contract_no", patch.contractNo);
  if (patch.title !== undefined) push("title", patch.title);
  if (patch.location !== undefined) push("location", patch.location);
  if (patch.status !== undefined) push("status", patch.status);
  if (patch.stage !== undefined) push("stage", patch.stage);
  if (patch.classType !== undefined) push("class_type", patch.classType);
  if (patch.startDate !== undefined) push("start_date", patch.startDate);
  if (patch.endDate !== undefined) push("end_date", patch.endDate);
  if (patch.learners !== undefined) push("learners", patch.learners);
  if (patch.teacherPo !== undefined) push("teacher_po", patch.teacherPo);
  if (patch.projectSupportPo !== undefined) push("project_support_po", patch.projectSupportPo);
  if (patch.headteacherPo !== undefined) push("headteacher_po", patch.headteacherPo);
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

export async function completeAllSopTasksByClassId(classId: string): Promise<void> {
  await tablesReady();
  const db = await getDb();
  await db.execute(
    "UPDATE delivery_sop_tasks SET status = 'completed' WHERE class_id = $1",
    [classId]
  );
}

/**
 * Seed SOP tasks for a class. If tasks already exist for the class, skip.
 */
export async function seedSopTasksForClass(
  classId: string,
  classType: ClassType
): Promise<void> {
  await tablesReady();
  const db = await getDb();
  const existing = await db.select<Record<string, unknown>[]>(
    "SELECT COUNT(*) as cnt FROM delivery_sop_tasks WHERE class_id = $1",
    [classId]
  );
  const count = toNumber(existing[0]?.cnt);
  if (count > 0) return; // already seeded

  const templateRows = await db.select<Record<string, unknown>[]>(
    `SELECT stage, title FROM delivery_sop_templates
      WHERE class_type = $1
      ORDER BY
        CASE stage
          WHEN 'pre' THEN 0
          WHEN 'during' THEN 1
          WHEN 'post' THEN 2
          ELSE 99
        END ASC,
        order_index ASC`,
    [classType]
  );
  const template = templateRows.map((row) => ({
    stage: row.stage as string,
    title: row.title as string,
  }));
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

async function normalizeTemplateStageOrder(classType: ClassType, stage: string) {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT id FROM delivery_sop_templates
      WHERE class_type = $1 AND stage = $2
      ORDER BY order_index ASC, created_at ASC`,
    [classType, stage]
  );
  const now = new Date().toISOString();
  for (let i = 0; i < rows.length; i++) {
    await db.execute(
      "UPDATE delivery_sop_templates SET order_index = $1, updated_at = $2 WHERE id = $3",
      [i, now, rows[i].id as string]
    );
  }
}

export async function listSopTemplatesByClassType(
  classType: ClassType
): Promise<SopTemplateRecord[]> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT * FROM delivery_sop_templates
      WHERE class_type = $1
      ORDER BY
        CASE stage
          WHEN 'pre' THEN 0
          WHEN 'during' THEN 1
          WHEN 'post' THEN 2
          ELSE 99
        END ASC,
        order_index ASC`,
    [classType]
  );
  return rows.map(mapSopTemplateRow);
}

export async function createSopTemplate(input: {
  classType: ClassType;
  stage: string;
  title: string;
}): Promise<string> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT COUNT(*) as cnt FROM delivery_sop_templates WHERE class_type = $1 AND stage = $2",
    [input.classType, input.stage]
  );
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO delivery_sop_templates
       (id, class_type, stage, title, order_index, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, input.classType, input.stage, input.title, toNumber(rows[0]?.cnt), now, now]
  );
  return id;
}

export async function deleteSopTemplate(id: string): Promise<void> {
  await tablesReady();
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT class_type, stage FROM delivery_sop_templates WHERE id = $1",
    [id]
  );
  if (!rows[0]) return;
  const classType = (rows[0].class_type as ClassType) ?? "centralized";
  const stage = rows[0].stage as string;
  await db.execute("DELETE FROM delivery_sop_templates WHERE id = $1", [id]);
  await normalizeTemplateStageOrder(classType, stage);
}

export async function moveSopTemplate(
  id: string,
  direction: "up" | "down"
): Promise<void> {
  await tablesReady();
  const db = await getDb();
  const currentRows = await db.select<Record<string, unknown>[]>(
    "SELECT id, class_type, stage, order_index FROM delivery_sop_templates WHERE id = $1",
    [id]
  );
  const current = currentRows[0];
  if (!current) return;

  const classType = (current.class_type as ClassType) ?? "centralized";
  const stage = current.stage as string;
  const currentOrder = toNumber(current.order_index);

  const targetRows = await db.select<Record<string, unknown>[]>(
    direction === "up"
      ? `SELECT id, order_index FROM delivery_sop_templates
          WHERE class_type = $1 AND stage = $2 AND order_index < $3
          ORDER BY order_index DESC
          LIMIT 1`
      : `SELECT id, order_index FROM delivery_sop_templates
          WHERE class_type = $1 AND stage = $2 AND order_index > $3
          ORDER BY order_index ASC
          LIMIT 1`,
    [classType, stage, currentOrder]
  );
  const target = targetRows[0];
  if (!target) return;

  const now = new Date().toISOString();
  await db.execute(
    "UPDATE delivery_sop_templates SET order_index = $1, updated_at = $2 WHERE id = $3",
    [toNumber(target.order_index), now, id]
  );
  await db.execute(
    "UPDATE delivery_sop_templates SET order_index = $1, updated_at = $2 WHERE id = $3",
    [currentOrder, now, target.id as string]
  );
  await normalizeTemplateStageOrder(classType, stage);
}

/* ───────── CRUD: Courses ───────── */

export async function getCoursesByClassId(
  classId: string
): Promise<CourseRecord[]> {
  await tablesReady();
  const db = await getDb();
  await ensureCourseTemplateSchedulePathColumn(db);
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT
       c.*,
       tpl.schedule_path,
       tpl.schedule_preview_path,
       tpl.schedule_file_name,
       tpl.schedule_file_type
     FROM delivery_courses c
     LEFT JOIN delivery_course_templates tpl ON tpl.id = c.course_template_id
     WHERE c.class_id = $1
     ORDER BY c.start_date ASC, c.order_index ASC`,
    [classId]
  );
  return rows.map(mapCourseRow);
}

export async function listCoursesByClassIds(
  classIds: string[]
): Promise<CourseRecord[]> {
  if (classIds.length === 0) return [];
  await tablesReady();
  const db = await getDb();
  await ensureCourseTemplateSchedulePathColumn(db);
  const placeholders = classIds.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT
       c.*,
       tpl.schedule_path,
       tpl.schedule_preview_path,
       tpl.schedule_file_name,
       tpl.schedule_file_type
     FROM delivery_courses c
     LEFT JOIN delivery_course_templates tpl ON tpl.id = c.course_template_id
     WHERE c.class_id IN (${placeholders})
     ORDER BY c.start_date ASC, c.order_index ASC`,
    classIds
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

  // Validate input to avoid cryptic DB errors
  if (!input.classId || !input.name) {
    throw new Error("Missing classId or name for course");
  }

  const sql = `
    INSERT INTO delivery_courses 
    (id, class_id, course_template_id, name, level, days, start_date, end_date, order_index, created_at, updated_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `;

  await db.execute(sql, [
    id,
    input.classId,
    input.courseTemplateId,
    input.name,
    input.level ?? "L2",
    input.days,
    input.startDate,
    input.endDate,
    input.orderIndex ?? 0,
    now,
    now,
  ]);
  return id;
}

export async function deleteDeliveryCourse(id: string): Promise<void> {
  await tablesReady();
  const db = await getDb();
  await db.execute("DELETE FROM delivery_courses WHERE id = $1", [id]);
}

export async function updateDeliveryCourse(
  id: string,
  patch: Partial<Omit<CourseRecord, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await tablesReady();
  const db = await getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (patch.classId !== undefined) { sets.push(`class_id = $${idx++}`); values.push(patch.classId); }
  if (patch.courseTemplateId !== undefined) { sets.push(`course_template_id = $${idx++}`); values.push(patch.courseTemplateId); }
  if (patch.name !== undefined) { sets.push(`name = $${idx++}`); values.push(patch.name); }
  if (patch.level !== undefined) { sets.push(`level = $${idx++}`); values.push(patch.level); }
  if (patch.days !== undefined) { sets.push(`days = $${idx++}`); values.push(patch.days); }
  if (patch.startDate !== undefined) { sets.push(`start_date = $${idx++}`); values.push(patch.startDate); }
  if (patch.endDate !== undefined) { sets.push(`end_date = $${idx++}`); values.push(patch.endDate); }
  if (patch.orderIndex !== undefined) { sets.push(`order_index = $${idx++}`); values.push(patch.orderIndex); }
  if (patch.schedulePath !== undefined) { sets.push(`schedule_path = $${idx++}`); values.push(patch.schedulePath); }
  if (patch.schedulePreviewPath !== undefined) { sets.push(`schedule_preview_path = $${idx++}`); values.push(patch.schedulePreviewPath); }
  if (patch.scheduleFileName !== undefined) { sets.push(`schedule_file_name = $${idx++}`); values.push(patch.scheduleFileName); }
  if (patch.scheduleFileType !== undefined) { sets.push(`schedule_file_type = $${idx++}`); values.push(patch.scheduleFileType); }

  if (sets.length === 0) return;

  sets.push(`updated_at = $${idx++}`);
  values.push(new Date().toISOString());

  values.push(id);
  await db.execute(
    `UPDATE delivery_courses SET ${sets.join(", ")} WHERE id = $${idx}`,
    values
  );
}

/* ───────── CRUD: Course Templates ───────── */

export async function listCourseTemplates(): Promise<CourseTemplateRecord[]> {
  await tablesReady();
  const db = await getDb();
  await ensureCourseTemplateSchedulePathColumn(db);
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM delivery_course_templates ORDER BY order_index ASC, created_at ASC"
  );
  return rows.map(mapCourseTemplateRow);
}

export async function createCourseTemplate(input: {
  id?: string;
  name: string;
  level: string;
  days: string;
  schedulePath?: string | null;
  schedulePreviewPath?: string | null;
  scheduleFileName?: string | null;
  scheduleFileType?: string | null;
}): Promise<string> {
  await tablesReady();
  const db = await getDb();
  await ensureCourseTemplateSchedulePathColumn(db);
  const id = input.id ?? crypto.randomUUID();
  const now = new Date().toISOString();

  const countRow = await db.select<Record<string, unknown>[]>(
    "SELECT COUNT(*) as cnt FROM delivery_course_templates"
  );
  const nextOrder = toNumber(countRow[0]?.cnt);

  await db.execute(
    `INSERT INTO delivery_course_templates 
     (id, name, level, days, schedule_path, schedule_preview_path, schedule_file_name, schedule_file_type, order_index, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      input.name,
      input.level,
      input.days,
      input.schedulePath ?? null,
      input.schedulePreviewPath ?? null,
      input.scheduleFileName ?? null,
      input.scheduleFileType ?? null,
      nextOrder,
      now,
      now,
    ]
  );
  return id;
}

export async function updateCourseTemplate(
  id: string,
  patch: Partial<Omit<CourseTemplateRecord, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await tablesReady();
  const db = await getDb();
  await ensureCourseTemplateSchedulePathColumn(db);
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (patch.name !== undefined) {
    sets.push(`name = $${idx++}`);
    values.push(patch.name);
  }
  if (patch.level !== undefined) {
    sets.push(`level = $${idx++}`);
    values.push(patch.level);
  }
  if (patch.days !== undefined) {
    sets.push(`days = $${idx++}`);
    values.push(patch.days);
  }
  if (patch.schedulePath !== undefined) {
    sets.push(`schedule_path = $${idx++}`);
    values.push(patch.schedulePath);
  }
  if (patch.schedulePreviewPath !== undefined) {
    sets.push(`schedule_preview_path = $${idx++}`);
    values.push(patch.schedulePreviewPath);
  }
  if (patch.scheduleFileName !== undefined) {
    sets.push(`schedule_file_name = $${idx++}`);
    values.push(patch.scheduleFileName);
  }
  if (patch.scheduleFileType !== undefined) {
    sets.push(`schedule_file_type = $${idx++}`);
    values.push(patch.scheduleFileType);
  }
  if (patch.orderIndex !== undefined) {
    sets.push(`order_index = $${idx++}`);
    values.push(patch.orderIndex);
  }

  if (sets.length === 0) return;

  sets.push(`updated_at = $${idx++}`);
  values.push(new Date().toISOString());

  await db.execute(
    `UPDATE delivery_course_templates SET ${sets.join(", ")} WHERE id = $${idx}`,
    [...values, id]
  );
}

export async function deleteCourseTemplate(id: string): Promise<void> {
  await tablesReady();
  const db = await getDb();
  await db.execute("DELETE FROM delivery_course_templates WHERE id = $1", [id]);
}
