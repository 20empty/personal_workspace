/**
 * 导入结果反馈弹窗
 */

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";
import type { ImportSummary } from "../../utils/classImporter";

interface ImportResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ImportSummary | null;
}

export default function ImportResultModal({ isOpen, onClose, summary }: ImportResultModalProps) {
  if (!summary) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-[480px] max-w-[92vw] rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {summary.success ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-[color:var(--text)]">
                    {summary.success ? "导入完成" : "导入完成（部分失败）"}
                  </h2>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    成功导入 {summary.totalClasses} 个班级
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {summary.errors.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-[color:var(--muted)]">失败记录</h3>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
                  {summary.errors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
                      <span className="text-rose-200">
                        <span className="font-mono">{err.classCode}</span>: {err.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-sky-500/40"
              >
                确定
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
