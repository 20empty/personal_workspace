import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    MapPin,
    Users,
    CalendarClock,
    Tag,
    Loader2,
    Pencil,
} from "lucide-react";
import {
    getDeliveryClass,
    updateDeliveryClass,
    getSopTasksByClassId,
    seedSopTasksForClass,
    getCoursesByClassId,
    createDeliveryCourse,
    deleteDeliveryCourse,
    updateDeliveryCourse,
    CLASS_TYPE_LABELS,
    type DeliveryClassRecord,
    type SopTaskRecord,
    type CourseRecord,
    type ClassType,
} from "../db/delivery";
import SopTracker from "../components/delivery/SopTracker";
import CourseList from "../components/delivery/CourseList";

/* ───────── Status badge helper ───────── */

function statusBadge(stage: string) {
    switch (stage) {
        case "active":
            return {
                text: "进行中",
                cls: "bg-emerald-500/15 border-emerald-400/30 text-emerald-400",
            };
        case "completed":
            return {
                text: "已交付",
                cls: "bg-sky-500/15 border-sky-400/30 text-sky-400",
            };
        default:
            return {
                text: "即将开始",
                cls: "bg-amber-500/15 border-amber-400/30 text-amber-400",
            };
    }
}

/* ───────── Page ───────── */

export default function ClassDetail() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();

    const [cls, setCls] = useState<DeliveryClassRecord | null>(null);
    const [tasks, setTasks] = useState<SopTaskRecord[]>([]);
    const [courses, setCourses] = useState<CourseRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [noteDraft, setNoteDraft] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isSavingInfo, setIsSavingInfo] = useState(false);
    const [infoErrors, setInfoErrors] = useState({
        title: "",
        code: "",
        location: "",
        startDate: "",
        endDate: "",
    });
    const [infoDraft, setInfoDraft] = useState({
        title: "",
        code: "",
        contractNo: "",
        location: "",
        classType: "centralized" as ClassType,
        startDate: "",
        endDate: "",
        learners: "",
        teacherPo: "",
        projectSupportPo: "",
        headteacherPo: "",
    });
    const [showAutoArchiveNotice, setShowAutoArchiveNotice] = useState(false);
    const hasShownAutoArchiveNoticeRef = useRef(false);

    const syncClassProgressByTasks = useCallback(async (
        latestTasks: SopTaskRecord[],
        persist = true
    ) => {
        const total = latestTasks.length;
        const done = latestTasks.filter((task) => task.status === "completed").length;
        const nextProgress = total === 0 ? 0 : Math.round((done / total) * 100);
        const nextArchiveState = nextProgress === 100 ? "已归档" : "待归档";
        if (nextProgress < 100) {
            hasShownAutoArchiveNoticeRef.current = false;
        }
        const shouldNotify =
            nextProgress === 100 &&
            cls?.archiveState !== "已归档" &&
            !hasShownAutoArchiveNoticeRef.current;
        setCls((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                progress: nextProgress,
                archiveState: nextArchiveState,
            };
        });
        if (shouldNotify) {
            setShowAutoArchiveNotice(true);
            hasShownAutoArchiveNoticeRef.current = true;
        }

        if (persist && classId) {
            try {
                await updateDeliveryClass(classId, {
                    progress: nextProgress,
                    archiveState: nextArchiveState,
                });
            } catch (err) {
                console.error("Failed to sync class progress/archive state:", err);
            }
        }
    }, [classId, cls?.archiveState]);

    useEffect(() => {
        if (!showAutoArchiveNotice) return;
        const timer = window.setTimeout(() => {
            setShowAutoArchiveNotice(false);
        }, 2200);
        return () => window.clearTimeout(timer);
    }, [showAutoArchiveNotice]);

    const load = useCallback(async () => {
        if (!classId) return;
        try {
            const record = await getDeliveryClass(classId);
            if (record) {
                setCls(record);
                // Ensure SOP tasks exist (for legacy / mock data classes)
                await seedSopTasksForClass(classId, record.classType as ClassType);
                const [sopTasks, loadedCourses] = await Promise.all([
                    getSopTasksByClassId(classId),
                    getCoursesByClassId(classId),
                ]);
                setTasks(sopTasks);
                setCourses(loadedCourses);
                await syncClassProgressByTasks(sopTasks);
            }
        } catch (err) {
            console.error("Failed to load class detail:", err);
            setCls(null);
            setTasks([]);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }, [classId, syncClassProgressByTasks]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setNoteDraft(cls?.notes ?? "");
    }, [cls?.id, cls?.notes]);

    useEffect(() => {
        if (!cls) return;
        setInfoDraft({
            title: cls.title,
            code: cls.code,
            contractNo: cls.contractNo,
            location: cls.location,
            classType: cls.classType,
            startDate: cls.startDate,
            endDate: cls.endDate,
            learners: cls.learners.toString(),
            teacherPo: cls.teacherPo.toString(),
            projectSupportPo: cls.projectSupportPo.toString(),
            headteacherPo: cls.headteacherPo.toString(),
        });
        setInfoErrors({
            title: "",
            code: "",
            location: "",
            startDate: "",
            endDate: "",
        });
    }, [cls]);

    const handleTaskToggled = () => {
        if (classId) {
            getSopTasksByClassId(classId)
                .then(async (latest) => {
                    setTasks(latest);
                    await syncClassProgressByTasks(latest);
                })
                .catch(console.error);
        }
    };

    const handleAddCourse = async (
        name: string,
        level: string,
        days: string,
        startDate: string,
        endDate: string,
        courseTemplateId: string | null
    ) => {
        if (!classId) return;

        await createDeliveryCourse({
            classId,
            courseTemplateId,
            name,
            level,
            days,
            startDate,
            endDate,
            schedulePath: null,
            schedulePreviewPath: null,
            scheduleFileName: null,
            scheduleFileType: null,
            orderIndex: courses.length,
        });
        const updatedCourses = await getCoursesByClassId(classId);
        setCourses(updatedCourses);
    };

    const handleDeleteCourse = async (courseId: string) => {
        await deleteDeliveryCourse(courseId);
        if (classId) {
            const updatedCourses = await getCoursesByClassId(classId);
            setCourses(updatedCourses);
        }
    };

    const handleEditCourse = async (
        courseId: string,
        name: string,
        level: string,
        days: string,
        startDate: string,
        endDate: string
    ) => {
        await updateDeliveryCourse(courseId, { name, level, days, startDate, endDate });
        if (classId) {
            const updatedCourses = await getCoursesByClassId(classId);
            setCourses(updatedCourses);
        }
    };

    const handleSaveNotes = async () => {
        if (!cls) return;
        const normalized = noteDraft.trim() ? noteDraft.trim() : null;
        const previous = cls.notes ?? null;
        if (normalized === previous) return;
        try {
            setIsSavingNote(true);
            await updateDeliveryClass(cls.id, { notes: normalized });
            setCls((prev) => (prev ? { ...prev, notes: normalized } : prev));
        } catch (err) {
            console.error("Failed to save notes:", err);
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleCancelInfoEdit = () => {
        if (!cls) return;
        setInfoDraft({
            title: cls.title,
            code: cls.code,
            contractNo: cls.contractNo,
            location: cls.location,
            classType: cls.classType,
            startDate: cls.startDate,
            endDate: cls.endDate,
            learners: cls.learners.toString(),
            teacherPo: cls.teacherPo.toString(),
            projectSupportPo: cls.projectSupportPo.toString(),
            headteacherPo: cls.headteacherPo.toString(),
        });
        setInfoErrors({
            title: "",
            code: "",
            location: "",
            startDate: "",
            endDate: "",
        });
        setIsEditingInfo(false);
    };

    const handleSaveInfo = async () => {
        if (!cls) return;
        const nextErrors = {
            title: infoDraft.title.trim() ? "" : "请输入班级名称",
            code: infoDraft.code.trim() ? "" : "请输入班级编号",
            location: infoDraft.location.trim() ? "" : "请输入交付地点",
            startDate: infoDraft.startDate ? "" : "请选择开始日期",
            endDate: !infoDraft.endDate
                ? "请选择结束日期"
                : infoDraft.startDate && infoDraft.endDate < infoDraft.startDate
                  ? "结束日期不能早于开始日期"
                  : "",
        };
        setInfoErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) return;

        const patch = {
            title: infoDraft.title.trim(),
            code: infoDraft.code.trim(),
            contractNo: infoDraft.contractNo.trim(),
            location: infoDraft.location.trim(),
            classType: infoDraft.classType,
            startDate: infoDraft.startDate,
            endDate: infoDraft.endDate,
            learners: Number.parseInt(infoDraft.learners || "0", 10) || 0,
            teacherPo: Number.parseFloat(infoDraft.teacherPo || "0") || 0,
            projectSupportPo: Number.parseFloat(infoDraft.projectSupportPo || "0") || 0,
            headteacherPo: Number.parseFloat(infoDraft.headteacherPo || "0") || 0,
        };

        try {
            setIsSavingInfo(true);
            await updateDeliveryClass(cls.id, patch);
            setCls((prev) => (prev ? { ...prev, ...patch } : prev));
            setIsEditingInfo(false);
        } catch (err) {
            console.error("Failed to save class info:", err);
        } finally {
            setIsSavingInfo(false);
        }
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[color:var(--muted)]" />
            </div>
        );
    }

    /* ─── Not Found ─── */
    if (!cls) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-[color:var(--muted)]">
                <p className="text-lg">未找到该班级</p>
                <button
                    onClick={() => navigate("/delivery")}
                    className="rounded-2xl border border-[color:var(--border)] px-4 py-2 text-sm transition hover:text-[color:var(--text)]"
                >
                    返回交付管理
                </button>
            </div>
        );
    }

    const badge = statusBadge(cls.stage);
    const formatDate = (val: string) => val.replace(/-/g, ".");
    const dateRange = `${formatDate(cls.startDate)} - ${formatDate(cls.endDate)}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            <AnimatePresence>
                {showAutoArchiveNotice ? (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="fixed left-1/2 top-6 z-40 -translate-x-1/2 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 shadow-lg shadow-emerald-500/20 backdrop-blur-sm"
                    >
                        恭喜你已完成该班级，该班级已自动归档
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* ─── Header ─── */}
            <header className="flex flex-wrap items-center gap-4">
                <button
                    onClick={() => navigate("/delivery")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    返回
                </button>
                <div>
                    <p className="max-w-[min(70vw,32rem)] overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--text)]/78 break-all">
                        {cls.code}
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold text-[color:var(--text)]">
                        {cls.title}
                    </h1>
                </div>
                <span
                    className={`ml-auto inline-flex rounded-full border px-3 py-1 text-xs font-medium ${badge.cls}`}
                >
                    {badge.text}
                </span>
            </header>

            {/* ─── Body: Left info + Right SOP ─── */}
            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                {/* LEFT – Class Info */}
                <div className="space-y-5">
                    {/* Meta Grid */}
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-lg shadow-black/10">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                                    班级信息
                                </h2>
                                <p className="mt-2 text-sm text-[color:var(--muted)]">
                                    在这里维护班级的基础资料与交付排期
                                </p>
                            </div>
                            {isEditingInfo ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleCancelInfoEdit}
                                        disabled={isSavingInfo}
                                        className="rounded-xl border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)] disabled:opacity-50"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleSaveInfo}
                                        disabled={isSavingInfo}
                                        className="rounded-xl bg-[color:var(--accent)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                    >
                                        {isSavingInfo ? "保存中..." : "保存"}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditingInfo(true)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    编辑信息
                                </button>
                            )}
                        </div>
                        {isEditingInfo ? (
                            <div className="mt-5 space-y-4">
                                <div className="grid gap-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5 sm:grid-cols-2">
                                    <FormField
                                        label="班级名称"
                                        value={infoDraft.title}
                                        onChange={(value) => setInfoDraft((prev) => ({ ...prev, title: value }))}
                                        error={infoErrors.title}
                                    />
                                    <FormField
                                        label="班级编号"
                                        value={infoDraft.code}
                                        onChange={(value) => setInfoDraft((prev) => ({ ...prev, code: value }))}
                                        error={infoErrors.code}
                                    />
                                    <FormField
                                        label="合同号"
                                        value={infoDraft.contractNo}
                                        onChange={(value) => setInfoDraft((prev) => ({ ...prev, contractNo: value }))}
                                    />
                                    <FormField
                                        label="交付地点"
                                        value={infoDraft.location}
                                        onChange={(value) => setInfoDraft((prev) => ({ ...prev, location: value }))}
                                        error={infoErrors.location}
                                    />
                                    <SelectField
                                        label="班级类型"
                                        value={infoDraft.classType}
                                        onChange={(value) =>
                                            setInfoDraft((prev) => ({ ...prev, classType: value as ClassType }))
                                        }
                                        options={Object.entries(CLASS_TYPE_LABELS).map(([value, label]) => ({
                                            value,
                                            label,
                                        }))}
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5">
                                        <p className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
                                            交付排期
                                        </p>
                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <DateField
                                                label="开始日期"
                                                value={infoDraft.startDate}
                                                onChange={(value) =>
                                                    setInfoDraft((prev) => ({ ...prev, startDate: value }))
                                                }
                                                error={infoErrors.startDate}
                                            />
                                            <DateField
                                                label="结束日期"
                                                value={infoDraft.endDate}
                                                onChange={(value) =>
                                                    setInfoDraft((prev) => ({ ...prev, endDate: value }))
                                                }
                                                error={infoErrors.endDate}
                                            />
                                        </div>
                                        <div className="mt-4 rounded-2xl border border-dashed border-[color:var(--border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--muted)]">
                                            当前周期：
                                            <span className="ml-2 font-medium text-[color:var(--text)]">
                                                {infoDraft.startDate && infoDraft.endDate
                                                    ? `${formatDate(infoDraft.startDate)} - ${formatDate(infoDraft.endDate)}`
                                                    : "请选择起止日期"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5">
                                        <p className="text-xs uppercase tracking-[0.26em] text-[color:var(--muted)]">
                                            交付配置
                                        </p>
                                        <div className="mt-4 space-y-4">
                                            <FormField
                                                label="学员规模"
                                                value={infoDraft.learners}
                                                onChange={(value) => setInfoDraft((prev) => ({ ...prev, learners: value }))}
                                            />
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <FormField
                                                    label="授课PO"
                                                    value={infoDraft.teacherPo}
                                                    onChange={(value) => setInfoDraft((prev) => ({ ...prev, teacherPo: value }))}
                                                />
                                                <FormField
                                                    label="项目支持PO"
                                                    value={infoDraft.projectSupportPo}
                                                    onChange={(value) =>
                                                        setInfoDraft((prev) => ({ ...prev, projectSupportPo: value }))
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <FormField
                                                    label="班主任时长(天)"
                                                    value={infoDraft.headteacherPo}
                                                    onChange={(value) => setInfoDraft((prev) => ({ ...prev, headteacherPo: value }))}
                                                />
                                            </div>
                                            <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
                                                总PO
                                                <span className="ml-2 text-lg font-semibold">
                                                    {Number((
                                                        (Number.parseFloat(infoDraft.teacherPo || "0") || 0) +
                                                        (Number.parseFloat(infoDraft.projectSupportPo || "0") || 0) +
                                                        (Number.parseFloat(infoDraft.headteacherPo || "0") || 0) * 0.1
                                                    ).toFixed(2))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-5 space-y-4">
                                <div className="rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-sky-500/15 via-cyan-500/10 to-transparent p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <p className="max-w-[min(70vw,32rem)] overflow-hidden rounded-2xl border border-sky-200/15 bg-sky-950/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-sky-50/88 break-all">
                                                {cls.code}
                                            </p>
                                            {cls.contractNo ? (
                                                <p className="mt-2 text-xs uppercase tracking-[0.28em] text-sky-100/60">
                                                    合同号 · {cls.contractNo}
                                                </p>
                                            ) : null}
                                            <h3 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">
                                                {cls.title}
                                            </h3>
                                            <p className="mt-3 text-sm text-[color:var(--muted)]">
                                                {dateRange}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <InfoPill label="地点" value={cls.location} />
                                            <InfoPill
                                                label="类型"
                                                value={CLASS_TYPE_LABELS[cls.classType as ClassType] ?? cls.classType}
                                            />
                                            <InfoPill label="学员" value={`${cls.learners} 人`} />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    <InfoItem icon={<MapPin className="h-4 w-4" />} label="交付地点" value={cls.location} />
                                    <InfoItem icon={<CalendarClock className="h-4 w-4" />} label="交付周期" value={dateRange} />
                                    <InfoItem
                                        icon={<Tag className="h-4 w-4" />}
                                        label="班级编号"
                                        value={cls.code}
                                        valueClassName="break-all font-mono text-[13px] leading-6"
                                    />
                                    <InfoItem
                                        icon={<Tag className="h-4 w-4" />}
                                        label="合同号"
                                        value={cls.contractNo || "-"}
                                    />
                                    <InfoItem
                                        icon={<Tag className="h-4 w-4" />}
                                        label="班级类型"
                                        value={CLASS_TYPE_LABELS[cls.classType as ClassType] ?? cls.classType}
                                    />
                                    <InfoItem icon={<Users className="h-4 w-4" />} label="学员规模" value={`${cls.learners} 人`} />
                                    <InfoItem icon={<Users className="h-4 w-4" />} label="授课PO" value={`${cls.teacherPo} 个`} />
                                    <InfoItem icon={<Users className="h-4 w-4" />} label="项目支持PO" value={`${cls.projectSupportPo} 个`} />
                                    <InfoItem icon={<CalendarClock className="h-4 w-4" />} label="班主任时长" value={`${cls.headteacherPo} 天`} />
                                </div>
                                <div className="rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-sm text-[color:var(--muted)]">
                                    总PO：
                                    <span className="ml-2 font-semibold text-[color:var(--text)]">
                                        {Number((cls.teacherPo + cls.projectSupportPo + cls.headteacherPo * 0.1).toFixed(2))}
                                    </span>
                                    <span className="ml-2 text-xs">
                                        授课 {cls.teacherPo} 个 / 项目支持 {cls.projectSupportPo} 个 / 班主任 {cls.headteacherPo} 天
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-lg shadow-black/10">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                                    交付进度
                                </h2>
                                <p className="mt-2 text-sm text-[color:var(--text)]/72">
                                    根据 SOP 完成情况自动更新当前班级进度
                                </p>
                            </div>
                            <div className="rounded-2xl border border-sky-400/25 bg-sky-500/12 px-4 py-3 text-right">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-sky-100/82">Progress</p>
                                <p className="mt-1 text-xl font-semibold text-sky-50">{cls.progress}%</p>
                            </div>
                        </div>
                        <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/20">
                            <motion.div
                                className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${cls.progress}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--text)]/66">
                            <span>当前 SOP 完成度</span>
                            <span className="font-medium text-[color:var(--text)]">{cls.progress}%</span>
                        </div>
                    </div>

                    {/* Courses */}
                    <CourseList
                        courses={courses}
                        onAdd={handleAddCourse}
                        onDelete={handleDeleteCourse}
                        onEdit={handleEditCourse}
                    />

                    {/* Quick Reflection Notes */}
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-lg shadow-black/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                                    讲师复盘快速记录板
                                </h2>
                                <p className="mt-2 text-sm text-[color:var(--muted)]">
                                    记录课堂难点、学员反馈和下次教学调整点
                                </p>
                            </div>
                            <button
                                onClick={handleSaveNotes}
                                disabled={isSavingNote}
                                className="rounded-xl border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)] disabled:opacity-50"
                            >
                                {isSavingNote ? "保存中..." : "保存"}
                            </button>
                        </div>
                        <textarea
                            value={noteDraft}
                            onChange={(event) => setNoteDraft(event.target.value)}
                            onBlur={handleSaveNotes}
                            rows={5}
                            placeholder="记录课堂难点、学员反馈、下次教学调整点..."
                            className="mt-5 w-full rounded-3xl border border-[color:var(--border)] bg-black/10 px-4 py-4 text-sm text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                        />
                    </div>
                </div>

                {/* RIGHT – SOP Tracker */}
                <div className="space-y-4">
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-lg shadow-black/10">
                        <div className="mb-4">
                            <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                                SOP 任务清单
                            </h2>
                            <p className="mt-2 text-sm text-[color:var(--muted)]">
                                分阶段跟踪训前、训中和训后交付事项
                            </p>
                        </div>
                        <SopTracker tasks={tasks} onTaskToggled={handleTaskToggled} />
                    </div>
                </div>
            </section>
        </motion.div>
    );
}

/* ───────── Sub-component ───────── */

function InfoItem({
    icon,
    label,
    value,
    valueClassName,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-4 shadow-sm shadow-black/5">
            <div className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 shrink-0 text-[color:var(--muted)]">{icon}</span>
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">{label}</p>
                    <p className={`mt-2 text-[15px] font-medium text-[color:var(--text)] ${valueClassName ?? ""}`.trim()}>{value}</p>
                </div>
            </div>
        </div>
    );
}

function InfoPill({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</p>
            <p className="mt-1 text-sm font-medium text-[color:var(--text)]">{value}</p>
        </div>
    );
}

function DateField({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <label className="block text-sm text-[color:var(--muted)]">
            {label}
            <input
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
            />
            {error ? <span className="mt-2 block text-xs text-amber-300">{error}</span> : null}
        </label>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <label className="block text-sm text-[color:var(--muted)]">
            {label}
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function FormField({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    return (
        <label className="block text-sm text-[color:var(--muted)]">
            {label}
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-black/10 px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
            />
            {error ? <span className="mt-2 block text-xs text-amber-300">{error}</span> : null}
        </label>
    );
}
