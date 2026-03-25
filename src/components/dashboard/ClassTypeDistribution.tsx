import { motion } from "framer-motion";

export type ClassTypeItem = {
  type: string;
  label: string;
  count: number;
  po: number;
  learners: number;
  color: string;
};

type Props = {
  items: ClassTypeItem[];
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  overseas: { label: "海外", color: "bg-sky-500" },
  domestic: { label: "国内", color: "bg-emerald-500" },
  centralized: { label: "集中", color: "bg-amber-500" },
  online: { label: "线上", color: "bg-purple-500" },
};

export default function ClassTypeDistribution({ items }: Props) {
  const totalClasses = items.reduce((sum, i) => sum + i.count, 0);
  const totalPo = items.reduce((sum, i) => sum + i.po, 0);

  if (totalClasses === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--border)] py-6 text-center text-sm text-[color:var(--muted)]">
        暂无数据
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const config = TYPE_CONFIG[item.type] ?? { label: item.type, color: "bg-gray-500" };
        const poPercent = totalPo > 0 ? Math.round((item.po / totalPo) * 100) : 0;

        return (
          <div key={item.type} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${config.color}`} />
                <span className="text-[color:var(--text)]">{config.label}</span>
              </div>
              <div className="flex gap-4 text-[color:var(--muted)]">
                <span>{item.count} 班</span>
                <span>PO {item.po}</span>
                <span>{poPercent}%</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[color:var(--border)]">
              <motion.div
                className={`h-full rounded-full ${config.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${poPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
