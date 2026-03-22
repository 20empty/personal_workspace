import { useEffect, useState } from "react";
import {
  createDevProject,
  createDevTask,
  deleteDevProject,
  DevProjectInput,
  DevProjectSummaryRecord,
  DELIVERABLE_TYPE_LABELS,
  getQuarterLabel,
  getProjectMissingDeliverables,
  listDevProjectSummaries,
  PROJECT_STATUS_LABELS,
  ProjectStatus,
  updateDevProject,
} from "../../db/devtracker";
import { Calendar, CheckCircle, Pencil, Play, Plus, Search, Trash2, Archive, Package } from "lucide-react";
import CreateProjectModal from "./CreateProjectModal";
import { CreateProjectInput } from "../../types/devtracker";

const STATUS_FILTERS: Array<{ key: "all" | ProjectStatus; label: string }> = [
  { key: "all", label: "全部" },
  { key: "planning", label: "待启动" },
  { key: "inProgress", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "archived", label: "已归档" },
];

interface ProjectListProps {
  onOpenBoard?: (projectId: string) => void;
}

const baseTemplates = [
  {
    title: "课程 PPT",
    deliverableType: "slides" as const,
    description: "默认模板：维护课程演示文稿的初稿、QA 与终稿。",
  },
  {
    title: "实验手册",
    deliverableType: "lab" as const,
    description: "默认模板：维护实验步骤、环境验证与终稿提交。",
  },
];

export default function ProjectList({ onOpenBoard }: ProjectListProps) {
  const [projects, setProjects] = useState<DevProjectSummaryRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DevProjectSummaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");
      setProjects(await listDevProjectSummaries());
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError("课程项目加载失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (input: CreateProjectInput) => {
    try {
      setError("");
      const autoCode = `COURSE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const projectId = await createDevProject({
        code: autoCode,
        title: input.name,
        description: input.description,
        source: input.source,
        poCount: input.poCount ? Number.parseInt(input.poCount, 10) || 0 : 0,
        startDate: input.startDate,
        endDate: input.endDate,
        status: "planning",
        priority: "medium",
        progress: 0,
      });

      await Promise.all(
        baseTemplates.map((template, index) =>
          createDevTask({
            projectId,
            title: template.title,
            description: template.description,
            deliverableType: template.deliverableType,
            status: "pending",
            priority: index === 0 ? "high" : "medium",
            dueDate: input.endDate,
            subTasks: [{ id: crypto.randomUUID(), title: "明确本次版本范围与目录", done: false }],
          })
        )
      );

      await loadProjects();
    } catch (err: any) {
      console.error("HandleCreate error:", err);
      setError("创建课程项目失败，请稍后重试。");
      throw err;
    }
  };

  const handleUpdate = async (input: CreateProjectInput) => {
    if (!editingProject) return;
    setPendingAction(`edit:${editingProject.id}`);
    setError("");
    try {
      await updateDevProject(editingProject.id, {
        title: input.name,
        description: input.description,
        source: input.source,
        poCount: input.poCount ? Number.parseInt(input.poCount, 10) || 0 : 0,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      await loadProjects();
      setEditingProject(null);
    } catch (err) {
      console.error("Failed to update project:", err);
      setError("更新课程项目失败，请稍后重试。");
      throw err;
    } finally {
      setPendingAction(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProjectStatus) => {
    const patch: Partial<DevProjectInput> = { status: newStatus };
    if (newStatus === "inProgress") patch.progress = 10;
    if (newStatus === "completed" || newStatus === "archived") patch.progress = 100;

    setPendingAction(`status:${id}`);
    setError("");
    try {
      await updateDevProject(id, patch);
      await loadProjects();
    } catch (err) {
      console.error("Failed to update project status:", err);
      setError("更新课程项目状态失败，请稍后重试。");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    setPendingAction(`delete:${id}`);
    setError("");
    try {
      await deleteDevProject(id);
      await loadProjects();
    } catch (err) {
      console.error(`Failed to delete project "${title}":`, err);
      setError(`删除课程项目“${title}”失败，请稍后重试。`);
    } finally {
      setPendingAction(null);
    }
  };

  if (loading) return <div className="p-8 text-[color:var(--muted)]">加载中...</div>;

  const visibleProjects = projects.filter(project =>
    (statusFilter === "all" ? true : project.status === statusFilter) &&
    (searchQuery.trim()
      ? `${project.title} ${project.description} ${project.source}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--text)]">课程项目</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">每个课程项目默认生成 PPT 与实验手册模板，保持录入轻量。</p>
        </div>
        <button
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>新建课程项目</span>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setStatusFilter(filter.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              statusFilter === filter.key
                ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                : "border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3">
        <Search size={16} className="text-[color:var(--muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索课程名称、来源或备注"
          className="w-full bg-transparent text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.length === 0 ? (
          <div className="col-span-full flex h-48 flex-col items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)]">
            <p className="text-[color:var(--muted)]">
              {projects.length === 0 ? "暂无课程项目，点击右上角新建" : "当前筛选条件下暂无课程项目"}
            </p>
          </div>
        ) : (
          visibleProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              pendingAction={pendingAction}
              onOpenBoard={onOpenBoard}
              onEdit={setEditingProject}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <CreateProjectModal
        isOpen={isModalOpen && !editingProject}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        title="新建课程项目"
        submitLabel="创建"
      />
      <CreateProjectModal
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        onSubmit={handleUpdate}
        title="编辑课程项目"
        submitLabel="保存修改"
        initialData={
          editingProject
            ? {
                name: editingProject.title,
                description: editingProject.description,
                source: editingProject.source,
                poCount: editingProject.poCount > 0 ? String(editingProject.poCount) : "",
                startDate: editingProject.startDate,
                endDate: editingProject.endDate,
              }
            : null
        }
      />
    </div>
  );
}

