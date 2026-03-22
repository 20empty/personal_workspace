import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createDevTask,
  DELIVERABLE_TYPE_LABELS,
  DevProjectRecord,
  DevTaskRecord,
  getArchivedTasksByProject,
  getTasksByProject,
  listDevProjects,
  moveDevTask,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TaskStatus,
  updateDevTask,
  WIP_LIMITS,
} from "../../db/devtracker";
import { CreateTaskInput } from "../../types/devtracker";
import CreateTaskModal from "./CreateTaskModal";
import DeleteDeliverableModal from "./DeleteDeliverableModal";
import TaskCardModal from "./TaskCardModal";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Clock,
  ExternalLink,
  History,
  Package,
  Plus,
  Trash2,
  Layers,
  CheckCircle,
  Archive,
  Filter,
  Activity,
} from "lucide-react";

const COLUMNS: TaskStatus[] = ["pending", "inProgress", "draftDone", "qaReview", "readyToSubmit", "submitted"];

function getDdlHeatClass(task: DevTaskRecord): string {
  if (!task.dueDate) return "border-l-2 border-l-[color:var(--border)]";
  const now = Date.now();
  const due = new Date(task.dueDate).getTime();
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "border-l-2 border-l-red-500";
  if (daysLeft <= 1) return "border-l-2 border-l-red-500 animate-pulse";
  if (daysLeft <= 3) return "border-l-2 border-l-orange-400";
  return "border-l-2 border-l-green-500";
}

function getDdlBadge(task: DevTaskRecord) {
  if (!task.dueDate) return null;
  const now = Date.now();
  const due = new Date(task.dueDate).getTime();
  const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { text: `逾期 ${-daysLeft}天`, cls: "text-red-400 bg-red-500/10" };
  if (daysLeft <= 1) return { text: "明日截止", cls: "text-red-400 bg-red-500/10 animate-pulse" };
  if (daysLeft <= 3) return { text: `${daysLeft}天后到期`, cls: "text-orange-400 bg-orange-500/10" };
  return { text: task.dueDate, cls: "text-[color:var(--muted)]" };
}

export type MoveDirection = "up" | "down" | "left" | "right";

export function getColumnTasks(tasks: DevTaskRecord[], status: TaskStatus) {
  return tasks.filter(task => task.status === status);
}

export function getTargetStatus(status: TaskStatus, direction: "left" | "right"): TaskStatus | null {
  const currentIndex = COLUMNS.indexOf(status);
  const nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
  return COLUMNS[nextIndex] ?? null;
}

interface KanbanBoardProps {
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onBackToProjects?: () => void;
}

