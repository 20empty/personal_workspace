import { useCallback, useEffect, useState } from "react";
import { save as saveFileDialog } from "@tauri-apps/plugin-dialog";
import { Plus, Trash2, Calendar, BookOpen, Download, FileSpreadsheet } from "lucide-react";
import { type CourseRecord, listCourseTemplates, type CourseTemplateRecord } from "../../db/delivery";
import SchedulePreviewModal from "./SchedulePreviewModal";
import {
    exportCourseSchedule,
    inferScheduleFileName,
    inferScheduleFileType,
    loadPdfBlobUrl,
    loadWorkbookPreview,
    type WorkbookPreview,
} from "../../utils/courseSchedule";

interface CourseListProps {
    courses: CourseRecord[];
    onAdd: (name: string, level: string, days: string, startDate: string, endDate: string, courseTemplateId: string | null) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

type PreviewState = {
    course: CourseRecord | CourseTemplateRecord;
    workbook: WorkbookPreview | null;
    pdfUrl: string | null;
    error: string | null;
};

export default function CourseList({ courses, onAdd, onDelete }: CourseListProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [name, setName] = useState("");
    const [level, setLevel] = useState("L2");
    const [days, setDays] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [templates, setTemplates] = useState<CourseTemplateRecord[]>([]);
    const [previewState, setPreviewState] = useState<PreviewState | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const selectedTemplate = templates.find((tpl) => tpl.id === selectedTemplateId) ?? null;

    useEffect(() => {
        if (isAdding) {
            listCourseTemplates().then(setTemplates).catch(console.error);
        }
    }, [isAdding]);

    useEffect(() => {
        return () => {
            if (previewState?.pdfUrl) {
                URL.revokeObjectURL(previewState.pdfUrl);
            }
        };
    }, [previewState]);

    const clearPreviewState = useCallback(() => {
        setPreviewState((current) => {
            if (current?.pdfUrl) {
                URL.revokeObjectURL(current.pdfUrl);
            }
            return null;
        });
    }, []);

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const tpl = templates.find((t: CourseTemplateRecord) => t.id === templateId);
        if (tpl) {
            setName(tpl.name);
            setLevel(tpl.level);
            setDays(tpl.days);
        } else {
            setName("");
            setLevel("L2");
            setDays("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !days || !startDate || !endDate) return;
        try {
            setIsSubmitting(true);
            await onAdd(name, level, days, startDate, endDate, selectedTemplateId || null);
            setIsAdding(false);
            setSelectedTemplateId("");
            setName("");
            setLevel("L2");
            setDays("");
            setStartDate("");
            setEndDate("");
        } catch (err) {
            console.error("Failed to add course:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (val: string) => val.replace(/-/g, ".");

    const handleDownloadSchedule = async (course: CourseRecord | CourseTemplateRecord) => {
        if (!course.schedulePath) return;

        try {
            const targetPath = await saveFileDialog({
                title: "导出课表副本",
                defaultPath: inferScheduleFileName(course),
                filters: [{ name: "课表文件", extensions: ["xlsx", "xls", "numbers"] }],
            });
            if (!targetPath) return;

            await exportCourseSchedule(course.schedulePath, targetPath);
        } catch (error) {
            console.error("Failed to export course schedule:", error);
        }
    };

    const handleViewSchedule = async (course: CourseRecord | CourseTemplateRecord) => {
        if (!course.schedulePath) return;

        const fileType = inferScheduleFileType(course);
        if (!fileType) {
            return;
        }

        try {
            setPreviewLoading(true);
            clearPreviewState();

            if (fileType === "numbers") {
                if (!course.schedulePreviewPath) {
                    setPreviewState({
                        course,
                        workbook: null,
                        pdfUrl: null,
                        error: "当前课表还没有可用的预览文件，请先在课程库中预览一次后再查看。",
                    });
                    return;
                }

                const pdfUrl = await loadPdfBlobUrl(course.schedulePreviewPath);
                setPreviewState({
                    course,
                    workbook: null,
                    pdfUrl,
                    error: null,
                });
                return;
            }

            const workbook = await loadWorkbookPreview(course.schedulePath);
            setPreviewState({
                course,
                workbook,
                pdfUrl: null,
                error: null,
            });
        } catch (error) {
            console.error("Failed to preview course schedule:", error);
            setPreviewState({
                course,
                workbook: null,
                pdfUrl: null,
                error: `课表预览失败：${String(error)}`,
            });
        } finally {
            setPreviewLoading(false);
        }
    };

    /** 计算两个 ISO 日期字符串之间的工作日天数（含首尾，剔除周六/周日） */
    const countWorkdays = (start: string, end: string): number => {
        if (!start || !end || end < start) return 0;
        const s = new Date(`${start}T00:00:00`);
        const e = new Date(`${end}T00:00:00`);
        let count = 0;
        const cur = new Date(s);
        while (cur <= e) {
            const dow = cur.getDay(); // 0=Sun, 6=Sat
            if (dow !== 0 && dow !== 6) count++;
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    };

    /** 当日期变化后，自动计算并填充天数 */
    const updateAutoDays = (start: string, end: string) => {
        if (start && end && end >= start) {
            const autoDays = countWorkdays(start, end);
            setDays(String(autoDays));
        }
    };

    return (
        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-lg shadow-black/10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                        交付课程
                    </h2>
                    <p className="mt-2 text-sm text-[color:var(--text)]/72">
                        管理当前班级的课程编排与时间安排
                    </p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[color:var(--accent)]/90"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        添加课程
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5">
                    {templates.length > 0 && (
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-[color:var(--text)]/78">
                                <BookOpen className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                                从课程库快速选择
                            </label>
                            <select
                                value={selectedTemplateId}
                                onChange={(e) => handleTemplateChange(e.target.value)}
                                className="w-full rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                            >
                                <option value="">-- 自定义新课程 --</option>
                                {templates.map((tpl: CourseTemplateRecord) => (
                                    <option key={tpl.id} value={tpl.id}>
                                        {tpl.name} ({tpl.level}, {tpl.days}天)
                                    </option>
                                ))}
                            </select>
                            <div className="h-px bg-[color:var(--border)] my-2" />
                        </div>
                    )}
                    {selectedTemplate?.schedulePath ? (
                        <div className="rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-sm text-[color:var(--text)]">
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                                        <span className="truncate">{inferScheduleFileName(selectedTemplate)}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-[color:var(--text)]/60">
                                        将随本次添加的课程一起带出，只保留查看和下载。
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void handleViewSchedule(selectedTemplate)}
                                        className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--text)]/78 transition hover:bg-white/[0.02]"
                                    >
                                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                                        查看课表
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleDownloadSchedule(selectedTemplate)}
                                        className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--text)]/78 transition hover:bg-white/[0.02]"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        下载
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                        <label className="block text-sm text-[color:var(--text)]/78">
                            课程名称
                            <input
                                autoFocus
                                type="text"
                                placeholder="例如：云原生架构实训"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                                required
                            />
                        </label>
                        <label className="block text-sm text-[color:var(--text)]/78">
                            课程级别
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                                required
                            >
                                <option value="L2">L2</option>
                                <option value="L3">L3</option>
                                <option value="L4">L4</option>
                            </select>
                        </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1fr_1fr_110px]">
                        <label className="block text-sm text-[color:var(--text)]/78">
                            开始日期
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setStartDate(val);
                                    updateAutoDays(val, endDate);
                                }}
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] [color-scheme:light]"
                                required
                            />
                        </label>
                        <label className="block text-sm text-[color:var(--text)]/78">
                            结束日期
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setEndDate(val);
                                    updateAutoDays(startDate, val);
                                }}
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)] [color-scheme:light]"
                                required
                            />
                        </label>
                        <label className="block text-sm text-[color:var(--text)]/78">
                            天数
                            <input
                                type="text"
                                placeholder="5"
                                value={days}
                                onChange={(e) => setDays(e.target.value)}
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                                required
                            />
                        </label>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsAdding(false);
                                setSelectedTemplateId("");
                            }}
                            className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-xs text-[color:var(--text)]/70 hover:bg-white/[0.02]"
                            disabled={isSubmitting}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[color:var(--accent)]/90 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            提交
                        </button>
                    </div>
                </form>
            )}

            {courses.length > 0 ? (
                <div className="mt-5 space-y-3">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className="group flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-4 shadow-sm shadow-black/5 transition hover:border-[color:var(--accent)]/40 hover:bg-white/[0.02]"
                        >
                            <div>
                                <h3 className="text-sm font-medium text-[color:var(--text)]">
                                    {course.name}
                                    <span className="ml-2 inline-flex items-center gap-1.5">
                                        <span className="inline-block rounded-full border border-sky-300/35 bg-sky-300/28 px-2.5 py-0.5 text-[10px] font-semibold text-sky-950">
                                            {course.level}
                                        </span>
                                        <span className="inline-block rounded-full border border-sky-300/35 bg-sky-300/10 px-2.5 py-0.5 text-[10px] font-semibold text-sky-300/70">
                                            {course.days}天
                                        </span>
                                    </span>
                                </h3>
                                <div className="mt-2 flex items-center gap-1 text-xs text-[color:var(--text)]/68">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(course.startDate)} - {formatDate(course.endDate)}
                                </div>
                                {course.schedulePath ? (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void handleViewSchedule(course)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs text-[color:var(--text)]/78 transition hover:bg-white/[0.02]"
                                        >
                                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                                            查看课表
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleDownloadSchedule(course)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs text-[color:var(--text)]/78 transition hover:bg-white/[0.02]"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            下载
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                            <button
                                onClick={() => onDelete(course.id)}
                                className="text-rose-400 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
                                title="删除课程"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                !isAdding && (
                    <div className="mt-5 rounded-3xl border border-dashed border-[color:var(--border)] bg-black/10 px-6 py-10 text-center text-sm text-[color:var(--text)]/64">
                        尚未添加交付课程
                    </div>
                )
            )}

            <SchedulePreviewModal
                open={Boolean(previewState)}
                title={previewState?.course.name ?? "课表预览"}
                fileName={previewState ? inferScheduleFileName(previewState.course) : ""}
                fileTypeLabel={previewState ? (inferScheduleFileType(previewState.course) ?? "未知类型").toUpperCase() : ""}
                workbook={previewState?.workbook ?? null}
                pdfUrl={previewState?.pdfUrl ?? null}
                error={previewState?.error ?? null}
                loading={previewLoading}
                onClose={clearPreviewState}
                onDownload={() => (previewState ? handleDownloadSchedule(previewState.course) : undefined)}
            />
        </div>
    );
}
