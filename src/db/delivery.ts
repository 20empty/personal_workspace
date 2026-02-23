import { desc, eq } from "drizzle-orm";
import { getDb } from "./client";
import { deliveryClasses } from "./schema";

export type DeliveryClassInput = {
  title: string;
  code: string;
  location: string;
  startDate: string;
  endDate: string;
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

const parseFocus = (value: string) => {
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
};

const serializeFocus = (value?: string[]) => JSON.stringify(value ?? []);

const mapRecord = (row: typeof deliveryClasses.$inferSelect): DeliveryClassRecord => ({
  id: row.id,
  code: row.code,
  title: row.title,
  location: row.location,
  status: row.status,
  stage: row.stage,
  startDate: row.startDate,
  endDate: row.endDate,
  learners: row.learners,
  progress: row.progress,
  nextSession: row.nextSession,
  focus: parseFocus(row.focus),
  archiveState: row.archiveState,
  notes: row.notes ?? null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export async function listDeliveryClasses() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(deliveryClasses)
    .orderBy(desc(deliveryClasses.startDate));
  return rows.map(mapRecord);
}

export async function getDeliveryClass(id: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(deliveryClasses)
    .where(eq(deliveryClasses.id, id));
  return rows[0] ? mapRecord(rows[0]) : null;
}

export async function createDeliveryClass(input: DeliveryClassInput) {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.insert(deliveryClasses).values({
    id,
    code: input.code,
    title: input.title,
    location: input.location,
    status: input.status ?? "已排期",
    stage: input.stage ?? "upcoming",
    startDate: input.startDate,
    endDate: input.endDate,
    learners: input.learners ?? 0,
    progress: input.progress ?? 0,
    nextSession: input.nextSession ?? "待确认",
    focus: serializeFocus(input.focus),
    archiveState: input.archiveState ?? "待归档",
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateDeliveryClass(
  id: string,
  patch: Partial<DeliveryClassInput>
) {
  const db = await getDb();
  const updates: Partial<typeof deliveryClasses.$inferInsert> = {
    ...(patch.code ? { code: patch.code } : {}),
    ...(patch.title ? { title: patch.title } : {}),
    ...(patch.location ? { location: patch.location } : {}),
    ...(patch.status ? { status: patch.status } : {}),
    ...(patch.stage ? { stage: patch.stage } : {}),
    ...(patch.startDate ? { startDate: patch.startDate } : {}),
    ...(patch.endDate ? { endDate: patch.endDate } : {}),
    ...(patch.learners !== undefined ? { learners: patch.learners } : {}),
    ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
    ...(patch.nextSession ? { nextSession: patch.nextSession } : {}),
    ...(patch.focus ? { focus: serializeFocus(patch.focus) } : {}),
    ...(patch.archiveState ? { archiveState: patch.archiveState } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes ?? null } : {}),
    updatedAt: new Date().toISOString(),
  };

  await db.update(deliveryClasses).set(updates).where(eq(deliveryClasses.id, id));
}

export async function deleteDeliveryClass(id: string) {
  const db = await getDb();
  await db.delete(deliveryClasses).where(eq(deliveryClasses.id, id));
}
