import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

let sqlite: Database | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!sqlite) {
    sqlite = await Database.load("sqlite:classroom.db");
  }
  if (!drizzleDb) {
    drizzleDb = drizzle(
      async (sql, params, method) => {
        if (!sqlite) {
          throw new Error("SQLite database not initialized");
        }
        if (method === "run") {
          await sqlite.execute(sql, params);
          return { rows: [] };
        }
        const rows = (await sqlite.select(sql, params)) as Record<string, unknown>[];
        return { rows };
      },
      { schema }
    );
  }
  return drizzleDb;
}
