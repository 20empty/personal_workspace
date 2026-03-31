import { useCallback, useEffect, useMemo, useState } from "react";
import { open as openFileDialog, save as saveFileDialog } from "@tauri-apps/plugin-dialog";
import { ArrowDown, ArrowUp, Download, FileSpreadsheet, FolderOpen, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import SchedulePreviewModal from "../components/delivery/SchedulePreviewModal";
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

type PreviewState = {
  course: CourseTemplateRecord;
  previewContent: PreviewContent | null;
  fileType: ScheduleFileType | null;
};

const SCHEDULE_FILE_FILTER = [{ name: "课表文件", extensions: ["xlsx", "xls", "numbers", "pdf", "png", "jpg", "jpeg", "webp", "gif"] }];

export default function Settings() {
  const [classType, setClassType] = useState<ClassType>("centralized");
  const [templates, setTemplates] = useState<SopTemplateRecord[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [courseActionMessage, setCourseActionMessage] = useState<string>("");
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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">设置</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">SOP 模版配置</p>
      </header>

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
