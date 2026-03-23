import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Users,
  CalendarClock,
  ChevronRight,
  Play,
  CheckCircle2,
  Trash2,
  Archive,
  Inbox,
} from "lucide-react";
import {
  createDeliveryClass,
  deleteDeliveryClass,
  listDeliveryClasses,
  updateDeliveryClass,
  getCoursesByClassId,
  type DeliveryClassRecord,
  type CourseRecord,
} from "../db/delivery";

import DeleteConfirmModal from "../components/delivery/DeleteConfirmModal";
import CreateClassModal, { type CreatePayload } from "../components/delivery/CreateClassModal";

export type ViewClass = Pick<
  DeliveryClassRecord,
  | "id"
  | "code"
  | "contractNo"
  | "title"
  | "location"
  | "status"
  | "stage"
  | "classType"
  | "startDate"
  | "endDate"
  | "learners"
  | "teacherPo"
  | "headteacherPo"
  | "progress"
  | "focus"
  | "archiveState"
> & { dateRange: string };

export default function DeliveryManager() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [transitionAction, setTransitionAction] = useState<{
    id: string;
    title: string;
    type: "start" | "complete";
  } | null>(null);
  const [isTransitionSubmitting, setIsTransitionSubmitting] = useState(false);
  const [classes, setClasses] = useState<ViewClass[]>([]);
  const [activeCourseMap, setActiveCourseMap] = useState<Record<string, CourseRecord | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (value: string) => value.replace(/-/g, ".");

  const toView = (item: DeliveryClassRecord): ViewClass => ({
    id: item.id,
    code: item.code,
    contractNo: item.contractNo,
    title: item.title,
    location: item.location,
    status: item.status,
    stage: item.stage,
    classType: item.classType,
    startDate: item.startDate,
    endDate: item.endDate,
    learners: item.learners,
    teacherPo: item.teacherPo,
    headteacherPo: item.headteacherPo,
    progress: item.progress,
    focus: item.focus,
    archiveState: item.archiveState,
    dateRange: `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`,
  });

  const loadClasses = useCallback(async () => {
    try {
      const rows = await listDeliveryClasses();
      return rows.map(toView);
    } catch (err) {
      console.error("Database load error:", err);
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const rows = await loadClasses();
      if (!cancelled) {
        setClasses(rows);
        setIsLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [loadClasses]);

  const activeClasses = useMemo(
    () => classes.filter((item) => item.stage === "active"),
    [classes]
  );
  const activeClassIds = useMemo(
    () => activeClasses.map((item) => item.id),
    [activeClasses]
  );

  const upcomingClasses = useMemo(
    () => classes.filter((item) => item.stage === "upcoming"),
    [classes]
  );

  const archivedClasses = useMemo(
    () =>
      classes
        .filter((item) => item.stage === "completed")
        .sort((a, b) => {
          if (a.archiveState === b.archiveState) return 0;
          return a.archiveState === "待归档" ? -1 : 1;
        }),
    [classes]
  );

  const toDelete = useMemo(
    () => classes.find((item) => item.id === deleteId),
    [classes, deleteId]
  );

  const pickCurrentCourse = (courses: CourseRecord[]): CourseRecord | null => {
    if (courses.length === 0) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const parseDay = (value: string) => new Date(`${value}T00:00:00`).getTime();

    const inProgress = courses.find((course) => {
      const start = parseDay(course.startDate);
      const end = parseDay(course.endDate);
      return start <= today && today <= end;
    });
    if (inProgress) return inProgress;

    const upcoming = courses
      .filter((course) => parseDay(course.startDate) > today)
      .sort((a, b) => parseDay(a.startDate) - parseDay(b.startDate));
    if (upcoming.length > 0) return upcoming[0];

    return courses
      .slice()
      .sort((a, b) => parseDay(b.endDate) - parseDay(a.endDate))[0];
  };

  useEffect(() => {
    if (activeClassIds.length === 0) {
      setActiveCourseMap({});
      return;
    }
    let cancelled = false;
    const loadActiveCourses = async () => {
      try {
        const entries = await Promise.all(
          activeClassIds.map(async (classId) => {
            const courses = await getCoursesByClassId(classId);
            return [classId, pickCurrentCourse(courses)] as const;
          })
        );
        if (!cancelled) {
          setActiveCourseMap(Object.fromEntries(entries));
        }
      } catch (err) {
        console.error("Failed to load active class courses:", err);
        if (!cancelled) {
          setActiveCourseMap({});
        }
      }
    };
    loadActiveCourses();
    return () => {
      cancelled = true;
    };
  }, [activeClassIds]);

  const handleClassCreated = async (payload: CreatePayload) => {
    try {
      await createDeliveryClass(payload);
      const rows = await loadClasses();
      setClasses(rows);
    } catch (err) {
      console.error("Failed to create class:", err);
    } finally {
      setIsCreateOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDeliveryClass(deleteId);
      const rows = await loadClasses();
      setClasses(rows);
    } catch (err) {
      console.error("Failed to delete class:", err);
      setClasses((prev) => prev.filter((item) => item.id !== deleteId));
    } finally {
      setDeleteId(null);
    }
  };

  const handleStartDelivery = async (id: string) => {
    try {
      setIsTransitionSubmitting(true);
      await updateDeliveryClass(id, { stage: "active" });
      const rows = await loadClasses();
      setClasses(rows);
    } catch (err) {
      console.error("Failed to start delivery:", err);
      setClasses((prev) =>
        prev.map((item) => (item.id === id ? { ...item, stage: "active" } : item))
      );
    } finally {
      setIsTransitionSubmitting(false);
    }
  };

  const handleCompleteDelivery = async (id: string) => {
    try {
      setIsTransitionSubmitting(true);
      await updateDeliveryClass(id, { stage: "completed", archiveState: "待归档" });
      const rows = await loadClasses();
      setClasses(rows);
    } catch (err) {
      console.error("Failed to complete delivery:", err);
      setClasses((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, stage: "completed", archiveState: "待归档" } : item
        )
      );
    } finally {
      setIsTransitionSubmitting(false);
    }
  };

  const handleConfirmTransition = async () => {
    if (!transitionAction) return;
    if (transitionAction.type === "start") {
      await handleStartDelivery(transitionAction.id);
    } else {
      await handleCompleteDelivery(transitionAction.id);
    }
    setTransitionAction(null);
  };

  return (
    <div className="relative space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Delivery Manager
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">
            交付管理
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            当前班级、后续档期与历史归档
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs text-[color:var(--muted)]">
              同步中
            </span>
          ) : null}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20"
          >
            <Plus className="h-4 w-4" />
            新建班级
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Active Class
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                  当前正在交付
                </h2>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
                {activeClasses.length} 进行中
              </span>
            </div>

            {activeClasses.length > 0 ? (
              <div className="mt-6 space-y-4">
                {activeClasses.map((activeClass) => (
                  <div
                    key={activeClass.id}
                    className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4 md:grid-cols-[1.1fr_0.9fr] cursor-pointer transition hover:border-[color:var(--accent)]/40"
                    onClick={() => navigate(`/delivery/${activeClass.id}`)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                            {activeClass.code}
                          </p>
                          <h3 
                            className="mt-2 line-clamp-2 text-2xl font-semibold leading-tight text-[color:var(--text)]"
                            title={activeClass.title}
                          >
                            {activeClass.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setTransitionAction({
                                id: activeClass.id,
                                title: activeClass.title,
                                type: "complete",
                              });
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-full border border-emerald-400/40 px-3 text-xs text-emerald-300 transition hover:bg-emerald-500/10"
                            title="完结交付"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            完结交付
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteId(activeClass.id);
                            }}
                            className="grid h-8 w-8 place-items-center rounded-full border border-rose-400/30 text-rose-300 transition hover:border-rose-400/60 hover:bg-rose-500/10"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {activeClass.location}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {activeClass.learners} 位学员
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock className="h-4 w-4" />
                          {activeClass.dateRange}
                        </span>
                      </div>
                      <div className="mt-4 h-2 w-full rounded-full bg-black/20">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                          style={{ width: `${activeClass.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                        <span>交付进度</span>
                        <span className="text-[color:var(--text)]">
                          {activeClass.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                        当前交付课程
                      </p>
                      {activeCourseMap[activeClass.id] ? (
                        <div className="mt-3 space-y-2">
                          <p className="text-base font-semibold text-[color:var(--text)]">
                            {activeCourseMap[activeClass.id]?.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {activeCourseMap[activeClass.id]?.startDate.replace(/-/g, ".")}
                            {" - "}
                            {activeCourseMap[activeClass.id]?.endDate.replace(/-/g, ".")}
                          </div>
                          <div className="inline-flex rounded-md bg-[color:var(--border)] px-2 py-1 text-xs text-[color:var(--muted)]">
                            {activeCourseMap[activeClass.id]?.days}天
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[color:var(--muted)]">
                          暂无课程安排
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 text-sm text-[color:var(--muted)]">
                当前暂无正在交付的班级
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Archive
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                  已交付班级
                </h2>
              </div>
              <span className="text-xs text-[color:var(--muted)]">
                {archivedClasses.length} 项
              </span>
            </div>

            <div className="mt-6 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {archivedClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[color:var(--muted)]">
                  <Archive className="mb-3 h-10 w-10 opacity-20" />
                  <p className="text-sm">暂无已归档班级</p>
                </div>
              ) : (
                archivedClasses.map((item) => (
                  <motion.div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    onClick={() => navigate(`/delivery/${item.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/delivery/${item.id}`);
                      }
                    }}
                    className="group w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4 text-left shadow-lg shadow-black/10 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                          {item.code}
                        </p>
                        <h2 className="mt-2 text-base font-semibold text-[color:var(--text)]">
                          {item.title}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[color:var(--muted)]">
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {item.location}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" />
                            {item.dateRange}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={
                            item.archiveState === "待归档"
                              ? "rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs text-amber-300"
                              : "rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300"
                          }
                        >
                          {item.archiveState}
                        </span>
                        <button
                          onClick={(event) => { event.stopPropagation(); setDeleteId(item.id); }}
                          className="grid h-8 w-8 place-items-center rounded-full border border-rose-400/30 text-rose-300 transition hover:border-rose-400/60 hover:bg-rose-500/10"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Upcoming Schedule
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                后续档期
              </h2>
            </div>
            <ChevronRight className="h-4 w-4 text-[color:var(--muted)]" />
          </div>

          <div className="mt-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {upcomingClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[color:var(--muted)]">
                <Inbox className="mb-3 h-10 w-10 opacity-20" />
                <p className="text-sm">暂无后续档期</p>
              </div>
            ) : (
              upcomingClasses.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/delivery/${item.id}`)}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4 cursor-pointer transition hover:border-[color:var(--accent)]/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                        {item.code}
                      </p>
                      <p className="mt-2 text-base font-semibold text-[color:var(--text)]">
                        {item.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setTransitionAction({
                            id: item.id,
                            title: item.title,
                            type: "start",
                          });
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-cyan-400/40 px-3 text-xs text-cyan-300 transition hover:bg-cyan-500/10"
                        title="开始交付"
                      >
                        <Play className="h-3.5 w-3.5" />
                        开始交付
                      </button>
                      <button
                        onClick={(event) => { event.stopPropagation(); setDeleteId(item.id); }}
                        className="grid h-8 w-8 place-items-center rounded-full border border-rose-400/30 text-rose-300 transition hover:border-rose-400/60 hover:bg-rose-500/10"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {item.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      {item.dateRange}
                    </div>
                  </div>
                </div>
              )))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {toDelete ? (
          <DeleteConfirmModal
            toDelete={toDelete}
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {transitionAction ? (
          <motion.div
            className="fixed inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isTransitionSubmitting) setTransitionAction(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              onClick={(event) => event.stopPropagation()}
              className="w-[420px] max-w-[92vw] rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                {transitionAction.type === "start" ? "Start Delivery" : "Complete Delivery"}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                {transitionAction.type === "start" ? "确认开始交付？" : "确认完结交付？"}
              </h2>
              <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4 text-sm text-[color:var(--muted)]">
                目标班级：<span className="text-[color:var(--text)]">{transitionAction.title}</span>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setTransitionAction(null)}
                  disabled={isTransitionSubmitting}
                  className="rounded-2xl border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)] disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmTransition}
                  disabled={isTransitionSubmitting}
                  className="rounded-2xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isTransitionSubmitting ? "处理中..." : "确认"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateOpen ? (
          <CreateClassModal
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleClassCreated}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
