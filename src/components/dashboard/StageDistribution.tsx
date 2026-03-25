import { motion } from "framer-motion";

export type StageItem = {
  stage: string;
  label: string;
  count: number;
  color: string;
};

type Props = {
  items: StageItem[];
};

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  upcoming: { label: "待开始", color: "bg-gray-500" },
  active: { label: "进行中", color: "bg-sky-500" },
  completed: { label: "已完成", color: "bg-emerald-500" },
  archived: { label: "已归档", color: "bg-purple-500" },
};

export default function StageDistribution({ items }: Props) {
  const total = items.reduce((sum, i) => sum + i.count, 0);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--border)] py-6 text-center text-sm text-[color:var(--muted)]">
        暂无班级数据
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const config = STAGE_CONFIG[item.stage] ?? { label: item.stage, color: "bg-gray-500" };
        const percent = Math.round((item.count / total) * 100);

        return (
          <div key={item.stage} className="flex items-center gap-3">
            <div className="w-16 shrink-0 text-xs text-[color:var(--muted)]">
              {config.label}
            </div>
            <div className="flex flex-1 items-center gap-3">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-[color:var(--border)]">
                <motion.div
                  className={`h-full rounded-full ${config.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex w-24 shrink-0 items-center justify-between text-xs">
                <span className="font-medium text-[color:var(--text)]">{item.count}</span>
                <span className="text-[color:var(--muted)]">{percent}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
