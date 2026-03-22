import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  GraduationCap,
  KanbanSquare,
  Settings,
  Cloud,
  Sun,
  Moon,
} from "lucide-react";
import { useProfile } from "../../hooks/useProfile";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/delivery", label: "Delivery Manager", icon: GraduationCap },
  { to: "/dev", label: "Course Builder", icon: KanbanSquare },
  { to: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

export default function Sidebar({ theme, onToggleTheme }: SidebarProps) {
  const { profile } = useProfile();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-72 shrink-0"
    >
      <div className="flex h-full flex-col gap-6 rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/80 via-sky-500/80 to-indigo-500/80 text-slate-950">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[color:var(--muted)]">Classroom</p>
              <p className="text-base font-semibold tracking-wide text-[color:var(--text)]">
                交付管理中枢
              </p>
            </div>
          </div>
          <NavLink
            to="/profile"
            className="relative rounded-full transition hover:scale-105"
            title="Profile"
          >
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-400/40 via-sky-500/30 to-indigo-500/40 blur-lg" />
            <img
              src={profile.avatar}
              alt={profile.name}
              className="relative h-12 w-12 rounded-full border border-[color:var(--border)] object-cover"
            />
          </NavLink>
        </div>

        <div className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                  "hover:bg-[color:var(--panel-strong)] hover:text-[color:var(--text)]",
                  isActive
                    ? "bg-gradient-to-r from-sky-500/30 to-indigo-500/30 text-[color:var(--text)] shadow-lg shadow-sky-500/10"
                    : "text-[color:var(--muted)]",
                ].join(" ")
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto space-y-4">
          <button
            onClick={onToggleTheme}
            className="flex w-full items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--muted)] transition hover:bg-[color:var(--panel-strong)] hover:text-[color:var(--text)]"
          >
            <span className="font-medium">
              {theme === "dark" ? "切换到 Light" : "切换到 Dark"}
            </span>
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Offline Ready
            </p>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              本地 SQLite + Drizzle
            </p>
            <p className="text-xs text-[color:var(--muted)]">极速启动 · 无网可用</p>
          </div>

        </div>
      </div>
    </motion.aside>
  );
}
