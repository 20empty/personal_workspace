import { appLocalDataDir, extname, join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
type ScheduleBackedCourse = {
  schedulePath: string | null;
  schedulePreviewPath: string | null;
  scheduleFileName: string | null;
  scheduleFileType: string | null;
};

export type CourseScheduleFileType = "xlsx" | "xls" | "numbers" | "png" | "jpg" | "jpeg" | "webp" | "gif" | "pdf";

export type ManagedCourseSchedule = {
  schedulePath: string;
  schedulePreviewPath: string | null;
  scheduleFileName: string;
  scheduleFileType: CourseScheduleFileType;
};

export type WorkbookPreview = {
  sheetNames: string[];
  sheets: Record<string, string[][]>;
};

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export async function getManagedSchedulesRoot(): Promise<string> {
  const localDir = await appLocalDataDir();
  return join(localDir, "course-schedules");
}

export function inferScheduleFileType(course: ScheduleBackedCourse): CourseScheduleFileType | null {
  const explicitType = course.scheduleFileType?.toLowerCase();
  if (explicitType === "xlsx" || explicitType === "xls" || explicitType === "numbers" || explicitType === "pdf" ||
      explicitType === "png" || explicitType === "jpg" || explicitType === "jpeg" || explicitType === "webp" || explicitType === "gif") {
    return explicitType;
  }

  const rawPath = course.schedulePath ?? "";
  const lower = rawPath.toLowerCase();
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  if (lower.endsWith(".numbers")) return "numbers";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".webp")) return "webp";
  if (lower.endsWith(".gif")) return "gif";
  return null;
}

export function inferScheduleFileName(course: ScheduleBackedCourse): string {
  if (course.scheduleFileName) return course.scheduleFileName;
  const rawPath = course.schedulePath ?? "";
  return rawPath.split(/[\\/]/).pop() || "未命名课表";
}

export async function isLegacyCourseSchedule(
  course: ScheduleBackedCourse,
  managedRoot: string
): Promise<boolean> {
  if (!course.schedulePath) return false;
  return !course.schedulePath.startsWith(managedRoot);
}

export async function prepareCourseSchedule(
  courseId: string,
  sourcePath: string,
  generatePreview: boolean = false
): Promise<ManagedCourseSchedule> {
  return invoke<ManagedCourseSchedule>("prepare_course_schedule", {
    courseId,
    sourcePath,
    generatePreview,
  });
}

export async function generateNumbersPreview(courseId: string): Promise<string> {
  return invoke<string>("generate_numbers_preview", { courseId });
}

export async function exportCourseSchedule(sourcePath: string, targetPath: string): Promise<void> {
  await invoke("export_course_schedule", { sourcePath, targetPath });
}

export async function deleteCourseScheduleAssets(courseId: string): Promise<void> {
  await invoke("delete_course_schedule", { courseId });
}

export async function canMigrateLegacySchedule(course: ScheduleBackedCourse): Promise<boolean> {
  if (!course.schedulePath) return false;
  return invoke<boolean>("supported_file_exists", {
    sourcePath: course.schedulePath,
    allowedExtensions: ["xlsx", "xls", "numbers", "pdf", "png", "jpg", "jpeg", "webp", "gif"],
  });
}

export async function loadWorkbookPreview(path: string): Promise<WorkbookPreview> {
  const [XLSX, rawBytes] = await Promise.all([
    import("xlsx"),
    invoke<number[]>("read_supported_file", {
      sourcePath: path,
      allowedExtensions: ["xlsx", "xls"],
    }),
  ]);
  const bytes = new Uint8Array(rawBytes);
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheets: Record<string, string[][]> = {};

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
      workbook.Sheets[sheetName],
      { header: 1, raw: false, defval: "" }
    );
    sheets[sheetName] = rows.map((row) => row.map((cell) => String(cell ?? "")));
  }

  return {
    sheetNames: workbook.SheetNames,
    sheets,
  };
}

export async function loadPdfBlobUrl(path: string): Promise<string> {
  const rawBytes = await invoke<number[]>("read_supported_file", {
    sourcePath: path,
    allowedExtensions: ["pdf"],
  });
  const bytes = new Uint8Array(rawBytes);
  const pdfBlob = new Blob([toArrayBuffer(bytes)], { type: "application/pdf" });
  return URL.createObjectURL(pdfBlob);
}

export async function getPickedScheduleExtension(path: string): Promise<CourseScheduleFileType | null> {
  const extension = (await extname(path)).toLowerCase().replace(/^\./, "");
  if (extension === "xlsx" || extension === "xls" || extension === "numbers") {
    return extension;
  }
  return null;
}
