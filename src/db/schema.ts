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
