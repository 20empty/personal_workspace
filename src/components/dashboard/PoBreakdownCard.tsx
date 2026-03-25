import { motion } from "framer-motion";

export type PoBreakdown = {
  teacherPo: number;
  headteacherPo: number;
  projectSupportPo: number;
  devPo: number;
  totalPo: number;
  teachingPercent: number;
  devPercent: number;
};

export type LevelBreakdown = {
  L2: number;
  L3: number;
  L4: number;
};

type Props = {
  po: PoBreakdown;
  levelBreakdown?: LevelBreakdown;
};

function SegmentedBar({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return <div className="h-3 rounded-full bg-[color:var(--border)]" />;
  }
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-[color:var(--border)]">
      {segments.map((seg, i) => (
        <div
          key={i}
          className="h-full transition-all"
          style={{
            width: `${(seg.value / total) * 100}%`,
            backgroundColor: seg.color,
          }}
          title={`${seg.label}: ${seg.value} (${Math.round((seg.value / total) * 100)}%)`}
        />
      ))}
    </div>
  );
}

export default function PoBreakdownCard({ po, levelBreakdown }: Props) {
  const segments = [
    { value: po.teacherPo, color: "#38bdf8", label: "讲师PO" },
    { value: po.headteacherPo, color: "#818cf8", label: "主教PO" },
    { value: po.projectSupportPo, color: "#a78bfa", label: "项目支持PO" },
    { value: po.devPo, color: "#f59e0b", label: "开发PO" },
  ].filter((s) => s.value > 0);

  const levelSegments = levelBreakdown
    ? [
        { value: levelBreakdown.L2, color: "#34d399", label: "L2" },
        { value: levelBreakdown.L3, color: "#38bdf8", label: "L3" },
        { value: levelBreakdown.L4, color: "#fbbf24", label: "L4" },
      ].filter((s) => s.value > 0)
    : [];

  const totalLevel = levelBreakdown
    ? levelBreakdown.L2 + levelBreakdown.L3 + levelBreakdown.L4
    : 0;

  return (
    <div className="space-y-4">
      {/* 数字卡片行 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox
          label="总 PO"
          value={po.totalPo}
          color="text-[color:var(--text)]"
        />
        <StatBox
          label="授课 PO"
          value={po.teacherPo + po.headteacherPo + po.projectSupportPo}
          color="text-sky-400"
        />
        <StatBox
          label="开发 PO"
          value={po.devPo}
          color="text-amber-400"
        />
        <StatBox
          label="项目支持"
          value={po.projectSupportPo}
          color="text-purple-400"
        />
      </div>

      {/* 授课/开发 PO 分段条 */}
      <div className="space-y-2">
        <SegmentedBar segments={segments} />
        <div className="flex justify-between text-xs text-[color:var(--muted)]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            授课 {po.teachingPercent}%
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            开发 {po.devPercent}%
          </span>
        </div>
      </div>

      {/* 按等级分解（如果有） */}
      {levelBreakdown && totalLevel > 0 && (
        <div className="space-y-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[color:var(--text)]">按等级分布</p>
            <span className="text-xs text-[color:var(--muted)]">课程 PO</span>
          </div>
          <SegmentedBar segments={levelSegments} />
          <div className="flex justify-between text-xs text-[color:var(--muted)]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              L2 {levelBreakdown.L2}天
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              L3 {levelBreakdown.L3}天
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              L4 {levelBreakdown.L4}天
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-3">
      <p className="text-xs text-[color:var(--muted)]">{label}</p>
      <motion.p
        className={`mt-1 text-xl font-semibold ${color}`}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        key={value}
      >
        {value}
      </motion.p>
    </div>
  );
}
