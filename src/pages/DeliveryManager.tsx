import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Users,
  CalendarClock,
  ClipboardList,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";
import { activeClassId, deliveryClasses as seedClasses } from "../data/mock";

export default function DeliveryManager() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [classes, setClasses] = useState(seedClasses);
  const [form, setForm] = useState({
    title: "",
    code: "",
    location: "",
    startDate: "",
    endDate: "",
    learners: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({
    title: "",
    code: "",
    location: "",
    startDate: "",
    endDate: "",
  });

  const formatDate = (value: string) => value.replace(/-/g, ".");

  const activeClass = useMemo(
    () => classes.find((item) => item.id === activeClassId),
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
    [selectedId]
  );

  const toDelete = useMemo(
    () => classes.find((item) => item.id === deleteId),
    [classes, deleteId]
  );

  const resetForm = () => {
    setForm({
      title: "",
      code: "",
      location: "",
      startDate: "",
      endDate: "",
      learners: "",
      notes: "",
    });
    setFormErrors({
      title: "",
      code: "",
      location: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleCreate = () => {
    const nextErrors = {
      title: form.title ? "" : "请输入班级名称",
      code: form.code ? "" : "请输入班级编号",
      location: form.location ? "" : "请输入交付地点",
      startDate: form.startDate ? "" : "请选择开始日期",
      endDate: form.endDate ? "" : "请选择结束日期",
    };
    setFormErrors(nextErrors);
    const hasError = Object.values(nextErrors).some(Boolean);
    if (hasError) {
      return;
    }
    const dateRange = `${formatDate(form.startDate)} - ${formatDate(form.endDate)}`;
    const newClass = {
      id: `cls-${Date.now()}`,
      code: form.code,
      title: form.title,
      location: form.location,
      learners: Number.parseInt(form.learners || "0", 10) || 0,
      progress: 0,
      status: "已排期",
      stage: "upcoming",
      dateRange,
      nextSession: "待确认",
      focus: form.notes ? [form.notes] : ["待完善"],
      archiveState: "待归档",
    };
    setClasses((prev) => [newClass, ...prev]);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setClasses((prev) => prev.filter((item) => item.id !== deleteId));
    setDeleteId(null);
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
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20"
        >
          <Plus className="h-4 w-4" />
          新建班级
        </button>
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

            <div className="mt-6 space-y-3">
              {archivedClasses.map((item) => (
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
              ))}
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

          <div className="mt-6 space-y-4">
            {upcomingClasses.map((item) => (
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
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
          >
            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
              className="absolute right-0 top-0 h-full w-[420px] border-l border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    {selected.code}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                    {selected.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selected.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {selected.learners} 位学员
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  {selected.dateRange}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span>交付进度</span>
                  <span className="text-[color:var(--text)]">
                    {selected.progress}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-black/20">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                    style={{ width: `${selected.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  交付重点
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                  {selected.focus.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--muted)]">
                下次课程：{selected.nextSession}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toDelete ? (
          <motion.div
            className="fixed inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              onClick={(event) => event.stopPropagation()}
              className="w-[420px] max-w-[92vw] rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Delete Class
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                    确认删除？
                  </h2>
                </div>
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4 text-sm text-[color:var(--muted)]">
                将删除后续档期班级：<span className="text-[color:var(--text)]">{toDelete.title}</span>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-2xl border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/20"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateOpen ? (
          <motion.div
            className="fixed inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCreateOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              onClick={(event) => event.stopPropagation()}
              className="w-[520px] max-w-[92vw] rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Create Class
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[color:var(--text)]">
                    新建班级
                  </h2>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <label className="block text-sm text-[color:var(--muted)]">
                  班级名称
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                    placeholder="例如：企业云原生训练营"
                  />
                  {formErrors.title ? (
                    <span className="mt-2 block text-xs text-amber-300">
                      {formErrors.title}
                    </span>
                  ) : null}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-[color:var(--muted)]">
                    班级编号
                    <input
                      value={form.code}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, code: event.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                      placeholder="例如：CN-SZ-2403"
                    />
                    {formErrors.code ? (
                      <span className="mt-2 block text-xs text-amber-300">
                        {formErrors.code}
                      </span>
                    ) : null}
                  </label>
                  <label className="block text-sm text-[color:var(--muted)]">
                    交付地点
                    <input
                      value={form.location}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, location: event.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                      placeholder="例如：深圳"
                    />
                    {formErrors.location ? (
                      <span className="mt-2 block text-xs text-amber-300">
                        {formErrors.location}
                      </span>
                    ) : null}
                  </label>
                </div>

                <label className="block text-sm text-[color:var(--muted)]">
                  交付周期
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3">
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, startDate: event.target.value }))
                      }
                      className="w-full bg-transparent text-[color:var(--text)] outline-none"
                    />
                    <span className="text-xs text-[color:var(--muted)]">至</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, endDate: event.target.value }))
                      }
                      className="w-full bg-transparent text-[color:var(--text)] outline-none"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {form.startDate && form.endDate
                      ? `${formatDate(form.startDate)} - ${formatDate(form.endDate)}`
                      : "请选择起止日期"}
                  </p>
                  {formErrors.startDate || formErrors.endDate ? (
                    <span className="mt-1 block text-xs text-amber-300">
                      {formErrors.startDate || formErrors.endDate}
                    </span>
                  ) : null}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-[color:var(--muted)]">
                    学员规模
                    <input
                      value={form.learners}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, learners: event.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                      placeholder="例如：30"
                    />
                  </label>
                </div>

                <label className="block text-sm text-[color:var(--muted)]">
                  备注（可选）
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                    placeholder="补充说明与交付重点"
                  />
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  className="rounded-2xl border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
