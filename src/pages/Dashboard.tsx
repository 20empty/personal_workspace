import { motion } from "framer-motion";
import { stats, recentDevTasks, todayTeaching } from "../data/mock";
import { useProfile } from "../hooks/useProfile";
import {
  ArrowUpRight,
  CalendarClock,
  TerminalSquare,
  Sparkles,
} from "lucide-react";

export default function Dashboard() {
  const { profile } = useProfile();
  const now = new Date();
  const quarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
  const currentYear = now.getFullYear();

  return (
    <div className="relative space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Dashboard
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-wide text-[color:var(--text)]">
              你好👋，{profile.name}老师
            </h1>
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs text-[color:var(--muted)]">
              {profile.title}
            </span>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            交付全局概览
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 text-sm text-[color:var(--muted)]">
          <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
          今日行程：深圳 · 线上多地
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 shadow-lg shadow-black/10 transition"
          >
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[color:var(--chip)] blur-2xl transition group-hover:scale-110" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-sky-500/10 to-transparent opacity-0 transition group-hover:opacity-100" />
            <p className="text-sm text-[color:var(--muted)]">
              {item.title
                .replace("本季度", quarter)
                .replace("本年度", String(currentYear))}
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-semibold text-[color:var(--text)]">
                {item.value}
              </span>
              <span className="text-sm text-[color:var(--muted)]">{item.unit}</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              {item.delta} 本周
            </div>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                今日教学任务
              </p>
              <h2 className="text-lg font-semibold text-[color:var(--text)]">安排概览</h2>
            </div>
            <CalendarClock className="h-5 w-5 text-[color:var(--muted)]" />
          </div>
          <div className="mt-6 space-y-4">
            {todayTeaching.map((task) => (
              <motion.div
                key={task.title}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
              >
                <div>
                  <p className="text-sm text-[color:var(--text)]">{task.title}</p>
                  <p className="text-xs text-[color:var(--muted)]">{task.location}</p>
                </div>
                <span className="text-sm text-[color:var(--muted-strong)]">
                  {task.time}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                最近活跃
              </p>
              <h2 className="text-lg font-semibold text-[color:var(--text)]">开发任务</h2>
            </div>
            <TerminalSquare className="h-5 w-5 text-[color:var(--muted)]" />
          </div>
          <div className="mt-6 space-y-4">
            {recentDevTasks.map((task) => (
              <motion.div
                key={task.title}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[color:var(--text)]">{task.title}</p>
                  <span className="rounded-full bg-[color:var(--chip)] px-2 py-1 text-xs text-[color:var(--accent)]">
                    {task.tag}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-black/20">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  进度 {task.progress}%
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
