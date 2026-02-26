import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { toggleSopTaskStatus, type SopTaskRecord } from "../../db/delivery";

/* ───────── Constants ───────── */

const STAGE_META: Record<string, { label: string; color: string; bg: string }> = {
    pre: { label: "训前", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-400/30" },
    during: { label: "训中", color: "text-sky-400", bg: "bg-sky-500/15 border-sky-400/30" },
    post: { label: "训后", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-400/30" },
};

/* ───────── Types ───────── */

interface SopTrackerProps {
    tasks: SopTaskRecord[];
    onTaskToggled: () => void;      // callback to re-fetch after toggle
}

/* ───────── Component ───────── */

export default function SopTracker({ tasks, onTaskToggled }: SopTrackerProps) {
    // Group tasks by stage
    const stages = ["pre", "during", "post"] as const;
    const grouped = stages.map((stage) => ({
        stage,
        ...STAGE_META[stage],
        items: tasks.filter((t) => t.stage === stage),
    }));

    // Compute overall progress
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "completed").length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    // Expanded state for each stage
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        pre: true,
        during: true,
        post: true,
    });

    const toggleExpand = (stage: string) =>
        setExpanded((prev) => ({ ...prev, [stage]: !prev[stage] }));

    const handleToggle = async (task: SopTaskRecord) => {
        const newStatus = task.status === "completed" ? "pending" : "completed";
        try {
            await toggleSopTaskStatus(task.id, newStatus);
            onTaskToggled();
        } catch (err) {
            console.error("Failed to toggle SOP task:", err);
        }
    };

    return (
        <div className="space-y-5">
            {/* Overall Progress */}
            <div>
                <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                    <span>SOP 总进度</span>
                    <span className="text-[color:var(--text)] font-medium">{pct}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full bg-black/20 overflow-hidden">
                    <motion.div
                        className="h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                </div>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {done}/{total} 项已完成
                </p>
            </div>

            {/* Stage Groups */}
            {grouped.map(({ stage, label, color, bg, items }) => {
                const stageDone = items.filter((i) => i.status === "completed").length;
                const stagePct = items.length === 0 ? 0 : Math.round((stageDone / items.length) * 100);
                const isExpanded = expanded[stage] ?? true;

                return (
                    <div key={stage} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] overflow-hidden">
                        {/* Stage Header */}
                        <button
                            type="button"
                            onClick={() => toggleExpand(stage)}
                            className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-white/[.03]"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${bg} ${color}`}>
                                    {label}
                                </span>
                                <span className="text-xs text-[color:var(--muted)]">
                                    {stageDone}/{items.length} · {stagePct}%
                                </span>
                            </div>
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-[color:var(--muted)]" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-[color:var(--muted)]" />
                            )}
                        </button>

                        {/* Stage Progress Bar */}
                        <div className="mx-4 h-1 rounded-full bg-black/20 overflow-hidden">
                            <motion.div
                                className={`h-1 rounded-full ${stage === "pre"
                                        ? "bg-amber-400"
                                        : stage === "during"
                                            ? "bg-sky-400"
                                            : "bg-emerald-400"
                                    }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${stagePct}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        {/* Task List */}
                        <AnimatePresence initial={false}>
                            {isExpanded && (
                                <motion.ul
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="divide-y divide-[color:var(--border)]"
                                >
                                    {items.map((task) => {
                                        const isDone = task.status === "completed";
                                        return (
                                            <motion.li
                                                key={task.id}
                                                layout
                                                className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/[.03] cursor-pointer"
                                                onClick={() => handleToggle(task)}
                                            >
                                                <span className="flex-shrink-0">
                                                    {isDone ? (
                                                        <Check className="h-4 w-4 text-emerald-400" />
                                                    ) : (
                                                        <Circle className="h-4 w-4 text-[color:var(--muted)] opacity-40" />
                                                    )}
                                                </span>
                                                <span
                                                    className={`text-sm transition ${isDone
                                                            ? "text-[color:var(--muted)] line-through opacity-60"
                                                            : "text-[color:var(--text)]"
                                                        }`}
                                                >
                                                    {task.title}
                                                </span>
                                            </motion.li>
                                        );
                                    })}
                                </motion.ul>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
