import { useEffect, useMemo, useRef, useState } from "react";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  File as FileIcon,
  FileText,
  FolderOpen,
  Image,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  DELIVERABLE_TYPE_LABELS,
  DevTaskRecord,
  QAChecklist,
  RefLink,
  TASK_STATUS_LABELS,
  updateDevTask,
} from "../../db/devtracker";

const INPUT_CLASS =
  "w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 px-4 py-3 text-sm text-[color:var(--text)] placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all";

type DetailTab = "overview" | "files" | "qa" | "more";

export function normalizeLocalFileUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("file://")) return path;
  return `file://${path}`;
}

export function getFileDisplayName(url: string): string {
  if (!url) return "未选择文件";
  return url.replace("file://", "").split(/[\\/]/).pop() || url;
}

function getFileIcon(url: string) {
  const lower = url.toLowerCase();
  if (lower.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return Image;
  if (lower.match(/\.(doc|docx|pages|ppt|pptx|pdf)$/)) return FileText;
  return FileIcon;
}

function isLocalFile(url: string) {
  return url.startsWith("file://") || url.startsWith("/") || /^[A-Za-z]:\\/.test(url);
}

async function openRef(url: string) {
  try {
    if (isLocalFile(url)) {
      await openPath(url.replace(/^file:\/\//, ""));
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    console.error("Failed to open ref:", error);
  }
}

async function pickLocalFile() {
  const selected = await openFileDialog({
    multiple: false,
    directory: false,
  });
  if (!selected || Array.isArray(selected)) return "";
  return normalizeLocalFileUrl(selected);
}

function formatDateLabel(value: string) {
  return value ? value.slice(0, 10) : "未记录";
}

function completionRing(progress: number, r: number = 20) {
  const circumference = 2 * Math.PI * r;
  return circumference - (progress / 100) * circumference;
}

function RefsList({
  refs,
  onAdd,
  onRemove,
}: {
  refs: RefLink[];
  onAdd: (ref: RefLink) => void;
  onRemove: (id: string) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const addUrl = () => {
    if (!newUrl.trim()) return;
    onAdd({ id: crypto.randomUUID(), title: newTitle.trim() || newUrl.trim(), url: newUrl.trim() });
    setNewTitle("");
    setNewUrl("");
  };

  const addLocalFile = async () => {
    const picked = await pickLocalFile();
    if (!picked) return;
    onAdd({ id: crypto.randomUUID(), title: getFileDisplayName(picked), url: picked });
  };

  return (
    <div className="space-y-3">
      {refs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-5 text-sm text-[color:var(--muted)]">
          还没有参考素材，按需补充即可。
        </div>
      ) : (
        <div className="space-y-2">
          {refs.map(ref => {
            const Icon = getFileIcon(ref.url);
            return (
              <div key={ref.id} className="group flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 px-4 py-3">
                <div className="rounded-xl bg-[color:var(--panel)] p-2 text-[color:var(--muted)]">
                  <Icon size={14} />
                </div>
                <button onClick={() => openRef(ref.url)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-[color:var(--text)]">{ref.title || getFileDisplayName(ref.url)}</p>
                  <p className="truncate text-xs text-[color:var(--muted)]">{getFileDisplayName(ref.url)}</p>
                </button>
                <button
                  onClick={() => onRemove(ref.id)}
                  className="rounded-xl p-2 text-[color:var(--muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-[color:var(--text)]">新增参考素材</p>
          <button
            onClick={addLocalFile}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--muted)] transition-colors hover:text-[color:var(--text)]"
          >
            <FolderOpen size={14} />
            选择文件
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-[0.9fr_1.1fr_auto]">
          <input
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none"
            placeholder="标题(可选)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <input
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none"
            placeholder="URL / 本地路径"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addUrl()}
          />
          <button
            onClick={addUrl}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[color:var(--panel)] px-4 py-2 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--panel-strong)]"
          >
            <Plus size={14} />
            添加
          </button>
        </div>
      </div>
    </div>
  );
}

function FileFieldCard({
  label,
  value,
  placeholder,
  onChange,
  allowManualInput = true,
  showPickerButton = true,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  allowManualInput?: boolean;
  showPickerButton?: boolean;
}) {
  const Icon = getFileIcon(value || "");
  const pickFile = async () => {
    const picked = await pickLocalFile();
    if (!picked) return;
    onChange(picked);
  };

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[color:var(--text)]">{label}</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">{value ? getFileDisplayName(value) : "未选择文件"}</p>
        </div>
        <div className="rounded-xl bg-[color:var(--panel)] p-2 text-[color:var(--muted)]">
          <Icon size={15} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showPickerButton && (
          <button
            onClick={pickFile}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            <FolderOpen size={14} />
            选择文件
          </button>
        )}
        {value && (
          <button
            onClick={() => openRef(value)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--muted)] transition-colors hover:text-[color:var(--text)]"
          >
            <ExternalLink size={14} />
            打开
          </button>
        )}
      </div>

      {allowManualInput && (
        <input
          className="mt-3 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

interface TaskCardModalProps {
  task: DevTaskRecord;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskCardModal({ task, onClose, onSaved }: TaskCardModalProps) {
  const [draft, setDraft] = useState<DevTaskRecord>({ ...task });
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [newSubTask, setNewSubTask] = useState("");
  const [saving, setSaving] = useState(false);
  const [qaError, setQaError] = useState(false);
  const nextStepRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nextStepRef.current?.focus();
  }, []);

  const subTaskProgress = useMemo(() => {
    if (draft.subTasks.length === 0) return 0;
    return Math.round((draft.subTasks.filter(subTask => subTask.done).length / draft.subTasks.length) * 100);
  }, [draft.subTasks]);

  const handleSave = async () => {
    if (draft.status === "readyToSubmit" && Object.values(draft.qaChecklist).some(value => !value)) {
      setQaError(true);
      setActiveTab("qa");
      return;
    }

    setSaving(true);
    try {
      await updateDevTask(task.id, {
        title: draft.title,
        description: draft.description,
        deliverableType: draft.deliverableType,
        priority: draft.priority,
        assignee: draft.assignee,
        dueDate: draft.dueDate,
        blocker: draft.blocker,
        contextNote: draft.contextNote,
        docUrl: draft.docUrl,
        baselineUrl: draft.baselineUrl,
        finalDocUrl: draft.finalDocUrl,
        refs: draft.refs,
        subTasks: draft.subTasks,
        reviewerName: draft.reviewerName,
        reviewerEta: draft.reviewerEta,
        qaChecklist: draft.qaChecklist,
        draftCompletedAt: draft.draftCompletedAt,
        qaCompletedAt: draft.qaCompletedAt,
        submittedAt: draft.submittedAt,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleSubTask = (id: string) => {
    setDraft(current => ({
      ...current,
      subTasks: current.subTasks.map(subTask => (subTask.id === id ? { ...subTask, done: !subTask.done } : subTask)),
    }));
  };

  const addSubTask = () => {
    if (!newSubTask.trim()) return;
    setDraft(current => ({
      ...current,
      subTasks: [...current.subTasks, { id: crypto.randomUUID(), title: newSubTask.trim(), done: false }],
    }));
    setNewSubTask("");
  };

  const setQA = (key: keyof QAChecklist, value: boolean) => {
    setDraft(current => ({ ...current, qaChecklist: { ...current.qaChecklist, [key]: value } }));
    setQaError(false);
  };

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: "overview", label: "概览" },
    { id: "files", label: "文件" },
    { id: "qa", label: "QA" },
    { id: "more", label: "更多" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="flex min-h-full items-start justify-center p-4 pb-16 pt-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--panel)] shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
          <div className="border-b border-[color:var(--border)] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] px-8 py-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-sky-500 shadow-sm">
                    {DELIVERABLE_TYPE_LABELS[draft.deliverableType]}
                  </span>
                  <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--background)]/80 px-3 py-1 text-xs font-medium text-[color:var(--muted-strong)] shadow-sm backdrop-blur-md">
                    {TASK_STATUS_LABELS[draft.status]}
                  </span>
                  {draft.dueDate && (
                    <span className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-500 shadow-sm">
                      <Clock3 size={11} />
                      DDL {draft.dueDate}
                    </span>
                  )}
                </div>
                <input
                  className="w-full bg-transparent text-3xl font-bold tracking-tight text-[color:var(--text)] transition-colors focus:outline-none focus:ring-0 placeholder:text-[color:var(--muted)]"
                  placeholder="请输入交付物标题..."
                  value={draft.title}
                  onChange={e => setDraft(current => ({ ...current, title: e.target.value }))}
                />
                <div className="flex flex-wrap gap-4 text-xs font-medium text-[color:var(--muted)]">
                  <span className="flex items-center gap-1.5 rounded-lg bg-[color:var(--background)]/50 px-2 py-1 backdrop-blur-sm shadow-sm border border-[color:var(--border)]/50">
                    <UserRound size={14} className="text-indigo-500" />
                    {draft.assignee || "未指定负责人"}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg bg-[color:var(--background)]/50 px-2 py-1 backdrop-blur-sm shadow-sm border border-[color:var(--border)]/50">
                    <Check size={14} className="text-emerald-500" />
                    初稿 {formatDateLabel(draft.draftCompletedAt)}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg bg-[color:var(--background)]/50 px-2 py-1 backdrop-blur-sm shadow-sm border border-[color:var(--border)]/50">
                    <ShieldCheck size={14} className="text-amber-500" />
                    QA {formatDateLabel(draft.qaCompletedAt)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-start gap-4">
                <div className="hidden rounded-[20px] border border-[color:var(--border)] bg-[color:var(--background)]/80 p-4 shadow-sm backdrop-blur-xl md:block">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-14 w-14 items-center justify-center">
                      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90 transform">
                        <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-[color:var(--border)] opacity-50" />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={completionRing(subTaskProgress, 24)}
                          strokeLinecap="round"
                          className="text-sky-500 transition-all duration-700 ease-in-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-[color:var(--text)]">{subTaskProgress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--muted)]">完成度</p>
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[color:var(--text)]">
                        <span className="text-base text-sky-500">{draft.subTasks.filter(item => item.done).length}</span>
                        <span className="text-[color:var(--muted-strong)]">/ {draft.subTasks.length || 0}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={onClose} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/50 px-4 py-2 text-sm font-medium text-[color:var(--muted)] transition-all hover:bg-[color:var(--background)] hover:text-[color:var(--text)] shadow-sm">
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="relative overflow-hidden rounded-2xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-500 hover:shadow-blue-500/25 disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button onClick={onClose} className="flex h-[38px] w-[38px] items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/50 text-[color:var(--muted)] transition-all hover:bg-[color:var(--background)] hover:text-[color:var(--text)] shadow-sm">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-[color:var(--border)] bg-[color:var(--panel)]/40 px-8 backdrop-blur-md">
            <div className="flex gap-6 pt-3">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative rounded-t-2xl px-3 pb-3 pt-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-[color:var(--background)] text-blue-500"
                      : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-8 py-6">
            {activeTab === "overview" && (
              <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5">
                  <SectionCard title="下一步" icon={<Sparkles size={15} />}>
                    <input
                      ref={nextStepRef}
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 px-4 py-3 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none"
                      placeholder="记录下次回来先做什么"
                      value={draft.contextNote}
                      onChange={e => setDraft(current => ({ ...current, contextNote: e.target.value }))}
                    />
                  </SectionCard>

                  <SectionCard title="执行信息" icon={<ChevronRight size={15} />}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="负责人">
                        <input
                          className={INPUT_CLASS}
                          value={draft.assignee}
                          onChange={e => setDraft(current => ({ ...current, assignee: e.target.value }))}
                          placeholder="可选"
                        />
                      </Field>
                      <Field label="DDL">
                        <input
                          type="date"
                          className={INPUT_CLASS}
                          value={draft.dueDate}
                          onChange={e => setDraft(current => ({ ...current, dueDate: e.target.value }))}
                        />
                      </Field>
                      <Field label="优先级">
                        <select
                          className={INPUT_CLASS}
                          value={draft.priority}
                          onChange={e => setDraft(current => ({ ...current, priority: e.target.value as DevTaskRecord["priority"] }))}
                        >
                          <option value="high">高</option>
                          <option value="medium">中</option>
                          <option value="low">低</option>
                        </select>
                      </Field>
                      <Field label="阻塞原因">
                        <input
                          className={INPUT_CLASS}
                          value={draft.blocker}
                          onChange={e => setDraft(current => ({ ...current, blocker: e.target.value }))}
                          placeholder="例如：等客户反馈"
                        />
                      </Field>
                    </div>
                  </SectionCard>

                  <SectionCard title="原稿入口" icon={<FileText size={15} />}>
                    <FileFieldCard
                      label="当前原稿"
                      value={draft.docUrl}
                      placeholder="可选：手动粘贴路径 / URL"
                      onChange={value => setDraft(current => ({ ...current, docUrl: value }))}
                    />
                  </SectionCard>
                </div>

                <div className="space-y-5">
                  <SectionCard title="关键时间" icon={<Clock3 size={15} />}>
                    <TimelineItem label="初稿完成" value={formatDateLabel(draft.draftCompletedAt)} />
                    <TimelineItem label="QA 完成" value={formatDateLabel(draft.qaCompletedAt)} />
                    <TimelineItem label="已提交" value={formatDateLabel(draft.submittedAt)} />
                  </SectionCard>

                  <SectionCard title="当前状态提示" icon={<ShieldCheck size={15} />}>
                    <p className="text-sm text-[color:var(--text)]">{TASK_STATUS_LABELS[draft.status]}</p>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      先处理概览里的关键信息，文件和 QA 细节在上方标签页继续完善。
                    </p>
                  </SectionCard>
                </div>
              </div>
            )}

            {activeTab === "files" && (
              <div className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-3">
                  <FileFieldCard
                    label="当前原稿"
                    value={draft.docUrl}
                    placeholder="可选：手动粘贴路径 / URL"
                    onChange={value => setDraft(current => ({ ...current, docUrl: value }))}
                  />
                  <FileFieldCard
                    label="参考旧版"
                    value={draft.baselineUrl}
                    placeholder="可选：手动粘贴路径 / URL"
                    onChange={value => setDraft(current => ({ ...current, baselineUrl: value }))}
                  />
                  <FileFieldCard
                    label="终稿文件"
                    value={draft.finalDocUrl}
                    placeholder="可选：手动粘贴路径 / URL"
                    onChange={value => setDraft(current => ({ ...current, finalDocUrl: value }))}
                  />
                </div>

                <SectionCard title="参考素材" icon={<FileIcon size={15} />}>
                  <RefsList
                    refs={draft.refs}
                    onAdd={ref => setDraft(current => ({ ...current, refs: [...current.refs, ref] }))}
                    onRemove={id => setDraft(current => ({ ...current, refs: current.refs.filter(ref => ref.id !== id) }))}
                  />
                </SectionCard>
              </div>
            )}

            {activeTab === "qa" && (
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <SectionCard title="评审信息" icon={<UserRound size={15} />}>
                  <div className="grid gap-3">
                    <Field label="评审人">
                      <input
                        className={INPUT_CLASS}
                        value={draft.reviewerName}
                        onChange={e => setDraft(current => ({ ...current, reviewerName: e.target.value }))}
                        placeholder="QA / 评审人姓名"
                      />
                    </Field>
                    <Field label="预计反馈日期">
                      <input
                        type="date"
                        className={INPUT_CLASS}
                        value={draft.reviewerEta}
                        onChange={e => setDraft(current => ({ ...current, reviewerEta: e.target.value }))}
                      />
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard title="QA 检查项" icon={<ShieldCheck size={15} />} tone={qaError ? "warning" : "default"}>
                  {qaError && (
                    <div className="mb-3 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      <AlertTriangle size={14} />
                      请先完成所有 QA 项，再标记为待提交。
                    </div>
                  )}
                  <div className="space-y-3">
                    {[
                      { key: "feedbackReceived" as const, label: "已接收评审反馈" },
                      { key: "annotationsResolved" as const, label: "已处理所有批注 / 高亮" },
                      { key: "cloudVerified" as const, label: "云环境 / 演示环境验证无误" },
                    ].map(item => (
                      <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setQA(item.key, !draft.qaChecklist[item.key])}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${draft.qaChecklist[item.key] ? "border-green-500 bg-green-500 text-white" : "border-[color:var(--border)] hover:border-green-400"
                            }`}
                        >
                          {draft.qaChecklist[item.key] && <Check size={12} />}
                        </button>
                        <span className={`text-sm ${draft.qaChecklist[item.key] ? "text-green-400 line-through" : "text-[color:var(--text)]"}`}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === "more" && (
              <div className="space-y-5">
                <SectionCard title="交付物拆解" icon={<ChevronRight size={15} />}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-[color:var(--muted)]">
                      已完成 {draft.subTasks.filter(subTask => subTask.done).length}/{draft.subTasks.length}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {draft.subTasks.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-5 text-sm text-[color:var(--muted)]">
                        还没有拆解子任务，按需补充即可。
                      </div>
                    )}
                    {draft.subTasks.map(subTask => (
                      <div key={subTask.id} className="group flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 px-4 py-3">
                        <button
                          onClick={() => toggleSubTask(subTask.id)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${subTask.done ? "border-blue-500 bg-blue-500 text-white" : "border-[color:var(--border)] hover:border-blue-400"
                            }`}
                        >
                          {subTask.done && <Check size={12} />}
                        </button>
                        <span className={`flex-1 text-sm ${subTask.done ? "line-through text-[color:var(--muted)]" : "text-[color:var(--text)]"}`}>{subTask.title}</span>
                        <button
                          onClick={() => setDraft(current => ({ ...current, subTasks: current.subTasks.filter(item => item.id !== subTask.id) }))}
                          className="rounded-xl p-2 text-[color:var(--muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="flex-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none"
                      placeholder="添加一个子任务..."
                      value={newSubTask}
                      onChange={e => setNewSubTask(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addSubTask()}
                    />
                    <button
                      onClick={addSubTask}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-[color:var(--background)] px-4 py-3 text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--panel-strong)]"
                    >
                      <Plus size={14} />
                      添加
                    </button>
                  </div>
                </SectionCard>

                <div className="grid gap-5 lg:grid-cols-2">
                  <SectionCard title="说明" icon={<FileText size={15} />}>
                    <textarea
                      rows={5}
                      className="w-full resize-none rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 px-4 py-3 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none"
                      placeholder="补充交付范围、注意事项或版本目标..."
                      value={draft.description}
                      onChange={e => setDraft(current => ({ ...current, description: e.target.value }))}
                    />
                  </SectionCard>

                  <SectionCard title="手动时间戳" icon={<Clock3 size={15} />}>
                    <div className="grid gap-3">
                      <TimestampField label="初稿完成时间" value={draft.draftCompletedAt} onChange={value => setDraft(current => ({ ...current, draftCompletedAt: value }))} />
                      <TimestampField label="QA 完成时间" value={draft.qaCompletedAt} onChange={value => setDraft(current => ({ ...current, qaCompletedAt: value }))} />
                      <TimestampField label="提交时间" value={draft.submittedAt} onChange={value => setDraft(current => ({ ...current, submittedAt: value }))} />
                    </div>
                  </SectionCard>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  tone = "default",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone?: "default" | "warning";
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl border p-5 ${tone === "warning" ? "border-red-500/20 bg-red-500/5" : "border-[color:var(--border)] bg-[color:var(--panel)]/70"}`}>
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-[color:var(--background)] p-2 text-[color:var(--muted)]">{icon}</div>
        <h3 className="text-sm font-medium text-[color:var(--text)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-[color:var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--background)]/70 px-4 py-3">
      <span className="text-sm text-[color:var(--muted)]">{label}</span>
      <span className="text-sm font-medium text-[color:var(--text)]">{value}</span>
    </div>
  );
}

function TimestampField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <input
        type="date"
        className={INPUT_CLASS}
        value={value ? value.slice(0, 10) : ""}
        onChange={e => onChange(e.target.value ? `${e.target.value}T00:00:00.000Z` : "")}
      />
    </Field>
  );
}
