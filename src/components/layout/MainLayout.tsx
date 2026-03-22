import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("classroom-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    window.localStorage.setItem("classroom-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <div className="relative mx-auto flex min-h-screen max-w-[1400px] gap-6 p-6">
        <Sidebar theme={theme} onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} />
        <main
          className="flex-1 overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-2xl shadow-black/30 backdrop-blur-xl animate-page-in"
        >
          <div className="h-full w-full p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
