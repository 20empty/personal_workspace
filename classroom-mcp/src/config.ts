import { homedir } from "os";
import { join, resolve } from "path";

function getDefaultDatabasePath(): string {
  const home = homedir();

  switch (process.platform) {
    case "darwin":
      return join(
        home,
        "Library",
        "Application Support",
        "com.classroom.desktop",
        "classroom.db"
      );
    case "win32": {
      const appData = process.env.APPDATA;
      if (!appData) {
        return resolve(process.cwd(), "data", "classroom.db");
      }
      return join(appData, "com.classroom.desktop", "classroom.db");
    }
    default: {
      const xdgDataHome = process.env.XDG_DATA_HOME;
      if (xdgDataHome) {
        return join(xdgDataHome, "com.classroom.desktop", "classroom.db");
      }
      return join(home, ".local", "share", "com.classroom.desktop", "classroom.db");
    }
  }
}

export const DATABASE_PATH = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : getDefaultDatabasePath();
