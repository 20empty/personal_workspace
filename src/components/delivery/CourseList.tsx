import { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { type CourseRecord } from "../../db/delivery";

interface CourseListProps {
    courses: CourseRecord[];
    onAdd: (name: string, days: string, startDate: string, endDate: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export default function CourseList({ courses, onAdd, onDelete }: CourseListProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState("");
    const [days, setDays] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !days || !startDate || !endDate) return;
        try {
            setIsSubmitting(true);
            await onAdd(name, days, startDate, endDate);
            setIsAdding(false);
            setName("");
            setDays("");
            setStartDate("");
            setEndDate("");
        } catch (err) {
            console.error("Failed to add course:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (val: string) => val.replace(/-/g, ".");

    return (
        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    交付课程
                </h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1 rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs text-white transition hover:bg-[color:var(--accent)]/90"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        添加课程
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-[color:var(--border)] bg-white/[0.02] p-4">
                    <input
                        autoFocus
                        type="text"
                        placeholder="课程名称 (例：云原生架构实训)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                        required
                    />
                    <div className="grid grid-cols-[1fr_1fr_80px] gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                            required
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                            required
                        />
                        <input
                            type="text"
                            placeholder="天数"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="rounded-xl border border-[color:var(--border)] px-4 py-1.5 text-xs text-[color:var(--muted)] hover:bg-white/[0.02]"
                            disabled={isSubmitting}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="rounded-xl bg-[color:var(--accent)] px-4 py-1.5 text-xs text-white hover:bg-[color:var(--accent)]/90 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            提交
                        </button>
                    </div>
                </form>
            )}

            {courses.length > 0 ? (
                <div className="mt-4 space-y-2">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className="group flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-3 transition hover:border-[color:var(--accent)]/40 hover:bg-white/[0.02]"
                        >
                            <div>
                                <h3 className="text-sm font-medium text-[color:var(--text)]">
                                    {course.name}
                                    <span className="ml-2 inline-block rounded-md bg-[color:var(--border)] px-1.5 py-0.5 text-[10px] text-[color:var(--muted)]">
                                        {course.days}天
                                    </span>
                                </h3>
                                <div className="mt-1 flex items-center gap-1 text-xs text-[color:var(--muted)]">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(course.startDate)} - {formatDate(course.endDate)}
                                </div>
                            </div>
                            <button
                                onClick={() => onDelete(course.id)}
                                className="grid h-7 w-7 place-items-center rounded-full text-rose-400 opacity-0 transition hover:bg-rose-500/10 group-hover:opacity-100"
                                title="删除课程"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                !isAdding && (
                    <div className="mt-4 text-center text-sm text-[color:var(--muted)]">
                        尚未添加交付课程
                    </div>
                )
            )}
        </div>
    );
}
