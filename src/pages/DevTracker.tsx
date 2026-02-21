export default function DevTracker() {
  return (
    <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
        Dev Tracker
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">开发任务</h1>
      <p className="mt-4 text-sm text-[color:var(--muted)]">
        Kanban / 任务列表的骨架将在此呈现。
      </p>
    </div>
  );
}
