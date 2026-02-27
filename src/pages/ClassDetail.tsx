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
} from "lucide-react";
import {
    getDeliveryClass,
    updateDeliveryClass,
    getSopTasksByClassId,
    seedSopTasksForClass,
    getCoursesByClassId,
    createDeliveryCourse,
    deleteDeliveryCourse,
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

    const handleAddCourse = async (name: string, days: string, startDate: string, endDate: string) => {
        if (!classId) return;

        await createDeliveryCourse({
            classId,
            name,
            days,
            startDate,
            endDate,
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
                    <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
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
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
                        <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                            班级信息
                        </h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <InfoItem icon={<MapPin className="h-4 w-4" />} label="地点" value={cls.location} />
                            <InfoItem icon={<Users className="h-4 w-4" />} label="学员" value={`${cls.learners} 人`} />
                            <InfoItem icon={<CalendarClock className="h-4 w-4" />} label="周期" value={dateRange} />
                            <InfoItem
                                icon={<Users className="h-4 w-4" />}
                                label="PO数"
                                value={`${cls.teacherPo + cls.headteacherPo}（授课${cls.teacherPo} / 班主任${cls.headteacherPo}）`}
                            />
                            <InfoItem
                                icon={<Tag className="h-4 w-4" />}
                                label="类型"
                                value={CLASS_TYPE_LABELS[cls.classType as ClassType] ?? cls.classType}
                            />
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
                        <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                            交付进度
                        </h2>
                        <div className="mt-4 h-3 w-full rounded-full bg-black/20 overflow-hidden">
                            <motion.div
                                className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${cls.progress}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--muted)]">
                            <span>当前进度</span>
                            <span className="text-[color:var(--text)] font-medium">{cls.progress}%</span>
                        </div>
                    </div>

                    {/* Courses */}
                    <CourseList
                        courses={courses}
                        onAdd={handleAddCourse}
                        onDelete={handleDeleteCourse}
                    />

                    {/* Quick Reflection Notes */}
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                                讲师复盘快速记录板
                            </h2>
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
                            className="mt-4 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-sm text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                        />
                    </div>
                </div>

                {/* RIGHT – SOP Tracker */}
                <div className="space-y-4">
                    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
                        <h2 className="mb-4 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                            SOP 任务清单
                        </h2>
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
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 shrink-0 text-[color:var(--muted)]">{icon}</span>
            <div>
                <p className="text-xs text-[color:var(--muted)]">{label}</p>
                <p className="mt-0.5 text-[color:var(--text)]">{value}</p>
            </div>
        </div>
    );
}
