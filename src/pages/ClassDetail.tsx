import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
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
import { deliveryClasses as mockClasses } from "../data/mock";
import SopTracker from "../components/delivery/SopTracker";
import CourseList from "../components/delivery/CourseList";

/* ───────── Mock fallback helpers ───────── */

function mockToRecord(item: (typeof mockClasses)[number]): DeliveryClassRecord {
    return {
        id: item.id,
        code: item.code,
        title: item.title,
        location: item.location,
        status: item.status,
        stage: item.stage,
        classType: "centralized",
        startDate: item.startDate,
        endDate: item.endDate,
        learners: item.learners,
        progress: item.progress,
        nextSession: item.nextSession,
        focus: item.focus,
        archiveState: item.archiveState ?? "待归档",
        notes: null,
        createdAt: "",
        updatedAt: "",
    };
}

/**
 * Generate SOP tasks in-memory when the database is unavailable.
 */
function generateMockSopTasks(classId: string): SopTaskRecord[] {
    const template = [
        { stage: "pre", title: "建群及通知" },
        { stage: "pre", title: "收集学员基础信息" },
        { stage: "pre", title: "开营仪式准备" },
        { stage: "pre", title: "确认学员差旅及集中住宿安排" },
        { stage: "pre", title: "确认主讲教室及分组讨论室预订" },
        { stage: "during", title: "每日考勤" },
        { stage: "during", title: "课堂记录/答疑汇总" },
        { stage: "during", title: "阶段性测验/作业跟进" },
        { stage: "during", title: "集中性破冰活动组织" },
        { stage: "post", title: "收集课程反馈" },
        { stage: "post", title: "发放结业证书" },
        { stage: "post", title: "讲师课程复盘报告" },
    ];
    return template.map((t, i) => ({
        id: `mock-sop-${classId}-${i}`,
        classId,
        stage: t.stage,
        title: t.title,
        status: "pending",
        orderIndex: i,
        createdAt: "",
    }));
}

/**
 * Generate mock courses when database is unavailable.
 */
function generateMockCourses(classId: string): CourseRecord[] {
    return [
        {
            id: `mock-course-${classId}-1`,
            classId,
            name: "前端架构体系与性能优化",
            days: "2",
            startDate: "2024-03-01",
            endDate: "2024-03-02",
            orderIndex: 0,
            createdAt: "",
            updatedAt: "",
        },
        {
            id: `mock-course-${classId}-2`,
            classId,
            name: "React 高阶用法与源码解析",
            days: "1.5",
            startDate: "2024-03-04",
            endDate: "2024-03-05",
            orderIndex: 1,
            createdAt: "",
            updatedAt: "",
        },
    ];
}

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
    const [isMockMode, setIsMockMode] = useState(false);

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
            } else {
                throw new Error("Record not found in DB");
            }
        } catch (err) {
            console.warn("DB unavailable, falling back to mock data:", err);
            // Fallback: look up from mock data
            const mockItem = mockClasses.find((c) => c.id === classId);
            if (mockItem) {
                setCls(mockToRecord(mockItem));
                setTasks(generateMockSopTasks(classId));
                setCourses(generateMockCourses(classId));
                setIsMockMode(true);
            }
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleTaskToggled = () => {
        if (isMockMode) {
            return;
        }
        if (classId) {
            getSopTasksByClassId(classId).then(setTasks).catch(console.error);
        }
    };

    const handleAddCourse = async (name: string, days: string, startDate: string, endDate: string) => {
        if (!classId) return;
        if (isMockMode) {
            const newCourse: CourseRecord = {
                id: `mock-course-${Math.random().toString(36).slice(2)}`,
                classId,
                name,
                days,
                startDate,
                endDate,
                orderIndex: courses.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setCourses((prev) => [...prev, newCourse]);
            return;
        }

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
        if (isMockMode) {
            setCourses((prev) => prev.filter((c) => c.id !== courseId));
            return;
        }
        await deleteDeliveryCourse(courseId);
        if (classId) {
            const updatedCourses = await getCoursesByClassId(classId);
            setCourses(updatedCourses);
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

                    {/* Next Session */}
                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-5 py-3 text-sm text-[color:var(--muted)]">
                        下次课程：{cls.nextSession}
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
