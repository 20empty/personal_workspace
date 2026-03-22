import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    if (!Database || !Database.load) {
       const msg = "数据库只能在 Tauri 环境中运行。请通过 'npm run tauri dev' 启动应用。";
       console.error(msg);
       alert(msg);
       throw new Error(msg);
    }
    db = await Database.load("sqlite:classroom.db");
  }
  return db;
}
