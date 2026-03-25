import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ViewClass } from "../../pages/DeliveryManager";

interface DeleteConfirmModalProps {
    toDelete: ViewClass;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteConfirmModal({ toDelete, onClose, onConfirm }: DeleteConfirmModalProps) {
    const stageLabel =
        toDelete.stage === "active" ? "进行中班级" : toDelete.stage === "completed" ? "已交付班级" : "后续档期班级";

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
                        onClick={onClose}
                        className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4 text-sm text-[color:var(--muted)]">
                    将删除{stageLabel}：<span className="text-[color:var(--text)]">{toDelete.title}</span>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-2xl border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/20"
                    >
                        确认删除
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