export default function KanbanBoard({
  selectedProjectId: externalSelectedProjectId = "",
  onSelectProject,
  onBackToProjects,
}: KanbanBoardProps) {
  const [projects, setProjects] = useState<DevProjectRecord[]>([]);
  const [internalSelectedProjectId, setInternalSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState<DevTaskRecord[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<DevTaskRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DevTaskRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | DevTaskRecord["deliverableType"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [ddlFilter, setDdlFilter] = useState<"all" | "7days" | "overdue">("all");

  const selectedProjectId = externalSelectedProjectId || internalSelectedProjectId;

  useEffect(() => {
    listDevProjects().then(data => {
      setProjects(data);
      if (data.length === 0) return;
      const hasExternalSelection = externalSelectedProjectId && data.some(project => project.id === externalSelectedProjectId);
      if (hasExternalSelection) return;
      const firstProjectId = data[0].id;
      setInternalSelectedProjectId(firstProjectId);
      onSelectProject?.(firstProjectId);
    });
  }, [externalSelectedProjectId, onSelectProject]);

  const loadTasks = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const [active, archived] = await Promise.all([
        getTasksByProject(selectedProjectId, false),
        getArchivedTasksByProject(selectedProjectId),
      ]);
      setTasks(active);
      setArchivedTasks(archived);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) loadTasks();
  }, [selectedProjectId, loadTasks]);

  const filteredTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const nextWeekTs = Date.now() + 7 * 24 * 60 * 60 * 1000;

    return tasks.filter(task => {
      if (typeFilter !== "all" && task.deliverableType !== typeFilter) return false;
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (ddlFilter === "overdue" && !(task.dueDate && task.dueDate < today)) return false;
      if (ddlFilter === "7days" && !(task.dueDate && new Date(task.dueDate).getTime() <= nextWeekTs && task.dueDate >= today)) {
        return false;
      }
      return true;
    });
  }, [ddlFilter, statusFilter, tasks, typeFilter]);

  const tasksByColumn = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, status) => {
          acc[status] = getColumnTasks(filteredTasks, status);
          return acc;
        },
        {} as Record<TaskStatus, DevTaskRecord[]>
      ),
    [filteredTasks]
  );

  const selectedProject = useMemo(
    () => projects.find(project => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const handleCreateTask = async (input: CreateTaskInput) => {
    await createDevTask(input);
    await loadTasks();
  };

  const handleDeleteTask = async (id: string) => {
    await updateDevTask(id, { status: "archived" });
    await loadTasks();
  };

  const handleMoveTask = useCallback(
    async (task: DevTaskRecord, direction: MoveDirection) => {
      const sourceTasks = tasksByColumn[task.status];
      const sourceIndex = sourceTasks.findIndex(item => item.id === task.id);
      if (sourceIndex === -1) return;

      let targetStatus = task.status;
      let targetIndex = sourceIndex;

      if (direction === "up") {
        if (sourceIndex === 0) return;
        targetIndex = sourceIndex - 1;
      } else if (direction === "down") {
        if (sourceIndex === sourceTasks.length - 1) return;
        targetIndex = sourceIndex + 1;
      } else {
        const nextStatus = getTargetStatus(task.status, direction);
        if (!nextStatus) return;
        const nextColumnTasks = tasksByColumn[nextStatus];
        const limit = WIP_LIMITS[nextStatus];
        if (limit !== undefined && nextColumnTasks.length >= limit) {
          window.alert(`${TASK_STATUS_LABELS[nextStatus]} 已达到并发上限。`);
          return;
        }
        targetStatus = nextStatus;
        targetIndex = nextColumnTasks.length;
      }

      setMovingTaskId(task.id);
      try {
        await moveDevTask(task.id, targetStatus, targetIndex);
        await loadTasks();
      } finally {
        setMovingTaskId(null);
      }
    },
    [loadTasks, tasksByColumn]
  );

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-[color:var(--muted)]">
        <p>暂无课程项目，请先新建一个课程项目</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-220px)] flex-col gap-4">
        {selectedProject && (
          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--border)] bg-gradient-to-br from-[color:var(--panel)] to-[color:var(--background)] p-6 shadow-sm">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {onBackToProjects && (
                    <button
                      type="button"
                      onClick={onBackToProjects}
                      className="group flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--background)]/50 px-3 py-1.5 text-xs font-medium text-[color:var(--muted)] backdrop-blur-md transition-all hover:border-[color:var(--muted)] hover:text-[color:var(--text)]"
                    >
                      <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                      <span>返回项目列表</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--background)]/30 px-3 py-1.5 backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                    </span>
                    <span className="text-xs font-medium text-[color:var(--text)]">
                      {PROJECT_STATUS_LABELS[selectedProject.status]}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[color:var(--text)]">{selectedProject.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[color:var(--muted)]">
                    <span className="flex items-center gap-1.5 rounded-lg bg-[color:var(--background)] px-2 py-1">
                      <Clock size={13} className="text-blue-500" />
                      {selectedProject.startDate} <span className="text-[color:var(--border)]">至</span> {selectedProject.endDate}
                    </span>
                    {selectedProject.source && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-[color:var(--background)] px-2 py-1">
                        <Package size={13} className="text-violet-500" />
                        {selectedProject.source}
                      </span>
                    )}
                  </div>
                </div>
                {selectedProject.description && (
                  <p className="text-sm leading-relaxed text-[color:var(--muted-strong)]">{selectedProject.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:grid-cols-2 xl:flex xl:flex-nowrap">
                <SummaryChip label="总交付物" value={String(tasks.length)} icon={<Layers size={14} />} color="blue" />
                <SummaryChip label="制作中" value={String(tasksByColumn.inProgress.length)} icon={<Activity size={14} />} color="orange" />
                <SummaryChip label="待提交" value={String(tasksByColumn.readyToSubmit.length)} icon={<CheckCircle size={14} />} color="emerald" />
                <SummaryChip label="已归档" value={String(archivedTasks.length)} icon={<Archive size={14} />} color="zinc" />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)]/60 px-4 py-3 backdrop-blur-lg">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-[color:var(--background)] px-3 py-1.5 text-xs text-[color:var(--muted)] shadow-inner">
              <Filter size={14} className="opacity-70" />
              <span className="font-semibold uppercase tracking-wider">视图筛选</span>
            </div>
            <select
              value={selectedProjectId}
              onChange={e => {
                const projectId = e.target.value;
                setInternalSelectedProjectId(projectId);
                onSelectProject?.(projectId);
              }}
              className="appearance-none rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-1.5 text-sm font-medium text-[color:var(--text)] transition-all hover:border-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="" disabled>选择课程项目...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.title}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
              className="appearance-none rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-1.5 text-sm font-medium text-[color:var(--text)] transition-all hover:border-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">全部类型</option>
              <option value="slides">PPT</option>
              <option value="lab">实验手册</option>
              <option value="notes">讲师备注</option>
              <option value="other">其他</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="appearance-none rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-1.5 text-sm font-medium text-[color:var(--text)] transition-all hover:border-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">全部阶段</option>
              {COLUMNS.map(status => (
                <option key={status} value={status}>
                  {TASK_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <select
              value={ddlFilter}
              onChange={e => setDdlFilter(e.target.value as typeof ddlFilter)}
              className="appearance-none rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-1.5 text-sm font-medium text-[color:var(--text)] transition-all hover:border-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">全部 DDL</option>
              <option value="7days">⌛ 7 天内到期</option>
              <option value="overdue">🚨 仅逾期</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(s => !s)}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                showHistory
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-sm"
                  : "border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--text)] shadow-sm hover:border-[color:var(--muted)]"
              }`}
            >
              <History size={16} className={showHistory ? "text-blue-400" : "text-[color:var(--muted-strong)]"} />
              <span>归档记录 ({archivedTasks.length})</span>
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              disabled={!selectedProjectId}
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[color:var(--panel)] disabled:opacity-50"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                <div className="relative h-full w-8 bg-white/20" />
              </div>
              <Plus size={16} />
              <span>新建交付物</span>
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="flex-shrink-0 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-400">已归档交付物</p>
            {archivedTasks.length === 0 ? (
              <p className="text-xs text-[color:var(--muted)]">暂无归档记录</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {archivedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1.5">
                    <span className="text-xs text-[color:var(--text)]">{task.title}</span>
                    <span className="text-[10px] text-[color:var(--muted)]">{DELIVERABLE_TYPE_LABELS[task.deliverableType]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[color:var(--muted)]">加载中...</p>
          </div>
        ) : (
          <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
            {COLUMNS.map(status => (
              <Column
                key={status}
                status={status}
                tasks={tasksByColumn[status]}
                movingTaskId={movingTaskId}
                onDelete={(id, title) => setPendingDelete({ id, title })}
                onCardClick={setSelectedTask}
                onMoveTask={handleMoveTask}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        isOpen={isCreateOpen}
        projectId={selectedProjectId}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
      />
      {selectedTask && <TaskCardModal task={selectedTask} onClose={() => setSelectedTask(null)} onSaved={loadTasks} />}
      {pendingDelete && (
        <DeleteDeliverableModal
          title={pendingDelete.title}
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await handleDeleteTask(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
}

function Column({
  status,
  tasks,
  movingTaskId,
  onDelete,
  onCardClick,
  onMoveTask,
}: {
  status: TaskStatus;
  tasks: DevTaskRecord[];
  movingTaskId: string | null;
  onDelete: (id: string, title: string) => void;
  onCardClick: (task: DevTaskRecord) => void;
  onMoveTask: (task: DevTaskRecord, direction: MoveDirection) => Promise<void>;
}) {
  const limit = WIP_LIMITS[status];
  const isAtLimit = limit !== undefined && tasks.length >= limit;

  return (
    <div className={`flex h-full w-72 flex-shrink-0 flex-col rounded-2xl border ${isAtLimit ? "border-orange-500/40" : "border-[color:var(--border)]"} bg-[color:var(--panel)]`}>
      <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
        <div>
          <span className="text-xs font-semibold text-[color:var(--text)]">{TASK_STATUS_LABELS[status]}</span>
          {status === "inProgress" && <span className="ml-2 text-[9px] text-[color:var(--muted)]">WIP ≤ 3</span>}
        </div>
        <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${isAtLimit ? "bg-orange-500/20 text-orange-400" : "bg-[color:var(--background)] text-[color:var(--text)]"}`}>
          {tasks.length}
        </div>
      </div>

      {isAtLimit && <div className="mx-3 mt-2 rounded-lg bg-orange-500/10 px-3 py-1.5 text-[10px] text-orange-400">并发交付物已达上限</div>}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-[color:var(--border)]">
            <p className="text-xs text-[color:var(--muted)]">暂无交付物</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              isMoving={movingTaskId === task.id}
              canMoveUp={index > 0}
              canMoveDown={index < tasks.length - 1}
              canMoveLeft={COLUMNS.indexOf(status) > 0}
              canMoveRight={COLUMNS.indexOf(status) < COLUMNS.length - 1}
              onDelete={onDelete}
              onCardClick={onCardClick}
              onMoveTask={onMoveTask}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SummaryChip({ label, value, icon, color }: { label: string; value: string; icon?: React.ReactNode; color?: 'blue' | 'emerald' | 'orange' | 'zinc' }) {
  const colorStyles = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    zinc: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
    default: "text-[color:var(--text)] bg-[color:var(--background)] border-[color:var(--border)]",
  };
  
  const selectedStyle = color ? colorStyles[color] : colorStyles.default;

  return (
    <div className={`group flex min-w-[120px] flex-1 items-center gap-4 rounded-2xl border px-4 py-3 transition-colors hover:shadow-sm ${selectedStyle}`}>
      {icon && (
        <div className="shrink-0 p-1 opacity-80 transition-transform group-hover:scale-110 group-hover:opacity-100">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-xl font-bold tracking-tight">{value}</span>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  isMoving,
  canMoveUp,
  canMoveDown,
  canMoveLeft,
  canMoveRight,
  onDelete,
  onCardClick,
  onMoveTask,
}: {
  task: DevTaskRecord;
  isMoving: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onDelete: (id: string, title: string) => void;
  onCardClick: (task: DevTaskRecord) => void;
  onMoveTask: (task: DevTaskRecord, direction: MoveDirection) => Promise<void>;
}) {
  const ddlBadge = getDdlBadge(task);
  const heatClass = getDdlHeatClass(task);
  const progress = task.subTasks.length > 0 ? Math.round((task.subTasks.filter(s => s.done).length / task.subTasks.length) * 100) : -1;

  const priorityBadge: Record<string, string> = {
    high: "text-red-400 bg-red-500/10",
    medium: "text-yellow-400 bg-yellow-500/10",
    low: "text-blue-400 bg-blue-500/10",
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest("button,a")) onCardClick(task);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 transition-all hover:border-[color:var(--muted)] hover:shadow-md ${heatClass} ${isMoving ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1 text-[9px] text-[color:var(--muted)]">
            <Package size={10} />
            <span>{DELIVERABLE_TYPE_LABELS[task.deliverableType]}</span>
            {task.assignee && <span>· {task.assignee}</span>}
          </div>
          <h4 className="text-xs font-semibold leading-snug text-[color:var(--text)]">{task.title}</h4>
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete(task.id, task.title);
          }}
          className="shrink-0 p-0.5 text-[color:var(--muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {task.blocker && <div className="line-clamp-1 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400">阻塞：{task.blocker}</div>}
      {task.contextNote && <div className="line-clamp-1 rounded-md bg-yellow-500/10 px-2 py-1 text-[10px] text-yellow-400">{task.contextNote}</div>}

      {progress >= 0 && (
        <div>
          <div className="mb-0.5 flex justify-between text-[9px] text-[color:var(--muted)]">
            <span>子任务</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[color:var(--border)]">
            <div className={`h-full rounded-full transition-all ${progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-orange-400"}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {(task.status === "qaReview" || task.status === "readyToSubmit") && task.reviewerName && (
        <div className="text-[9px] text-[color:var(--muted)]">{task.reviewerName} {task.reviewerEta && `· 预计 ${task.reviewerEta}`}</div>
      )}

      <div className="mt-1 grid grid-cols-2 gap-1">
        <MoveButton icon={<ArrowLeft size={12} />} label="前一列" disabled={!canMoveLeft || isMoving} onClick={() => onMoveTask(task, "left")} />
        <MoveButton icon={<ArrowRight size={12} />} label="后一列" disabled={!canMoveRight || isMoving} onClick={() => onMoveTask(task, "right")} />
        <MoveButton icon={<ArrowUp size={12} />} label="上移" disabled={!canMoveUp || isMoving} onClick={() => onMoveTask(task, "up")} />
        <MoveButton icon={<ArrowDown size={12} />} label="下移" disabled={!canMoveDown || isMoving} onClick={() => onMoveTask(task, "down")} />
      </div>

      <div className="mt-0.5 flex items-center justify-between">
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${priorityBadge[task.priority]}`}>{task.priority}</span>
        <div className="flex items-center gap-2">
          {task.docUrl && (
            <a
              href={task.docUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[color:var(--muted)] transition-colors hover:text-blue-400"
            >
              <ExternalLink size={11} />
            </a>
          )}
          {ddlBadge && (
            <span className={`flex items-center gap-1 rounded px-1 py-0.5 text-[9px] ${ddlBadge.cls}`}>
              <Clock size={9} />
              {ddlBadge.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MoveButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center justify-center gap-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--panel)] px-2 py-1.5 text-[10px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
