import { getDb } from "./client";

/* ───────── Types ───────── */

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

/**
 * Map a raw SQLite row (snake_case keys) into our camelCase record.
 * The Tauri SQL plugin returns objects with the exact column names from
 * the CREATE TABLE definition, i.e. snake_case.
 */
const mapRow = (row: Record<string, unknown>): DeliveryClassRecord => ({
  id: row.id as string,
  code: row.code as string,
  title: row.title as string,
  location: row.location as string,
  status: row.status as string,
  stage: row.stage as string,
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

/* ───────── CRUD ───────── */

export async function listDeliveryClasses(): Promise<DeliveryClassRecord[]> {
  const db = await getDb();
  const rows = await db.select<Record<string, unknown>[]>(
    "SELECT * FROM delivery_classes ORDER BY start_date DESC"
  );
  return rows.map(mapRow);
}

export async function getDeliveryClass(
  id: string
): Promise<DeliveryClassRecord | null> {
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
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute(
    `INSERT INTO delivery_classes
       (id, code, title, location, status, stage, start_date, end_date,
        learners, progress, next_session, focus, archive_state, notes,
        created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      id,
      input.code,
      input.title,
      input.location,
      input.status ?? "已排期",
      input.stage ?? "upcoming",
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
  return id;
}

export async function updateDeliveryClass(
  id: string,
  patch: Partial<DeliveryClassInput>
): Promise<void> {
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
  const db = await getDb();
  await db.execute("DELETE FROM delivery_classes WHERE id = $1", [id]);
}