function ProjectCard({
  project,
  pendingAction,
  onOpenBoard,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  project: DevProjectSummaryRecord;
  pendingAction: string | null;
  onOpenBoard?: (projectId: string) => void;
  onEdit: (project: DevProjectSummaryRecord) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const statusColor: Record<ProjectStatus, string> = {
    planning: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    inProgress: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    archived: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  };

  const progressColor: Record<ProjectStatus, string> = {
    planning: "bg-blue-500",
    inProgress: "bg-orange-500",
    completed: "bg-green-500",
    archived: "bg-zinc-500",
  };

  const isStatusPending = pendingAction === `status:${project.id}`;
  const isDeletePending = pendingAction === `delete:${project.id}`;
  const isEditPending = pendingAction === `edit:${project.id}`;
  const isPending = isStatusPending || isDeletePending;
  const missingTypes = getProjectMissingDeliverables(project).map(type => DELIVERABLE_TYPE_LABELS[type]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenBoard?.(project.id)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenBoard?.(project.id);
        }
      }}
      className={`flex flex-col justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 text-left transition-shadow hover:shadow-md ${isPending || isEditPending ? "opacity-70" : ""}`}
    >
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold leading-tight text-[color:var(--text)]">{project.title}</h3>
            {project.source && <p className="mt-1 text-xs text-[color:var(--muted)]">{project.source}</p>}
          </div>
          <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor[project.status]}`}>
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>

        {project.description && <p className="mb-4 line-clamp-2 text-xs text-[color:var(--muted)]">{project.description}</p>}

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
          <div className="flex items-center space-x-1">
            <Calendar size={14} />
            <span>{project.startDate} 至 {project.endDate}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-1.5 w-1.5 rounded-full bg-sky-500/50" />
            <span>{getQuarterLabel(project.endDate)}</span>
          </div>
          {project.poCount > 0 && (
            <div className="flex items-center space-x-1">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500/50" />
              <span>PO {project.poCount}</span>
            </div>
          )}
        </div>

        <div className="mb-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)]/70 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-[color:var(--muted)]">
            <span className="flex items-center gap-1">
              <Package size={13} />
              交付物概览
            </span>
            <span>{project.deliverableCount} 项</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <span className="rounded-full bg-slate-500/10 px-2 py-1 text-slate-400">待启动 {project.pendingCount}</span>
            <span className="rounded-full bg-orange-500/10 px-2 py-1 text-orange-400">制作中 {project.inProgressCount}</span>
            <span className="rounded-full bg-sky-500/10 px-2 py-1 text-sky-400">初稿 {project.draftDoneCount}</span>
            <span className="rounded-full bg-violet-500/10 px-2 py-1 text-violet-400">QA {project.qaReviewCount}</span>
            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-400">待提交 {project.readyToSubmitCount}</span>
            <span className="rounded-full bg-green-500/10 px-2 py-1 text-green-400">已提交 {project.submittedCount}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
            <span className="rounded-full border border-[color:var(--border)] px-2 py-1 text-[color:var(--muted)]">PPT {project.slidesCount}</span>
            <span className="rounded-full border border-[color:var(--border)] px-2 py-1 text-[color:var(--muted)]">实验手册 {project.labCount}</span>
            {missingTypes.length > 0 && (
              <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-400">缺件：{missingTypes.join(" / ")}</span>
            )}
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-[color:var(--muted)]">项目完成度</span>
            <span className="font-medium text-[color:var(--text)]">{project.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--background)]">
            <div className={`h-full rounded-full transition-all duration-500 ${progressColor[project.status]}`} style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 border-t border-[color:var(--border)] pt-4">
        <button
          type="button"
          disabled={isPending || isEditPending}
          onClick={e => {
            e.stopPropagation();
            onEdit(project);
          }}
          className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-sky-500 transition-colors hover:bg-sky-500/10"
        >
          <Pencil size={14} />
          <span>{isEditPending ? "保存中..." : "编辑"}</span>
        </button>
        {project.status === "planning" && (
          <button
            type="button"
            disabled={isPending || isEditPending}
            onClick={e => {
              e.stopPropagation();
              onStatusChange(project.id, "inProgress");
            }}
            className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-orange-500 hover:bg-orange-500/10 transition-colors"
          >
            <Play size={14} />
            <span>{isStatusPending ? "处理中..." : "开始执行"}</span>
          </button>
        )}
        {project.status === "inProgress" && (
          <button
            type="button"
            disabled={isPending || isEditPending}
            onClick={e => {
              e.stopPropagation();
              onStatusChange(project.id, "completed");
            }}
            className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/10 transition-colors"
          >
            <CheckCircle size={14} />
            <span>{isStatusPending ? "处理中..." : "标记完成"}</span>
          </button>
        )}
        {project.status === "completed" && (
          <button
            type="button"
            disabled={isPending || isEditPending}
            onClick={e => {
              e.stopPropagation();
              onStatusChange(project.id, "archived");
            }}
            className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-500/10 transition-colors"
          >
            <Archive size={14} />
            <span>{isStatusPending ? "处理中..." : "归档"}</span>
          </button>
        )}
        <button
          type="button"
          disabled={isPending || isEditPending}
          onClick={e => {
            e.stopPropagation();
            onDelete(project.id, project.title);
          }}
          className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={14} />
          <span>{isDeletePending ? "删除中..." : "删除"}</span>
        </button>
      </div>
    </div>
  );
}

