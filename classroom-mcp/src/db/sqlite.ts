import BetterSqlite3 from "better-sqlite3";
import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { DATABASE_PATH } from "../config.js";
import type {
  ClassType,
  DeliveryClassInput,
  DeliveryClassRecord,
  CourseRecord,
  SopTaskRecord,
  SopTemplateRecord,
} from "./schema.js";

type Database = BetterSqlite3.Database;

// ───────── Database Connection ─────────

let _db: Database | null = null;

function getDb(): Database {
  if (!_db) {
    mkdirSync(dirname(DATABASE_PATH), { recursive: true });
    _db = new BetterSqlite3(DATABASE_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

// ───────── Helpers ─────────

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value) || 0;
  return 0;
}

function parseFocus(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

function serializeFocus(value?: string[]): string {
  return JSON.stringify(value ?? []);
}

function mapRow(row: Record<string, unknown>): DeliveryClassRecord {
  return {
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
  };
}

function mapCourseRow(row: Record<string, unknown>): CourseRecord {
  return {
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
    orderIndex: toNumber(row.order_index),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapSopRow(row: Record<string, unknown>): SopTaskRecord {
  return {
    id: row.id as string,
    classId: row.class_id as string,
    stage: row.stage as string,
    title: row.title as string,
    status: row.status as string,
    orderIndex: toNumber(row.order_index),
    createdAt: row.created_at as string,
  };
}

function mapSopTemplateRow(row: Record<string, unknown>): SopTemplateRecord {
  return {
    id: row.id as string,
    classType: (row.class_type as ClassType) ?? "centralized",
    stage: row.stage as string,
    title: row.title as string,
    orderIndex: toNumber(row.order_index),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ───────── SOP Template Items ─────────

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
  const stageOrder: Record<string, number> = { pre: 0, during: 1, post: 2 };
  const merged = [...COMMON_TASKS, ...specific[classType]];
  merged.sort(
    (a, b) => (stageOrder[a.stage] ?? 0) - (stageOrder[b.stage] ?? 0)
  );
  return merged;
}

// ───────── Ensure Tables Exist ─────────

function ensureTables(): void {
  const db = getDb();

  // delivery_classes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS delivery_classes (
      id                    TEXT PRIMARY KEY,
      code                  TEXT NOT NULL,
      contract_no           TEXT NOT NULL DEFAULT '',
      title                 TEXT NOT NULL,
      location              TEXT NOT NULL,
      status                TEXT NOT NULL,
      stage                 TEXT NOT NULL,
      class_type            TEXT NOT NULL DEFAULT 'centralized',
      start_date            TEXT NOT NULL,
      end_date              TEXT NOT NULL,
      learners              INTEGER NOT NULL DEFAULT 0,
      teacher_po            INTEGER NOT NULL DEFAULT 0,
      project_support_po    INTEGER NOT NULL DEFAULT 0,
      headteacher_po        INTEGER NOT NULL DEFAULT 0,
      progress              INTEGER NOT NULL DEFAULT 0,
      next_session          TEXT NOT NULL DEFAULT '待确认',
      focus                 TEXT NOT NULL DEFAULT '[]',
      archive_state         TEXT NOT NULL DEFAULT '待归档',
      notes                 TEXT,
      created_at            TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // delivery_sop_tasks table
  db.exec(`
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

  // delivery_courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS delivery_courses (
      id                  TEXT PRIMARY KEY,
      class_id            TEXT NOT NULL,
      course_template_id  TEXT,
      name                TEXT NOT NULL,
      level               TEXT NOT NULL DEFAULT 'L2',
      days                TEXT NOT NULL,
      start_date          TEXT NOT NULL,
      end_date            TEXT NOT NULL,
      schedule_path       TEXT,
      schedule_preview_path TEXT,
      schedule_file_name  TEXT,
      schedule_file_type  TEXT,
      order_index         INTEGER NOT NULL DEFAULT 0,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES delivery_classes(id) ON DELETE CASCADE
    )
  `);

  // delivery_sop_templates table
  db.exec(`
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

  // delivery_course_templates table
  db.exec(`
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
    )
  `);

  // Seed SOP templates if not exist
  const classTypes: ClassType[] = ["overseas", "domestic", "centralized", "online"];
  for (const classType of classTypes) {
    const existing = db
      .prepare(
        "SELECT COUNT(*) as cnt FROM delivery_sop_templates WHERE class_type = ?"
      )
      .get(classType) as { cnt: number };
    if (existing.cnt > 0) continue;

    const now = new Date().toISOString();
    const stageOrderCounter: Record<string, number> = { pre: 0, during: 0, post: 0 };
    for (const item of getDefaultSopTemplate(classType)) {
      const orderIndex = stageOrderCounter[item.stage] ?? 0;
      stageOrderCounter[item.stage] = orderIndex + 1;
      db.prepare(
        `INSERT INTO delivery_sop_templates
          (id, class_type, stage, title, order_index, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(randomUUID(), classType, item.stage, item.title, orderIndex, now, now);
    }
  }
}

let _tablesReady = false;
function tablesReady(): void {
  if (!_tablesReady) {
    ensureTables();
    _tablesReady = true;
  }
}

// ───────── CRUD: Delivery Classes ─────────

export function listDeliveryClasses(): DeliveryClassRecord[] {
  tablesReady();
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM delivery_classes ORDER BY start_date DESC")
    .all() as Record<string, unknown>[];
  return rows.map(mapRow);
}

export function getDeliveryClass(id: string): DeliveryClassRecord | null {
  tablesReady();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM delivery_classes WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapRow(row) : null;
}

export function createDeliveryClass(input: DeliveryClassInput): string {
  tablesReady();
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const classType = input.classType ?? "centralized";

  db.prepare(
    `INSERT INTO delivery_classes
      (id, code, contract_no, title, location, status, stage, class_type, start_date, end_date,
       learners, teacher_po, project_support_po, headteacher_po, progress, next_session, focus, archive_state, notes,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
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
    now
  );

  // Auto-generate SOP tasks
  seedSopTasksForClass(id, classType);

  return id;
}

export function updateDeliveryClass(
  id: string,
  patch: Partial<DeliveryClassInput>
): void {
  tablesReady();
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  const push = (col: string, val: unknown) => {
    sets.push(`${col} = ?`);
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
  if (patch.projectSupportPo !== undefined)
    push("project_support_po", patch.projectSupportPo);
  if (patch.headteacherPo !== undefined)
    push("headteacher_po", patch.headteacherPo);
  if (patch.progress !== undefined) push("progress", patch.progress);
  if (patch.nextSession !== undefined)
    push("next_session", patch.nextSession);
  if (patch.focus !== undefined) push("focus", serializeFocus(patch.focus));
  if (patch.archiveState !== undefined)
    push("archive_state", patch.archiveState);
  if (patch.notes !== undefined) push("notes", patch.notes ?? null);

  if (sets.length === 0) return;

  push("updated_at", new Date().toISOString());

  db.prepare(
    `UPDATE delivery_classes SET ${sets.join(", ")} WHERE id = ?`
  ).run(...values, id);
}

export function deleteDeliveryClass(id: string): void {
  tablesReady();
  const db = getDb();
  db.prepare("DELETE FROM delivery_courses WHERE class_id = ?").run(id);
  db.prepare("DELETE FROM delivery_sop_tasks WHERE class_id = ?").run(id);
  db.prepare("DELETE FROM delivery_classes WHERE id = ?").run(id);
}

// ───────── CRUD: SOP Tasks ─────────

export function getSopTasksByClassId(classId: string): SopTaskRecord[] {
  tablesReady();
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM delivery_sop_tasks WHERE class_id = ? ORDER BY order_index ASC"
    )
    .all(classId) as Record<string, unknown>[];
  return rows.map(mapSopRow);
}

export function toggleSopTaskStatus(taskId: string, newStatus: string): void {
  tablesReady();
  const db = getDb();
  db.prepare("UPDATE delivery_sop_tasks SET status = ? WHERE id = ?").run(
    newStatus,
    taskId
  );
}

export function completeAllSopTasksByClassId(classId: string): void {
  tablesReady();
  const db = getDb();
  db.prepare(
    "UPDATE delivery_sop_tasks SET status = 'completed' WHERE class_id = ?"
  ).run(classId);
}

export function seedSopTasksForClass(
  classId: string,
  classType: ClassType
): void {
  tablesReady();
  const db = getDb();

  const existing = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM delivery_sop_tasks WHERE class_id = ?"
    )
    .get(classId) as { cnt: number };
  if (existing.cnt > 0) return;

  const rows = db
    .prepare(
      `SELECT stage, title FROM delivery_sop_templates
        WHERE class_type = ?
        ORDER BY
          CASE stage WHEN 'pre' THEN 0 WHEN 'during' THEN 1 WHEN 'post' THEN 2 ELSE 99 END ASC,
          order_index ASC`
    )
    .all(classType) as { stage: string; title: string }[];

  const now = new Date().toISOString();
  rows.forEach((item, i) => {
    db.prepare(
      `INSERT INTO delivery_sop_tasks (id, class_id, stage, title, status, order_index, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`
    ).run(randomUUID(), classId, item.stage, item.title, i, now);
  });
}

export function listSopTemplatesByClassType(
  classType: ClassType
): SopTemplateRecord[] {
  tablesReady();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM delivery_sop_templates
        WHERE class_type = ?
        ORDER BY
          CASE stage WHEN 'pre' THEN 0 WHEN 'during' THEN 1 WHEN 'post' THEN 2 ELSE 99 END ASC,
          order_index ASC`
    )
    .all(classType) as Record<string, unknown>[];
  return rows.map(mapSopTemplateRow);
}

export function createSopTemplate(input: {
  classType: ClassType;
  stage: string;
  title: string;
}): string {
  tablesReady();
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM delivery_sop_templates WHERE class_type = ? AND stage = ?"
    )
    .get(input.classType, input.stage) as { cnt: number };
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO delivery_sop_templates
       (id, class_type, stage, title, order_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.classType, input.stage, input.title, existing.cnt, now, now);
  return id;
}

export function deleteSopTemplate(id: string): void {
  tablesReady();
  const db = getDb();
  const row = db
    .prepare("SELECT class_type, stage FROM delivery_sop_templates WHERE id = ?")
    .get(id) as { class_type: string; stage: string } | undefined;
  if (!row) return;
  db.prepare("DELETE FROM delivery_sop_templates WHERE id = ?").run(id);
}

export function moveSopTemplate(
  id: string,
  direction: "up" | "down"
): void {
  tablesReady();
  const db = getDb();
  const current = db
    .prepare(
      "SELECT id, class_type, stage, order_index FROM delivery_sop_templates WHERE id = ?"
    )
    .get(id) as
    | { id: string; class_type: ClassType; stage: string; order_index: number }
    | undefined;
  if (!current) return;

  const target = direction === "up"
    ? db
        .prepare(
          `SELECT id, order_index FROM delivery_sop_templates
            WHERE class_type = ? AND stage = ? AND order_index < ?
            ORDER BY order_index DESC LIMIT 1`
        )
        .get(current.class_type, current.stage, current.order_index)
    : db
        .prepare(
          `SELECT id, order_index FROM delivery_sop_templates
            WHERE class_type = ? AND stage = ? AND order_index > ?
            ORDER BY order_index ASC LIMIT 1`
        )
        .get(current.class_type, current.stage, current.order_index);

  if (!target) return;

  const now = new Date().toISOString();
  db.prepare(
    "UPDATE delivery_sop_templates SET order_index = ?, updated_at = ? WHERE id = ?"
  ).run((target as { order_index: number }).order_index, now, id);
  db.prepare(
    "UPDATE delivery_sop_templates SET order_index = ?, updated_at = ? WHERE id = ?"
  ).run(current.order_index, now, (target as { id: string }).id);
}

// ───────── CRUD: Courses ─────────

export function getCoursesByClassId(classId: string): CourseRecord[] {
  tablesReady();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.*,
              tpl.schedule_path,
              tpl.schedule_preview_path,
              tpl.schedule_file_name,
              tpl.schedule_file_type
        FROM delivery_courses c
        LEFT JOIN delivery_course_templates tpl ON tpl.id = c.course_template_id
        WHERE c.class_id = ?
        ORDER BY c.start_date ASC, c.order_index ASC`
    )
    .all(classId) as Record<string, unknown>[];
  return rows.map(mapCourseRow);
}

export function createDeliveryCourse(
  input: Omit<CourseRecord, "id" | "createdAt" | "updatedAt">
): string {
  tablesReady();
  const db = getDb();

  if (!input.classId || !input.name) {
    throw new Error("Missing classId or name for course");
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO delivery_courses
      (id, class_id, course_template_id, name, level, days, start_date, end_date, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.classId,
    input.courseTemplateId ?? null,
    input.name,
    input.level ?? "L2",
    input.days,
    input.startDate,
    input.endDate,
    input.orderIndex ?? 0,
    now,
    now
  );

  return id;
}

export function updateDeliveryCourse(
  id: string,
  patch: Partial<Omit<CourseRecord, "id" | "createdAt" | "updatedAt">>
): void {
  tablesReady();
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (patch.classId !== undefined) {
    sets.push("class_id = ?");
    values.push(patch.classId);
  }
  if (patch.courseTemplateId !== undefined) {
    sets.push("course_template_id = ?");
    values.push(patch.courseTemplateId);
  }
  if (patch.name !== undefined) {
    sets.push("name = ?");
    values.push(patch.name);
  }
  if (patch.level !== undefined) {
    sets.push("level = ?");
    values.push(patch.level);
  }
  if (patch.days !== undefined) {
    sets.push("days = ?");
    values.push(patch.days);
  }
  if (patch.startDate !== undefined) {
    sets.push("start_date = ?");
    values.push(patch.startDate);
  }
  if (patch.endDate !== undefined) {
    sets.push("end_date = ?");
    values.push(patch.endDate);
  }
  if (patch.orderIndex !== undefined) {
    sets.push("order_index = ?");
    values.push(patch.orderIndex);
  }
  if (patch.schedulePath !== undefined) {
    sets.push("schedule_path = ?");
    values.push(patch.schedulePath);
  }
  if (patch.schedulePreviewPath !== undefined) {
    sets.push("schedule_preview_path = ?");
    values.push(patch.schedulePreviewPath);
  }
  if (patch.scheduleFileName !== undefined) {
    sets.push("schedule_file_name = ?");
    values.push(patch.scheduleFileName);
  }
  if (patch.scheduleFileType !== undefined) {
    sets.push("schedule_file_type = ?");
    values.push(patch.scheduleFileType);
  }

  if (sets.length === 0) return;

  sets.push("updated_at = ?");
  values.push(new Date().toISOString());

  values.push(id);
  db.prepare(
    `UPDATE delivery_courses SET ${sets.join(", ")} WHERE id = ?`
  ).run(...values);
}

export function deleteDeliveryCourse(id: string): void {
  tablesReady();
  const db = getDb();
  db.prepare("DELETE FROM delivery_courses WHERE id = ?").run(id);
}
