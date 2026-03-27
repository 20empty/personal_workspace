import { motion } from "framer-motion";

interface CircularProgressProps {
  value: number;       // 0-100
  size?: number;       // 直径，默认 80
  strokeWidth?: number; // 线宽，默认 8
  color?: string;
  bgColor?: string;
  showValue?: boolean;
  label?: string;
}

export default function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  color = "var(--accent)",
  bgColor = "rgba(128, 128, 128, 0.15)",
  showValue = true,
  label,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* 进度圆环 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-[color:var(--text)]">{value}%</span>
          {label && <span className="text-[10px] text-[color:var(--muted)]">{label}</span>}
        </div>
      )}
    </div>
  );
}
