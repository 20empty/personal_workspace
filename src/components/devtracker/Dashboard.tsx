import React, { useEffect, useMemo, useState } from "react";
import {
  DELIVERABLE_TYPE_LABELS,
  DevProjectRecord,
  DevTaskRecord,
  getDevStats,
  getTasksByProject,
  listDevProjects,
  TASK_STATUS_LABELS,
  type DevStats,
} from "../../db/devtracker";
import { AlertTriangle, CheckCircle, Clock3, FolderKanban } from "lucide-react";

type BoardData = {
  stats: DevStats;
  projects: DevProjectRecord[];
  tasks: DevTaskRecord[];
};

function daysUntil(dateStr: string) {
  const today = new Date();
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.ceil((target.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const [data, setData] = useState<BoardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, projects] = await Promise.all([getDevStats(), listDevProjects()]);
        const taskGroups = await Promise.all(projects.map(project => getTasksByProject(project.id, true)));
        setData({ stats, projects, tasks: taskGroups.flat() });
      } catch (err) {
        console.error("Failed to fetch workspace stats:", err);
      }
    };

    fetchData();
  }, []);

  const projectMap = useMemo(
    () => new Map((data?.projects ?? []).map(project => [project.id, project])),
    [data?.projects]
  );

  const nearDue = useMemo(
    () =>
      (data?.tasks ?? [])
        .filter(task => task.status !== "submitted" && task.status !== "archived" && task.dueDate)
        .map(task => ({ task, project: projectMap.get(task.projectId), daysLeft: daysUntil(task.dueDate) }))
        .filter(item => item.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 6),
    [data?.tasks, projectMap]
  );

  const qaItems = useMemo(
    () =>
      (data?.tasks ?? [])
        .filter(task => task.status === "qaReview")
        .map(task => ({ task, project: projectMap.get(task.projectId) }))
        .slice(0, 6),
    [data?.tasks, projectMap]
  );

  const readyItems = useMemo(
    () =>
      (data?.tasks ?? [])
        .filter(task => task.status === "draftDone" || task.status === "readyToSubmit")
        .map(task => ({ task, project: projectMap.get(task.projectId) }))
        .slice(0, 6),
    [data?.tasks, projectMap]
  );

  const projectProgress = useMemo(
    () => (data?.projects ?? []).filter(project => project.status !== "archived").slice(0, 6),
    [data?.projects]
  );

  const missingDeliverables = useMemo(
    () =>
      (data?.projects ?? [])
        .map(project => {
          const projectTasks = (data?.tasks ?? []).filter(task => task.projectId === project.id && task.status !== "archived");
          const hasSlides = projectTasks.some(task => task.deliverableType === "slides");
          const hasLab = projectTasks.some(task => task.deliverableType === "lab");
          const missing = [!hasSlides ? "PPT" : null, !hasLab ? "实验手册" : null].filter(Boolean);
          return { project, missing };
        })
        .filter(item => item.missing.length > 0)
        .slice(0, 6),
    [data?.projects, data?.tasks]
  );

  const blockers = useMemo(
    () =>
      (data?.tasks ?? [])
        .filter(task => task.blocker.trim())
        .map(task => ({ task, project: projectMap.get(task.projectId) }))
        .slice(0, 6),
    [data?.tasks, projectMap]
  );

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-[color:var(--muted)]">加载工作台数据中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-semibold text-[color:var(--text)]">讲师工作台</h2>
        <p className="mt-1 text-sm text-[color:var(--muted)]">聚焦本周 DDL、QA 卡点、待提交内容和课程项目完成度。</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="课程项目总数" value={data.stats.totalProjects} icon={<FolderKanban className="h-6 w-6 text-blue-500" />} />
        <StatCard title="临近 / 逾期 DDL" value={data.stats.overdueDeliverables + nearDue.filter(item => item.daysLeft >= 0).length} icon={<Clock3 className="h-6 w-6 text-orange-500" />} />
        <StatCard title="QA评审中" value={data.stats.qaDeliverables} icon={<AlertTriangle className="h-6 w-6 text-violet-500" />} />
        <StatCard title="待提交终稿" value={data.stats.readyToSubmitDeliverables} icon={<CheckCircle className="h-6 w-6 text-green-500" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="本周临近 DDL 交付物">
          {nearDue.length === 0 ? (
            <EmptyState text="未来 7 天没有临近 DDL 的交付物。" />
          ) : (
            nearDue.map(({ task, project, daysLeft }) => (
              <ListRow
                key={task.id}
                title={task.title}
                meta={`${project?.title ?? "未分组"} · ${DELIVERABLE_TYPE_LABELS[task.deliverableType]}`}
                badge={daysLeft < 0 ? `逾期 ${Math.abs(daysLeft)} 天` : daysLeft === 0 ? "今天到期" : `${daysLeft} 天后到期`}
                badgeClass={daysLeft <= 1 ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"}
              />
            ))
          )}
        </Panel>

        <Panel title="卡在 QA 的交付物">
          {qaItems.length === 0 ? (
            <EmptyState text="当前没有停留在 QA 阶段的交付物。" />
          ) : (
            qaItems.map(({ task, project }) => (
              <ListRow
                key={task.id}
                title={task.title}
                meta={`${project?.title ?? "未分组"} · ${task.reviewerName || "待填写评审人"}`}
                badge={task.reviewerEta || "待回收"}
                badgeClass="bg-violet-500/10 text-violet-400"
              />
            ))
          )}
        </Panel>

        <Panel title="已完成初稿但未终稿">
          {readyItems.length === 0 ? (
            <EmptyState text="当前没有待推进到终稿的交付物。" />
          ) : (
            readyItems.map(({ task, project }) => (
              <ListRow
                key={task.id}
                title={task.title}
                meta={`${project?.title ?? "未分组"} · ${TASK_STATUS_LABELS[task.status]}`}
                badge={task.draftCompletedAt ? `初稿 ${task.draftCompletedAt.slice(0, 10)}` : "待补时间"}
                badgeClass="bg-sky-500/10 text-sky-400"
              />
            ))
          )}
        </Panel>

        <Panel title="项目完成率概览">
          {projectProgress.length === 0 ? (
            <EmptyState text="暂无课程项目。" />
          ) : (
            projectProgress.map(project => (
              <div key={project.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]/70 p-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[color:var(--text)]">{project.title}</p>
                    <p className="text-xs text-[color:var(--muted)]">{project.endDate} 截止</p>
                  </div>
                  <span className="text-sm font-semibold text-[color:var(--text)]">{project.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--border)]">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            ))
          )}
        </Panel>

        <Panel title="按课程看缺件">
          {missingDeliverables.length === 0 ? (
            <EmptyState text="所有课程项目都已具备 PPT 与实验手册。" />
          ) : (
            missingDeliverables.map(({ project, missing }) => (
              <ListRow
                key={project.id}
                title={project.title}
                meta={project.source || "未填写来源"}
                badge={`缺少 ${missing.join(" / ")}`}
                badgeClass="bg-red-500/10 text-red-400"
              />
            ))
          )}
        </Panel>

        <Panel title="按阶段看阻塞">
          {blockers.length === 0 ? (
            <EmptyState text="当前没有标记阻塞的交付物。" />
          ) : (
            blockers.map(({ task, project }) => (
              <ListRow
                key={task.id}
                title={task.title}
                meta={`${project?.title ?? "未分组"} · ${TASK_STATUS_LABELS[task.status]}`}
                badge={task.blocker}
                badgeClass="bg-amber-500/10 text-amber-400"
              />
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 transition-all hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-[color:var(--muted)]">{title}</p>
        <p className="mt-2 text-3xl font-bold text-[color:var(--text)]">{value}</p>
      </div>
      <div className="rounded-full bg-[color:var(--background)] p-4 shadow-sm">{icon}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
      <h3 className="mb-4 text-sm font-medium text-[color:var(--muted)]">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ListRow({
  title,
  meta,
  badge,
  badgeClass,
}: {
  title: string;
  meta: string;
  badge: string;
  badgeClass: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]/70 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[color:var(--text)]">{title}</p>
        <p className="mt-1 truncate text-xs text-[color:var(--muted)]">{meta}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${badgeClass}`}>{badge}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted)]">{text}</div>;
}
