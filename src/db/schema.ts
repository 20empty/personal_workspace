import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const deliveryClasses = sqliteTable("delivery_classes", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull(),
  stage: text("stage").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  learners: integer("learners").notNull().default(0),
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
