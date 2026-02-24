import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Users,
  CalendarClock,
  ClipboardList,
  ChevronRight,
  Trash2,
  Archive,
  Inbox,
} from "lucide-react";
import { deliveryClasses as seedClasses } from "../data/mock";
import {
  createDeliveryClass,
  deleteDeliveryClass,
  listDeliveryClasses,
  type DeliveryClassRecord,
} from "../db/delivery";

import ClassDetailSidebar from "../components/delivery/ClassDetailSidebar";
import DeleteConfirmModal from "../components/delivery/DeleteConfirmModal";
import CreateClassModal, { type CreatePayload } from "../components/delivery/CreateClassModal";

export type ViewClass = Pick<
  DeliveryClassRecord,
  | "id"
  | "code"
  | "title"
  | "location"
  | "status"
  | "stage"
  | "startDate"
  | "endDate"
  | "learners"
  | "progress"
  | "nextSession"
  | "focus"
  | "archiveState"
> & { dateRange: string };

export default function DeliveryManager() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ViewClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (value: string) => value.replace(/-/g, ".");

  const toView = (item: DeliveryClassRecord): ViewClass => ({
    id: item.id,
    code: item.code,
    title: item.title,
    location: item.location,
    status: item.status,
    stage: item.stage,
    startDate: item.startDate,
    endDate: item.endDate,
    learners: item.learners,
    progress: item.progress,
    nextSession: item.nextSession,
    focus: item.focus,
    archiveState: item.archiveState,
    dateRange: `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`,
  });

  const seedToView = (item: (typeof seedClasses)[number]): ViewClass => ({
    id: item.id,
    code: item.code,
    title: item.title,
    location: item.location,
    status: item.status,
    stage: item.stage,
    startDate: item.startDate,
    endDate: item.endDate,
    learners: item.learners,
    progress: item.progress,
    nextSession: item.nextSession,
    focus: item.focus,
    archiveState: item.archiveState ?? "待归档",
    dateRange: item.dateRange,
  });

  const seedToInput = (item: (typeof seedClasses)[number]) => ({
    title: item.title,
    code: item.code,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate,
    learners: item.learners,
    status: item.status,
    stage: item.stage,
    progress: item.progress,
    nextSession: item.nextSession,
    focus: item.focus,
    archiveState: item.archiveState ?? "待归档",
    notes: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadClasses = async () => {
      try {
        const rows = await listDeliveryClasses();
        if (rows.length === 0) {
          for (const seed of seedClasses) {
            await createDeliveryClass(seedToInput(seed));
          }
          const seeded = await listDeliveryClasses();
          if (!cancelled) {
            setClasses(seeded.map(toView));
          }
        } else if (!cancelled) {
          setClasses(rows.map(toView));
        }
      } catch (err) {
        console.error("Database load error, falling back to mock:", err);
        if (!cancelled) {
          setClasses(seedClasses.map(seedToView));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadClasses();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeClass = useMemo(
    () => classes.find((item) => item.stage === "active"),
    [classes]
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

  const selected = useMemo(
    () => classes.find((item) => item.id === selectedId),
    [classes, selectedId]
  );

  const toDelete = useMemo(
    () => classes.find((item) => item.id === deleteId),
    [classes, deleteId]
  );

  const handleClassCreated = async (payload: CreatePayload, fallback: ViewClass) => {
    try {
      await createDeliveryClass(payload as any);
      const rows = await listDeliveryClasses();
      setClasses(rows.map(toView));
    } catch (err) {
      console.error("Failed to create class:", err);
      setClasses((prev) => [fallback, ...prev]);
    } finally {
      setIsCreateOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDeliveryClass(deleteId);
      const rows = await listDeliveryClasses();
      setClasses(rows.map(toView));
    } catch (err) {
      console.error("Failed to delete class:", err);
      setClasses((prev) => prev.filter((item) => item.id !== deleteId));
    } finally {
      setDeleteId(null);
    }
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
                进行中
              </span>
            </div>

            {activeClass ? (
              <div className="mt-6 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    {activeClass.code}
                  </p>
                  <h3 className="text-2xl font-semibold text-[color:var(--text)]">
                    {activeClass.title}
                  </h3>
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
                    本周重点
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                    {activeClass.focus.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-xs text-[color:var(--muted)]">
                    下次课程：{activeClass.nextSession}
                  </div>
                </div>
              </div>
            ) : null}
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
                  <motion.button
                    key={item.id}
                    type="button"
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    onClick={() => setSelectedId(item.id)}
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
                      <span
                        className={
                          item.archiveState === "待归档"
                            ? "rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs text-amber-300"
                            : "rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300"
                        }
                      >
                        {item.archiveState}
                      </span>
                    </div>
                  </motion.button>
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
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4"
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
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-full border border-rose-400/30 text-rose-300 transition hover:border-rose-400/60 hover:bg-rose-500/10"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      下次课程：{item.nextSession}
                    </div>
                  </div>
                </div>
              )))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selected ? (
          <ClassDetailSidebar selected={selected} onClose={() => setSelectedId(null)} />
        ) : null}
      </AnimatePresence>

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
