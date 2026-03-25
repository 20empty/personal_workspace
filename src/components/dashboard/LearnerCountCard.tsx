import { motion } from "framer-motion";
import { Users } from "lucide-react";

export type LearnerStats = {
  total: number;
  byType: {
    type: string;
    count: number;
    color: string;
  }[];
};

type Props = {
  stats: LearnerStats;
};

export default function LearnerCountCard({ stats }: Props) {
  const { total, byType } = stats;

  return (
    <div className="space-y-4">
      {/* 总学员数 */}
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/15">
          <Users className="h-5 w-5 text-sky-400" />
        </div>
        <div>
          <p className="text-xs text-[color:var(--muted)]">总学员数</p>
          <motion.p
            className="text-2xl font-semibold text-[color:var(--text)]"
            key={total}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
          >
            {total}
          </motion.p>
        </div>
      </div>

      {/* 分类型占比 */}
      {byType.length > 0 && (
        <div className="space-y-2">
          <div className="flex h-3 overflow-hidden rounded-full bg-[color:var(--border)]">
            {byType.map((item) => (
              <div
                key={item.type}
                className="h-full transition-all"
                style={{
                  width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                  backgroundColor: item.color,
                }}
                title={`${item.type}: ${item.count} 人`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {byType.map((item) => (
              <div key={item.type} className="flex items-center gap-1.5 text-xs text-[color:var(--muted)]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.type}</span>
                <span className="text-[color:var(--text)]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
