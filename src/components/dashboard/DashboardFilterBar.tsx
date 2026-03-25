import { Filter } from "lucide-react";

export type FilterState = {
  year: number;
  quarter: number | "all";
  classType: string | "all";
  stage: string | "all";
  level: "all" | "L2" | "L3" | "L4";
};

type Props = {
  filter: FilterState;
  onChange: (next: FilterState) => void;
};

const CLASS_TYPES = [
  { value: "all", label: "全部类型" },
  { value: "overseas", label: "海外" },
  { value: "domestic", label: "国内" },
  { value: "centralized", label: "集中" },
  { value: "online", label: "线上" },
];

const STAGES = [
  { value: "all", label: "全部阶段" },
  { value: "upcoming", label: "待开始" },
  { value: "active", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "archived", label: "已归档" },
];

const LEVELS = [
  { value: "all", label: "全部等级" },
  { value: "L2", label: "L2" },
  { value: "L3", label: "L3" },
  { value: "L4", label: "L4" },
];

const QUARTERS = [
  { value: "all", label: "全年" },
  { value: 1, label: "Q1" },
  { value: 2, label: "Q2" },
  { value: 3, label: "Q3" },
  { value: 4, label: "Q4" },
];

export default function DashboardFilterBar({ filter, onChange }: Props) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3">
      <div className="flex items-center gap-2 text-[color:var(--muted)]">
        <Filter className="h-4 w-4" />
        <span className="text-xs font-medium">筛选</span>
      </div>

      {/* 年份 */}
      <select
        value={filter.year}
        onChange={(e) => onChange({ ...filter, year: Number(e.target.value) })}
        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] px-3 py-1.5 text-xs text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y} 年
          </option>
        ))}
      </select>

      {/* 季度 */}
      <select
        value={filter.quarter}
        onChange={(e) => {
          const val = e.target.value;
          onChange({ ...filter, quarter: val === "all" ? "all" : Number(val) });
        }}
        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] px-3 py-1.5 text-xs text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
      >
        {QUARTERS.map((q) => (
          <option key={String(q.value)} value={q.value}>
            {q.label}
          </option>
        ))}
      </select>

      {/* 课程类型 */}
      <select
        value={filter.classType}
        onChange={(e) => onChange({ ...filter, classType: e.target.value })}
        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] px-3 py-1.5 text-xs text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
      >
        {CLASS_TYPES.map((ct) => (
          <option key={ct.value} value={ct.value}>
            {ct.label}
          </option>
        ))}
      </select>

      {/* 阶段 */}
      <select
        value={filter.stage}
        onChange={(e) => onChange({ ...filter, stage: e.target.value })}
        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] px-3 py-1.5 text-xs text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
      >
        {STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* 等级 */}
      <select
        value={filter.level}
        onChange={(e) => onChange({ ...filter, level: e.target.value as "all" | "L2" | "L3" | "L4" })}
        className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] px-3 py-1.5 text-xs text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
      >
        {LEVELS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
