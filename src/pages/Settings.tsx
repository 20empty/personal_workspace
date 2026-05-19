import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as openFileDialog, save as saveFileDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { relaunch } from "@tauri-apps/plugin-process";
import { ArrowDown, ArrowUp, ClipboardList, DatabaseBackup, Download, FileSpreadsheet, FolderOpen, Pencil, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react";
import SchedulePreviewModal from "../components/delivery/SchedulePreviewModal";
import { useUpdater } from "../components/layout/UpdateProvider";
import {
  CLASS_TYPE_LABELS,
  createCourseTemplate,
  createSopTemplate,
  deleteCourseTemplate,
  deleteSopTemplate,
  listCourseTemplates,
  listSopTemplatesByClassType,
  moveSopTemplate,
  updateCourseTemplate,
  type ClassType,
  type CourseTemplateRecord,
  type SopTemplateRecord,
} from "../db/delivery";
import {
  deleteCourseScheduleAssets,
  exportCourseSchedule,
  generateNumbersPreview,
  getManagedSchedulesRoot,
  inferScheduleFileName,
  inferScheduleFileType,
  prepareCourseSchedule,
} from "../utils/courseSchedule";
import { loadPreview, type PreviewContent, type ScheduleFileType } from "../utils/previewEngine";

const STAGES = [
  { key: "pre", label: "课前" },
  { key: "during", label: "课中" },
  { key: "post", label: "课后" },
] as const;

const SETTINGS_TABS = [
  {
    key: "sop",
    label: "SOP 设置",
    description: "按班级类型维护交付任务模版",
    icon: ClipboardList,
  },
  {
    key: "courses",
    label: "课程库管理",
    description: "管理标准课程与课表附件",
    icon: FileSpreadsheet,
  },
  {
    key: "data",
    label: "数据备份",
    description: "导出或恢复本地数据库",
    icon: DatabaseBackup,
  },
  {
    key: "updates",
    label: "应用更新",
    description: "检查版本和安装更新",
    icon: RefreshCw,
  },
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number]["key"];

type PreviewState = {
  course: CourseTemplateRecord;
  previewContent: PreviewContent | null;
  fileType: ScheduleFileType | null;
};

type RestoreDatabaseResult = {
  restoredPath: string;
  previousBackupPath: string;
};

const SCHEDULE_FILE_FILTER = [{ name: "课表文件", extensions: ["xlsx", "xls", "numbers", "pdf", "png", "jpg", "jpeg", "webp", "gif"] }];
const DATABASE_BACKUP_FILTER = [{ name: "Classroom 数据库备份", extensions: ["db", "sqlite", "sqlite3"] }];

export default function Settings() {
  const {
    appVersion,
    availability,
    latestVersion,
    releaseDate,
    releaseNotes,
    errorMessage,
    checkedAt,
    checking,
    downloading,
    progress,
    checkNow,
    installUpdate,
    dismissPrompt,
  } = useUpdater();
  const [classType, setClassType] = useState<ClassType>("centralized");
  const [templates, setTemplates] = useState<SopTemplateRecord[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [courseActionMessage, setCourseActionMessage] = useState<string>("");
  const [dataActionMessage, setDataActionMessage] = useState<string>("");
  const [dataBusy, setDataBusy] = useState<"backup" | "restore" | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("sop");
  const [managedScheduleRoot, setManagedScheduleRoot] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [newTitles, setNewTitles] = useState<Record<string, string>>({
    pre: "",
    during: "",
    post: "",
  });
  const [newCourse, setNewCourse] = useState({
    name: "",
    level: "L2",
    days: "",
    schedulePath: "",
  });

  useEffect(() => {
    getManagedSchedulesRoot().then(setManagedScheduleRoot).catch((error) => {
      console.error("Failed to resolve managed schedule root:", error);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewState?.previewContent?.type === "pdf" || previewState?.previewContent?.type === "image") {
        URL.revokeObjectURL(previewState.previewContent.url);
      }
    };
  }, [previewState]);

  const clearPreviewState = useCallback(() => {
    setPreviewState((current) => {
      if (current?.previewContent?.type === "pdf" || current?.previewContent?.type === "image") {
        URL.revokeObjectURL(current.previewContent.url);
      }
      return null;
    });
  }, []);

  const pickScheduleFile = useCallback(async () => {
    const selected = await openFileDialog({
      multiple: false,
      directory: false,
      fileAccessMode: "copy",
      filters: SCHEDULE_FILE_FILTER,
    });
    if (!selected || Array.isArray(selected)) return;

    setNewCourse((prev) => ({ ...prev, schedulePath: selected }));
    setCourseActionMessage("");
  }, []);

  const isLegacyCourse = useCallback(
    (course: CourseTemplateRecord) =>
      Boolean(course.schedulePath) &&
      Boolean(managedScheduleRoot) &&
      !course.schedulePath!.startsWith(managedScheduleRoot),
    [managedScheduleRoot]
  );

  const loadTemplates = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const [sopRows, courseRows] = await Promise.all([
        listSopTemplatesByClassType(classType),
        listCourseTemplates(),
      ]);
      setTemplates(sopRows);
      setCourseTemplates(courseRows);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setTemplates([]);
      setCourseTemplates([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [classType]);

  useEffect(() => {
    void loadTemplates(true);
  }, [loadTemplates]);

  const grouped = useMemo(() => {
    const groups: Record<string, SopTemplateRecord[]> = {
      pre: [],
      during: [],
      post: [],
    };
    for (const item of templates) {
      if (!groups[item.stage]) {
        groups[item.stage] = [];
      }
      groups[item.stage].push(item);
    }
    return groups;
  }, [templates]);

  const handleAdd = async (stage: string) => {
    const title = (newTitles[stage] ?? "").trim();
    if (!title) return;
    try {
      setBusyId(`new-${stage}`);
      await createSopTemplate({ classType, stage, title });
      setNewTitles((prev) => ({ ...prev, [stage]: "" }));
      await loadTemplates();
    } catch (err) {
      console.error("Failed to add SOP template:", err);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setBusyId(id);
      await deleteSopTemplate(id);
      await loadTemplates();
    } catch (err) {
      console.error("Failed to delete SOP template:", err);
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    try {
      setBusyId(id);
      await moveSopTemplate(id, direction);
      await loadTemplates();
    } catch (err) {
      console.error("Failed to move SOP template:", err);
    } finally {
      setBusyId(null);
    }
  };

  const applyManagedSchedule = async (courseId: string, sourcePath: string) => {
    const managed = await prepareCourseSchedule(courseId, sourcePath, false);
    return {
      schedulePath: managed.schedulePath,
      schedulePreviewPath: managed.schedulePreviewPath,
      scheduleFileName: managed.scheduleFileName,
      scheduleFileType: managed.scheduleFileType,
    };
  };

  const handleAddCourseTemplate = async () => {
    if (!newCourse.name || !newCourse.days) return;

    const courseId = crypto.randomUUID();
    try {
      setBusyId("new-course");
      setCourseActionMessage("");

      const schedulePatch = newCourse.schedulePath
        ? await applyManagedSchedule(courseId, newCourse.schedulePath)
        : {
            schedulePath: null,
            schedulePreviewPath: null,
            scheduleFileName: null,
            scheduleFileType: null,
          };

      await createCourseTemplate({
        id: courseId,
        name: newCourse.name,
        level: newCourse.level,
        days: newCourse.days,
        ...schedulePatch,
      });
      setNewCourse({ name: "", level: "L2", days: "", schedulePath: "" });
      await loadTemplates();
      setCourseActionMessage("课程已新增成功");
    } catch (err) {
      console.error("Failed to add course template:", err);
      try {
        await deleteCourseScheduleAssets(courseId);
      } catch (cleanupError) {
        console.error("Failed to clean up schedule assets after add failure:", cleanupError);
      }
      setCourseActionMessage(`新增课程失败：${String(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCourseTemplate = async (course: CourseTemplateRecord) => {
    try {
      setBusyId(course.id);
      await deleteCourseScheduleAssets(course.id);
      await deleteCourseTemplate(course.id);
      await loadTemplates();
      setCourseActionMessage(`已删除《${course.name}》`);
    } catch (err) {
      console.error("Failed to delete course template:", err);
      setCourseActionMessage(`删除课程失败：${String(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleEditCourseTemplate = async (id: string, name: string, level: string, days: string) => {
    try {
      setBusyId(id);
      await updateCourseTemplate(id, { name, level, days });
      await loadTemplates();
      setEditingTemplateId(null);
      setCourseActionMessage("已更新课程模板");
    } catch (err) {
      console.error("Failed to edit course template:", err);
      setCourseActionMessage(`更新课程失败：${String(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleReplaceCourseSchedule = async (course: CourseTemplateRecord) => {
    try {
      setBusyId(`replace-${course.id}`);
      setCourseActionMessage("");
      const selected = await openFileDialog({
        multiple: false,
        directory: false,
        fileAccessMode: "copy",
        filters: SCHEDULE_FILE_FILTER,
      });
      if (!selected || Array.isArray(selected)) return;

      const schedulePatch = await applyManagedSchedule(course.id, selected);
      await updateCourseTemplate(course.id, schedulePatch);
      await loadTemplates();
      setCourseActionMessage(`已更新《${course.name}》的课表`);
    } catch (error) {
      console.error("Failed to replace course schedule:", error);
      setCourseActionMessage(`重新上传课表失败：${String(error)}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleMigrateLegacySchedule = async (course: CourseTemplateRecord) => {
    if (!course.schedulePath) return;
    try {
      setBusyId(`migrate-${course.id}`);
      setCourseActionMessage("");
      const schedulePatch = await applyManagedSchedule(course.id, course.schedulePath);
      await updateCourseTemplate(course.id, schedulePatch);
      await loadTemplates();
      setCourseActionMessage(`已迁移《${course.name}》的旧课表`);
    } catch (error) {
      console.error("Failed to migrate course schedule:", error);
      setCourseActionMessage(`迁移旧课表失败：${String(error)}。请重新上传课表`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadScheduleFile = async (course: CourseTemplateRecord) => {
    if (!course.schedulePath) return;

    try {
      const targetPath = await saveFileDialog({
        title: "导出课表副本",
        defaultPath: inferScheduleFileName(course),
        filters: SCHEDULE_FILE_FILTER,
      });
      if (!targetPath) return;

      await exportCourseSchedule(course.schedulePath, targetPath);
      setCourseActionMessage(`课表已导出到：${targetPath}`);
    } catch (error) {
      console.error("Failed to export schedule file:", error);
      setCourseActionMessage(`下载课表失败：${String(error)}`);
    }
  };

  const handleViewCourseSchedule = async (course: CourseTemplateRecord) => {
    if (!course.schedulePath) return;
    if (isLegacyCourse(course)) {
      setCourseActionMessage("旧课表需要先迁移或重新上传，才能在应用内预览");
      return;
    }

    const fileType = inferScheduleFileType(course);
    if (!fileType) {
      setCourseActionMessage("无法识别课表文件类型，请重新上传");
      return;
    }

    try {
      setPreviewLoading(true);
      setCourseActionMessage("");
      clearPreviewState();

      // Numbers 需要特殊处理：先生成预览 PDF
      let previewPath = course.schedulePreviewPath;
      if (fileType === "numbers" && !previewPath) {
        previewPath = await generateNumbersPreview(course.id);
        await updateCourseTemplate(course.id, { schedulePreviewPath: previewPath });
        await loadTemplates();
      }

      const previewContent = await loadPreview(course.schedulePath, fileType, previewPath);
      setPreviewState({
        course,
        previewContent,
        fileType,
      });
    } catch (error) {
      console.error("Failed to preview schedule:", error);
      setPreviewState({
        course,
        previewContent: { type: "error", message: `课表预览失败：${String(error)}` },
        fileType,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const checkedAtText = checkedAt
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(checkedAt))
    : "尚未检查";

  const openReleasePage = async () => {
    try {
      await openUrl("https://github.com/20empty/personal_workspace/releases/latest");
    } catch (error) {
      console.error("Failed to open release page:", error);
      window.alert("无法打开 GitHub Release 页面，请稍后重试。");
    }
  };

  const defaultBackupName = () => {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `classroom-backup-${stamp}.db`;
  };

  const handleBackupDatabase = async () => {
    try {
      setDataBusy("backup");
      setDataActionMessage("");
      const targetPath = await saveFileDialog({
        title: "导出 Classroom 数据备份",
        defaultPath: defaultBackupName(),
        filters: DATABASE_BACKUP_FILTER,
      });
      if (!targetPath) return;

      const savedPath = await invoke<string>("backup_database", { targetPath });
      setDataActionMessage(`数据备份已导出到：${savedPath}`);
    } catch (error) {
      console.error("Failed to backup database:", error);
      setDataActionMessage(`导出备份失败：${String(error)}`);
    } finally {
      setDataBusy(null);
    }
  };

  const handleRestoreDatabase = async () => {
    try {
      setDataBusy("restore");
      setDataActionMessage("");
      const sourcePath = await openFileDialog({
        multiple: false,
        directory: false,
        filters: DATABASE_BACKUP_FILTER,
      });
      if (!sourcePath || Array.isArray(sourcePath)) return;

      const confirmed = window.confirm(
        "恢复备份会替换当前本地数据库。应用会先保留一份当前数据库副本，并在恢复后重启。确认继续？"
      );
      if (!confirmed) return;

      const result = await invoke<RestoreDatabaseResult>("restore_database", { sourcePath });
      setDataActionMessage(`数据已恢复。旧数据库副本：${result.previousBackupPath}`);
      window.alert("数据已恢复，应用将重启以加载备份内容。");
      await relaunch();
    } catch (error) {
      console.error("Failed to restore database:", error);
      setDataActionMessage(`恢复备份失败：${String(error)}`);
    } finally {
      setDataBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">设置</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">把交付规则、课程资源、数据安全和版本维护放在同一个控制台里。</p>
      </header>

      <section className="overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)]">
        <div className="border-b border-[color:var(--border)] bg-[color:var(--panel-strong)] px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Control Center</p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                {SETTINGS_TABS.find((tab) => tab.key === activeTab)?.label}
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {SETTINGS_TABS.find((tab) => tab.key === activeTab)?.description}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] px-4 py-3 text-right">
              <p className="text-xs text-[color:var(--muted)]">当前版本</p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--text)]">{appVersion}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition",
                    selected
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white shadow-sm"
                      : "border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--muted)] hover:text-[color:var(--text)]",
                  ].join(" ")}
                  title={tab.description}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {activeTab === "updates" ? (
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">应用更新</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              当前版本 {appVersion}，应用启动时会自动静默检查更新。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void openReleasePage()}
              className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
            >
              <Download className="h-3.5 w-3.5" />
              查看 Release
            </button>
            <button
              type="button"
              onClick={() => void checkNow()}
              disabled={checking || downloading}
              className="inline-flex items-center gap-1 rounded-xl bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[color:var(--accent)]/90 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
              {checking ? "检查中..." : "检查更新"}
            </button>
          </div>
        </header>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Updater</p>
                <p className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                  {availability === "available" ? `发现新版本 ${latestVersion}` : "当前版本状态正常"}
                </p>
              </div>
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)]">
                最近检查：{checkedAtText}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
              <p>当前版本：{appVersion}</p>
              <p>最新版本：{latestVersion ?? "尚未发现新版本"}</p>
              <p>发布时间：{releaseDate ?? "尚未获取"}</p>
              <p>
                状态：
                {availability === "available" && " 可更新"}
                {availability === "unavailable" && " 已是最新版本"}
                {availability === "error" && " 检查失败"}
                {availability === "unsupported" && " 当前运行环境不支持应用内更新"}
                {availability === "idle" && " 等待首次检查"}
              </p>
            </div>

            {releaseNotes ? (
              <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">Release Notes</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:var(--text)]">
                  {releaseNotes}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5">
            <p className="text-sm font-semibold text-[color:var(--text)]">更新操作</p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              发现新版本后，由你确认下载并安装。安装完成后应用会自动重启。
            </p>

            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            ) : null}

            {downloading ? (
              <div className="mt-4 space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${progress?.percent ?? 0}%` }}
                  />
                </div>
                <p className="text-xs text-[color:var(--muted)]">
                  已下载 {progress?.downloadedBytes ?? 0}
                  {progress?.contentLength ? ` / ${progress.contentLength}` : " 字节"}
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  dismissPrompt();
                  void installUpdate();
                }}
                disabled={availability !== "available" || downloading}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500/90 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {downloading ? "正在下载更新..." : "下载并安装"}
              </button>
              <button
                type="button"
                onClick={() => void checkNow()}
                disabled={checking || downloading}
                className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                手动重新检查
              </button>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {activeTab === "data" ? (
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">数据备份与恢复</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              导出完整本地数据库，用于迁移设备、版本回滚或手动备份。
            </p>
          </div>
          <DatabaseBackup className="h-5 w-5 text-[color:var(--muted)]" />
        </header>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5">
            <p className="text-sm font-semibold text-[color:var(--text)]">导出备份</p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              保存当前班级、课程库、SOP 模版和开发看板数据。
            </p>
            <button
              type="button"
              onClick={() => void handleBackupDatabase()}
              disabled={dataBusy !== null}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--accent)]/90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {dataBusy === "backup" ? "正在导出..." : "导出数据库"}
            </button>
          </div>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5">
            <p className="text-sm font-semibold text-[color:var(--text)]">恢复备份</p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              恢复前会自动保留当前数据库副本，恢复完成后重启应用。
            </p>
            <button
              type="button"
              onClick={() => void handleRestoreDatabase()}
              disabled={dataBusy !== null}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:bg-white/[0.04] disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {dataBusy === "restore" ? "正在恢复..." : "选择备份恢复"}
            </button>
          </div>
        </div>

        {dataActionMessage ? (
          <p className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] px-4 py-3 text-sm text-[color:var(--text)]">
            {dataActionMessage}
          </p>
        ) : null}
      </section>
      ) : null}

      {activeTab === "sop" ? (
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CLASS_TYPE_LABELS) as ClassType[]).map((type) => (
            <button
              key={type}
              onClick={() => setClassType(type)}
              className={[
                "rounded-full border px-4 py-2 text-sm transition",
                classType === type
                  ? "border-[color:var(--accent)] bg-[color:var(--chip)] text-[color:var(--text)]"
                  : "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]",
              ].join(" ")}
            >
              {CLASS_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-[color:var(--muted)]">加载中...</div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {STAGES.map((stageMeta) => {
              const stageItems = grouped[stageMeta.key] ?? [];
              return (
                <div
                  key={stageMeta.key}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4"
                >
                  <h2 className="text-sm font-semibold text-[color:var(--text)]">{stageMeta.label}</h2>

                  <div className="mt-3 space-y-2">
                    {stageItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--muted)]">
                        暂无任务
                      </div>
                    ) : (
                      stageItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 rounded-xl border border-[color:var(--border)] px-3 py-2"
                        >
                          <p className="text-sm text-[color:var(--text)]">{item.title}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMove(item.id, "up")}
                              disabled={index === 0 || busyId === item.id}
                              className="grid h-6 w-6 place-items-center rounded-md border border-[color:var(--border)] text-[color:var(--muted)] disabled:opacity-40"
                              title="上移"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleMove(item.id, "down")}
                              disabled={index === stageItems.length - 1 || busyId === item.id}
                              className="grid h-6 w-6 place-items-center rounded-md border border-[color:var(--border)] text-[color:var(--muted)] disabled:opacity-40"
                              title="下移"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={busyId === item.id}
                              className="grid h-6 w-6 place-items-center rounded-md border border-rose-400/40 text-rose-300 disabled:opacity-40"
                              title="删除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={newTitles[stageMeta.key] ?? ""}
                      onChange={(event) =>
                        setNewTitles((prev) => ({ ...prev, [stageMeta.key]: event.target.value }))
                      }
                      placeholder="添加待办"
                      className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                    />
                    <button
                      onClick={() => handleAdd(stageMeta.key)}
                      disabled={busyId === `new-${stageMeta.key}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)] disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      添加
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      ) : null}

      {activeTab === "courses" ? (
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
        <header className="mb-6">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">课程库管理</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">维护常用课程的标准名称、级别和时长</p>
          {courseActionMessage ? (
            <p className="mt-3 text-xs text-[color:var(--text)]">{courseActionMessage}</p>
          ) : null}
        </header>

        <div className="space-y-4">
          <div className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5 lg:grid-cols-[1fr_120px_100px_240px_100px]">
            <div className="space-y-1">
              <label className="text-xs text-[color:var(--muted)]">课程名称</label>
              <input
                value={newCourse.name}
                onChange={(e) => setNewCourse((p) => ({ ...p, name: e.target.value }))}
                placeholder="如：云原生架构实训"
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[color:var(--muted)]">级别</label>
              <select
                value={newCourse.level}
                onChange={(e) => setNewCourse((p) => ({ ...p, level: e.target.value }))}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
              >
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="L4">L4</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[color:var(--muted)]">天数</label>
              <input
                value={newCourse.days}
                onChange={(e) => setNewCourse((p) => ({ ...p, days: e.target.value }))}
                placeholder="5"
                className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[color:var(--muted)]">课表附件（可选）</label>
              <div className="rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-[color:var(--text)]">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                      <span className="truncate">
                        {newCourse.schedulePath
                          ? newCourse.schedulePath.split(/[\\/]/).pop()
                          : "未选择课表"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void pickScheduleFile()}
                      className="rounded-lg p-1.5 text-[color:var(--muted)] transition hover:bg-white/[0.04] hover:text-[color:var(--text)]"
                      title="选择课表文件"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </button>
                    {newCourse.schedulePath ? (
                      <button
                        type="button"
                        onClick={() => setNewCourse((prev) => ({ ...prev, schedulePath: "" }))}
                        className="rounded-lg p-1.5 text-[color:var(--muted)] transition hover:bg-white/[0.04] hover:text-rose-300"
                        title="移除附件"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[color:var(--muted)]">
                  上传后会托管到应用数据目录，支持 Excel 和 Numbers 的稳定预览与下载。
                </p>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => void handleAddCourseTemplate()}
                disabled={busyId === "new-course" || !newCourse.name || !newCourse.days}
                className="flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-[color:var(--accent)] text-xs font-semibold text-white transition hover:bg-[color:var(--accent)]/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                新增
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[color:var(--panel-strong)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-5 py-3 font-medium">课程名称</th>
                  <th className="px-5 py-3 font-medium">级别</th>
                  <th className="px-5 py-3 font-medium">时长</th>
                  <th className="px-5 py-3 font-medium">课表</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {courseTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-[color:var(--muted)]">
                      尚未配置课程模板
                    </td>
                  </tr>
                ) : (
                  courseTemplates.map((tpl) => {
                    const legacy = isLegacyCourse(tpl);
                    const fileType = inferScheduleFileType(tpl);
                    const fileName = inferScheduleFileName(tpl);
                    const isEditing = editingTemplateId === tpl.id;
                    return (
                      <tr key={tpl.id} className="group hover:bg-white/[0.02]">
                        {isEditing ? (
                          /* 编辑模式：内联表单 */
                          <>
                            <td className="px-5 py-3">
                              <input
                                type="text"
                                defaultValue={tpl.name}
                                id={`edit-name-${tpl.id}`}
                                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-sky-500"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <select
                                defaultValue={tpl.level}
                                id={`edit-level-${tpl.id}`}
                                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-sky-500"
                              >
                                <option value="L2">L2</option>
                                <option value="L3">L3</option>
                                <option value="L4">L4</option>
                              </select>
                            </td>
                            <td className="px-5 py-3">
                              <input
                                type="text"
                                defaultValue={tpl.days}
                                id={`edit-days-${tpl.id}`}
                                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-sky-500"
                              />
                            </td>
                            <td className="px-5 py-3 text-[color:var(--muted)]">-</td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditingTemplateId(null)}
                                  className="rounded-lg p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                                  title="取消"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const name = (document.getElementById(`edit-name-${tpl.id}`) as HTMLInputElement).value;
                                    const level = (document.getElementById(`edit-level-${tpl.id}`) as HTMLSelectElement).value;
                                    const days = (document.getElementById(`edit-days-${tpl.id}`) as HTMLInputElement).value;
                                    void handleEditCourseTemplate(tpl.id, name, level, days);
                                  }}
                                  disabled={busyId === tpl.id}
                                  className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                  title="保存"
                                >
                                  保存
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          /* 正常显示模式 */
                          <>
                            <td className="px-5 py-3 text-[color:var(--text)] font-medium">{tpl.name}</td>
                            <td className="px-5 py-3">
                              <span className="inline-block rounded-full border border-sky-400/40 bg-sky-500/25 px-2.5 py-0.5 text-[10px] font-semibold text-slate-900 dark:border-sky-300/30 dark:bg-sky-400/25 dark:text-white">
                                {tpl.level}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[color:var(--muted)]">{tpl.days} 天</td>
                            <td className="px-5 py-3 text-[color:var(--muted)]">
                          {tpl.schedulePath ? (
                            <div className="space-y-2">
                              <div className="truncate text-xs text-[color:var(--text)]">{fileName}</div>
                              <div className="flex flex-wrap items-center gap-2">
                                {legacy ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void handleMigrateLegacySchedule(tpl)}
                                      disabled={busyId === `migrate-${tpl.id}`}
                                      className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs transition hover:text-[color:var(--text)] disabled:opacity-50"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5" />
                                      迁移课表
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleReplaceCourseSchedule(tpl)}
                                      disabled={busyId === `replace-${tpl.id}`}
                                      className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs transition hover:text-[color:var(--text)] disabled:opacity-50"
                                    >
                                      <FolderOpen className="h-3.5 w-3.5" />
                                      重新上传
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void handleViewCourseSchedule(tpl)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs transition hover:text-[color:var(--text)]"
                                    >
                                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                                      查看
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDownloadScheduleFile(tpl)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs transition hover:text-[color:var(--text)]"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      下载
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleReplaceCourseSchedule(tpl)}
                                      disabled={busyId === `replace-${tpl.id}`}
                                      className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs transition hover:text-[color:var(--text)] disabled:opacity-50"
                                    >
                                      <FolderOpen className="h-3.5 w-3.5" />
                                      重新上传
                                    </button>
                                  </>
                                )}
                              </div>
                              <div className="text-[11px] text-[color:var(--muted)]">
                                {legacy
                                  ? "旧版课表记录，请先迁移后再预览。"
                                  : fileType === "numbers"
                                    ? "应用内将展示 PDF 预览。"
                                    : "应用内将展示 Excel 工作表预览。"}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleReplaceCourseSchedule(tpl)}
                              disabled={busyId === `replace-${tpl.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs transition hover:text-[color:var(--text)] disabled:opacity-50"
                            >
                              <FolderOpen className="h-3.5 w-3.5" />
                              上传课表
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingTemplateId(tpl.id)}
                              className="rounded-lg p-2 text-[color:var(--muted)] opacity-0 transition group-hover:opacity-100 hover:text-sky-400 hover:bg-sky-500/10"
                              title="编辑模板"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => void handleDeleteCourseTemplate(tpl)}
                              disabled={busyId === tpl.id}
                              className="rounded-lg p-2 text-rose-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-400/10 disabled:opacity-40"
                              title="删除模板"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      ) : null}

      <SchedulePreviewModal
        open={Boolean(previewState)}
        title={previewState?.course.name ?? "课表预览"}
        fileName={previewState ? inferScheduleFileName(previewState.course) : ""}
        fileType={previewState?.fileType ?? null}
        previewContent={previewState?.previewContent ?? null}
        loading={previewLoading}
        onClose={clearPreviewState}
        onDownload={() => (previewState ? handleDownloadScheduleFile(previewState.course) : undefined)}
      />
    </div>
  );
}
