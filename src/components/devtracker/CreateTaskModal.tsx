import React, { useState } from "react";
import { CreateTaskInput, DeliverableType, Priority, TaskStatus } from "../../types/devtracker";
import { X } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

const emptyForm = {
  title: "",
  description: "",
  deliverableType: "slides" as DeliverableType,
  status: "pending" as TaskStatus,
  priority: "medium" as Priority,
  assignee: "",
  dueDate: "",
  blocker: "",
};

export default function CreateTaskModal({ isOpen, projectId, onClose, onSubmit }: CreateTaskModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "请输入交付物名称";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, projectId });
      setFormData(emptyForm);
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || "保存失败" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] p-4 px-6">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">新建交付物</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[color:var(--muted)] hover:bg-[color:var(--background)] hover:text-[color:var(--text)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {errors.submit && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              {errors.submit}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-[color:var(--muted)]">
              交付物名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例如：课程 PPT"
              className={`w-full rounded-xl border bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                errors.title ? "border-red-500/50" : "border-[color:var(--border)]"
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[color:var(--muted)]">类型</label>
              <select
                name="deliverableType"
                value={formData.deliverableType}
                onChange={handleChange}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="slides">PPT</option>
                <option value="lab">实验手册</option>
                <option value="notes">讲师备注</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[color:var(--muted)]">优先级</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[color:var(--muted)]">当前状态</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="pending">待启动</option>
                <option value="inProgress">制作中</option>
                <option value="draftDone">初稿完成</option>
                <option value="qaReview">QA评审中</option>
                <option value="readyToSubmit">待提交</option>
                <option value="submitted">已提交</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[color:var(--muted)]">负责人</label>
              <input
                type="text"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                placeholder="可选"
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[color:var(--muted)]">DDL</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[color:var(--muted)]">阻塞原因</label>
              <input
                type="text"
                name="blocker"
                value={formData.blocker}
                onChange={handleChange}
                placeholder="例如：等素材"
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[color:var(--muted)]">说明</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="补充本次交付范围、注意事项或版本目标..."
              rows={3}
              className="w-full resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="flex justify-end space-x-3 border-t border-[color:var(--border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-5 py-2.5 text-sm font-medium text-[color:var(--text)] hover:bg-[color:var(--panel)] transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
