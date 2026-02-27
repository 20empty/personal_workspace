import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  CLASS_TYPE_LABELS,
  createSopTemplate,
  deleteSopTemplate,
  listSopTemplatesByClassType,
  moveSopTemplate,
  type ClassType,
  type SopTemplateRecord,
} from "../db/delivery";

const STAGES = [
  { key: "pre", label: "课前" },
  { key: "during", label: "课中" },
  { key: "post", label: "课后" },
] as const;

export default function Settings() {
  const [classType, setClassType] = useState<ClassType>("centralized");
  const [templates, setTemplates] = useState<SopTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newTitles, setNewTitles] = useState<Record<string, string>>({
    pre: "",
    during: "",
    post: "",
  });

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await listSopTemplatesByClassType(classType);
      setTemplates(rows);
    } catch (err) {
      console.error("Failed to load SOP templates:", err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [classType]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const grouped = useMemo(() => {
    const groups: Record<string, SopTemplateRecord[]> = {
      pre: [],
      during: [],
      post: [],
    };
    for (const item of templates) {
      if (!groups[item.stage]) {
        groups[item.stage] = [];
      }
      groups[item.stage].push(item);
    }
    return groups;
  }, [templates]);

  const handleAdd = async (stage: string) => {
    const title = (newTitles[stage] ?? "").trim();
    if (!title) return;
    try {
      setBusyId(`new-${stage}`);
      await createSopTemplate({ classType, stage, title });
      setNewTitles((prev) => ({ ...prev, [stage]: "" }));
      await loadTemplates();
    } catch (err) {
      console.error("Failed to add SOP template:", err);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setBusyId(id);
      await deleteSopTemplate(id);
      await loadTemplates();
    } catch (err) {
      console.error("Failed to delete SOP template:", err);
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    try {
      setBusyId(id);
      await moveSopTemplate(id, direction);
      await loadTemplates();
    } catch (err) {
      console.error("Failed to move SOP template:", err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">设置</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">SOP 模版配置</p>
      </header>

      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CLASS_TYPE_LABELS) as ClassType[]).map((type) => (
            <button
              key={type}
              onClick={() => setClassType(type)}
              className={[
                "rounded-full border px-4 py-2 text-sm transition",
                classType === type
                  ? "border-[color:var(--accent)] bg-[color:var(--chip)] text-[color:var(--text)]"
                  : "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]",
              ].join(" ")}
            >
              {CLASS_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-[color:var(--muted)]">加载中...</div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {STAGES.map((stageMeta) => {
              const stageItems = grouped[stageMeta.key] ?? [];
              return (
                <div
                  key={stageMeta.key}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4"
                >
                  <h2 className="text-sm font-semibold text-[color:var(--text)]">{stageMeta.label}</h2>

                  <div className="mt-3 space-y-2">
                    {stageItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--muted)]">
                        暂无任务
                      </div>
                    ) : (
                      stageItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 rounded-xl border border-[color:var(--border)] px-3 py-2"
                        >
                          <p className="text-sm text-[color:var(--text)]">{item.title}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleMove(item.id, "up")}
                              disabled={index === 0 || busyId === item.id}
                              className="grid h-6 w-6 place-items-center rounded-md border border-[color:var(--border)] text-[color:var(--muted)] disabled:opacity-40"
                              title="上移"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleMove(item.id, "down")}
                              disabled={index === stageItems.length - 1 || busyId === item.id}
                              className="grid h-6 w-6 place-items-center rounded-md border border-[color:var(--border)] text-[color:var(--muted)] disabled:opacity-40"
                              title="下移"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={busyId === item.id}
                              className="grid h-6 w-6 place-items-center rounded-md border border-rose-400/40 text-rose-300 disabled:opacity-40"
                              title="删除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={newTitles[stageMeta.key] ?? ""}
                      onChange={(event) =>
                        setNewTitles((prev) => ({ ...prev, [stageMeta.key]: event.target.value }))
                      }
                      placeholder="添加待办"
                      className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                    />
                    <button
                      onClick={() => handleAdd(stageMeta.key)}
                      disabled={busyId === `new-${stageMeta.key}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)] disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      添加
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
