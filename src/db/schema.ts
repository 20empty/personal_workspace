import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const deliveryClasses = sqliteTable("delivery_classes", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull(),
  stage: text("stage").notNull(),
  classType: text("class_type").notNull().default("centralized"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  learners: integer("learners").notNull().default(0),
  teacherPo: integer("teacher_po").notNull().default(0),
  headteacherPo: integer("headteacher_po").notNull().default(0),
  progress: integer("progress").notNull().default(0),
  nextSession: text("next_session").notNull().default("待确认"),
  focus: text("focus").notNull().default("[]"),
  archiveState: text("archive_state").notNull().default("待归档"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const deliveryCourses = sqliteTable("delivery_courses", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull(),
  name: text("name").notNull(),
  days: text("days").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/* ───────── DevTracker Tables ───────── */

export const devProjects = sqliteTable("dev_projects", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("planning"),
  priority: text("priority").notNull().default("medium"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  progress: integer("progress").notNull().default(0),
  owner: text("owner").notNull().default(""),
  source: text("source").notNull().default(""),
  poCount: integer("po_count").notNull().default(0),
  description: text("description").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const devTasks = sqliteTable("dev_tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  deliverableType: text("deliverable_type").notNull().default("slides"),
  status: text("status").notNull().default("pending"),
  assignee: text("assignee").notNull().default(""),
  priority: text("priority").notNull().default("medium"),
  dueDate: text("due_date").notNull().default(""),
  blocker: text("blocker").notNull().default(""),
  orderIndex: integer("order_index").notNull().default(0),
  contextNote: text("context_note").notNull().default(""),
  docUrl: text("doc_url").notNull().default(""),
  baselineUrl: text("baseline_url").notNull().default(""),
  finalDocUrl: text("final_doc_url").notNull().default(""),
  refs: text("refs").notNull().default("[]"),
  subTasks: text("sub_tasks").notNull().default("[]"),
  reviewerName: text("reviewer_name").notNull().default(""),
  reviewerEta: text("reviewer_eta").notNull().default(""),
  qaChecklist: text("qa_checklist").notNull().default("{}"),
  draftCompletedAt: text("draft_completed_at").notNull().default(""),
  qaCompletedAt: text("qa_completed_at").notNull().default(""),
  submittedAt: text("submitted_at").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
