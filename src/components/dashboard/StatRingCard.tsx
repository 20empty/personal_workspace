import { motion } from "framer-motion";
import CircularProgress from "./CircularProgress";

interface StatRingCardProps {
  title: string;
  value: number | string;
  unit: string;
  progress?: number;       // 0-100，用于环形图
  ringColor?: string;
  bgGlow?: string;         // 背景光晕颜色
  delay?: number;
}

export default function StatRingCard({
  title,
  value,
  unit,
  progress,
  ringColor = "var(--accent)",
  bgGlow = "rgba(56, 189, 248, 0.15)",
  delay = 0,
}: StatRingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.5, ease: "easeOut" }}
      className="group rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-lg shadow-black/10 relative overflow-hidden p-5"
    >
      {/* 背景光晕 */}
      <div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-110"
        style={{ background: bgGlow }}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[color:var(--muted)]">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-[color:var(--text)]">{value}</span>
            <span className="text-sm text-[color:var(--muted)]">{unit}</span>
          </div>
        </div>

        {progress !== undefined && (
          <CircularProgress
            value={progress}
            size={70}
            strokeWidth={7}
            color={ringColor}
            bgColor="rgba(128, 128, 128, 0.15)"
          />
        )}
      </div>
    </motion.div>
  );
}
