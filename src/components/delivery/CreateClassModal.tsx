import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ViewClass } from "../../pages/DeliveryManager";
import { CLASS_TYPE_LABELS, type ClassType, type DeliveryClassRecord } from "../../db/delivery";

export type CreatePayload = Omit<DeliveryClassRecord, "id" | "createdAt" | "updatedAt">;

interface CreateClassModalProps {
    onClose: () => void;
    onSubmit: (payload: CreatePayload, fallback: ViewClass) => Promise<void>;
}

export default function CreateClassModal({ onClose, onSubmit }: CreateClassModalProps) {
    const [form, setForm] = useState({
        title: "",
        code: "",
        location: "",
        classType: "centralized" as ClassType,
        startDate: "",
        endDate: "",
        learners: "",
        teacherPo: "",
        headteacherPo: "",
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

    const resetForm = () => {
        setForm({
            title: "",
            code: "",
            location: "",
            classType: "centralized" as ClassType,
            startDate: "",
            endDate: "",
            learners: "",
            teacherPo: "",
            headteacherPo: "",
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

    const handleCreate = async () => {
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
        const teacherPo = Number.parseInt(form.teacherPo || "0", 10) || 0;
        const headteacherPo = Number.parseInt(form.headteacherPo || "0", 10) || 0;
        const payload: CreatePayload = {
            code: form.code,
            title: form.title,
            location: form.location,
            classType: form.classType,
            startDate: form.startDate,
            endDate: form.endDate,
            learners: Number.parseInt(form.learners || "0", 10) || 0,
            teacherPo,
            headteacherPo,
            status: "已排期",
            stage: "upcoming",
            progress: 0,
            focus: form.notes ? [form.notes] : ["待完善"],
            archiveState: "待归档",
            notes: form.notes ? form.notes : null,
        };

        const viewPayload: Omit<ViewClass, "id" | "dateRange"> = {
            code: payload.code,
            title: payload.title,
            location: payload.location,
            classType: payload.classType,
            status: payload.status,
            stage: payload.stage,
            startDate: payload.startDate,
            endDate: payload.endDate,
            learners: payload.learners,
            teacherPo: payload.teacherPo,
            headteacherPo: payload.headteacherPo,
            progress: payload.progress,
            focus: payload.focus,
            archiveState: payload.archiveState,
        };

        const fallback: ViewClass = {
            id: `local-${Date.now()}`,
            dateRange,
            ...viewPayload,
        };

        await onSubmit(payload, fallback);
    };

    return (
        <motion.div
            className="fixed inset-0 z-40 grid place-items-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                onClick={(event) => event.stopPropagation()}
                className="flex max-h-[90vh] w-[520px] max-w-[92vw] flex-col rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
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
                        onClick={onClose}
                        className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1">
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
                        班级类型
                        <select
                            value={form.classType}
                            onChange={(event) =>
                                setForm((prev) => ({ ...prev, classType: event.target.value as ClassType }))
                            }
                            className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                        >
                            {Object.entries(CLASS_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>

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

                    <div className="grid gap-4 sm:grid-cols-3">
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
                        <label className="block text-sm text-[color:var(--muted)]">
                            授课PO
                            <input
                                value={form.teacherPo}
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, teacherPo: event.target.value }))
                                }
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                                placeholder="例如：2"
                            />
                        </label>
                        <label className="block text-sm text-[color:var(--muted)]">
                            班主任PO
                            <input
                                value={form.headteacherPo}
                                onChange={(event) =>
                                    setForm((prev) => ({ ...prev, headteacherPo: event.target.value }))
                                }
                                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
                                placeholder="例如：1"
                            />
                        </label>
                    </div>

                    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--muted)]">
                        总PO：<span className="font-semibold text-[color:var(--text)]">
                            {(Number.parseInt(form.teacherPo || "0", 10) || 0) + (Number.parseInt(form.headteacherPo || "0", 10) || 0)}
                        </span>
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

                <div className="mt-6 flex shrink-0 items-center justify-end gap-3">
                    <button
                        onClick={() => {
                            onClose();
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
    );
}
