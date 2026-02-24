import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load(
      "sqlite:/Users/jerry/codex/personal workspace/src-tauri/classroom.db"
    );
  }
  return db;
}
