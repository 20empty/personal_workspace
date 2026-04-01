import { getVersion } from "@tauri-apps/api/app";
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateAvailability = "idle" | "unavailable" | "available" | "error" | "unsupported";

export type UpdateProgress = {
  downloadedBytes: number;
  contentLength: number | null;
  percent: number | null;
};

export type UpdateSnapshot = {
  currentVersion: string;
  availability: UpdateAvailability;
  update: Update | null;
  errorMessage: string | null;
  checkedAt: number | null;
};

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function getAppVersion() {
  if (!isTauriRuntime()) {
    return "开发环境";
  }

  return getVersion();
}

export async function checkForAppUpdate(): Promise<UpdateSnapshot> {
  const currentVersion = await getAppVersion();

  if (!isTauriRuntime()) {
    return {
      currentVersion,
      availability: "unsupported",
      update: null,
      errorMessage: "当前为浏览器开发环境，应用内更新仅在桌面端安装包中可用。",
      checkedAt: Date.now(),
    };
  }

  try {
    const update = await check();
    return {
      currentVersion,
      availability: update ? "available" : "unavailable",
      update,
      errorMessage: null,
      checkedAt: Date.now(),
    };
  } catch (error) {
    return {
      currentVersion,
      availability: "error",
      update: null,
      errorMessage: formatError(error),
      checkedAt: Date.now(),
    };
  }
}

export async function downloadAndInstallUpdate(
  update: Update,
  onProgress?: (progress: UpdateProgress) => void
) {
  let downloadedBytes = 0;
  let contentLength: number | null = null;

  await update.downloadAndInstall((event: DownloadEvent) => {
    if (event.event === "Started") {
      contentLength = event.data.contentLength ?? null;
      downloadedBytes = 0;
    }

    if (event.event === "Progress") {
      downloadedBytes += event.data.chunkLength;
      onProgress?.({
        downloadedBytes,
        contentLength,
        percent: contentLength ? Math.min(100, (downloadedBytes / contentLength) * 100) : null,
      });
    }

    if (event.event === "Finished") {
      onProgress?.({
        downloadedBytes,
        contentLength,
        percent: 100,
      });
    }
  });

  await relaunch();
}

export function formatUpdateDate(date: string | undefined) {
  if (!date) return "未提供发布时间";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}
