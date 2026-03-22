import React, { useEffect, useState } from "react";
import { CreateProjectInput } from "../../types/devtracker";
import { X } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProjectInput) => Promise<void>;
  title?: string;
  submitLabel?: string;
  initialData?: CreateProjectInput | null;
}

const createEmptyForm = (): CreateProjectInput => ({
  name: "",
  description: "",
  source: "",
  poCount: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split("T")[0],
});

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  title = "新建开发任务",
  submitLabel = "保存",
  initialData,
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectInput>({
    ...createEmptyForm(),
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(initialData ?? createEmptyForm());
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "请输入开发任务名称";
    
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = "结束日期不能早于开始日期";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData(createEmptyForm());
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || "保存失败" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] p-4 px-6">
          <h2 className="text-lg font-semibold text-[color:var(--text)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[color:var(--muted)] hover:bg-[color:var(--background)] hover:text-[color:var(--text)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[color:var(--muted)] mb-1">
              课程项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例如：K8s 容器课程升级"
              className={`w-full rounded-xl border bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                errors.name ? 'border-red-500/50' : 'border-[color:var(--border)]'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--muted)] mb-1">
              来源 / 客户 / 班期
            </label>
            <input
              type="text"
              name="source"
              value={formData.source ?? ""}
              onChange={handleChange}
              placeholder="例如：某客户内训 / 2026 春季班"
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--muted)] mb-1">
              PO 数量 (可选)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              name="poCount"
              value={formData.poCount ?? ""}
              onChange={handleChange}
              placeholder="例如：2"
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)] mb-1">
                启动日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)] mb-1">
                总 DDL <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full rounded-xl border bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  errors.endDate ? 'border-red-500/50' : 'border-[color:var(--border)]'
                }`}
              />
              {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--muted)] mb-1">
              描述 (可选)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="记录课程目标、版本范围、重点变更..."
              rows={3}
              className="w-full resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-sm text-[color:var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-[color:var(--border)]">
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
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? "保存中..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
