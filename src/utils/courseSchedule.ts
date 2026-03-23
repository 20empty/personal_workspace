import { appLocalDataDir, extname, join } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
import { exists, readFile } from "@tauri-apps/plugin-fs";
import * as XLSX from "xlsx";
type ScheduleBackedCourse = {
  schedulePath: string | null;
  schedulePreviewPath: string | null;
  scheduleFileName: string | null;
  scheduleFileType: string | null;
};

export type CourseScheduleFileType = "xlsx" | "xls" | "numbers";

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

export async function getManagedSchedulesRoot(): Promise<string> {
  const localDir = await appLocalDataDir();
  return join(localDir, "course-schedules");
}

export function inferScheduleFileType(course: ScheduleBackedCourse): CourseScheduleFileType | null {
  const explicitType = course.scheduleFileType?.toLowerCase();
  if (explicitType === "xlsx" || explicitType === "xls" || explicitType === "numbers") {
    return explicitType;
  }

  const rawPath = course.schedulePath ?? "";
  const lower = rawPath.toLowerCase();
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  if (lower.endsWith(".numbers")) return "numbers";
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
  return exists(course.schedulePath);
}

export async function loadWorkbookPreview(path: string): Promise<WorkbookPreview> {
  const bytes = await readFile(path);
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
  const bytes = await readFile(path);
  const pdfBlob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(pdfBlob);
}

export async function getPickedScheduleExtension(path: string): Promise<CourseScheduleFileType | null> {
  const extension = (await extname(path)).toLowerCase().replace(/^\./, "");
  if (extension === "xlsx" || extension === "xls" || extension === "numbers") {
    return extension;
  }
  return null;
}
