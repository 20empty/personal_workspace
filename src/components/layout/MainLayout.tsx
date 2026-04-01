import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Download, RefreshCw, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { useUpdater } from "./UpdateProvider";

export default function MainLayout() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("classroom-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });
  const {
    availability,
    checking,
    currentVersion,
    latestVersion,
    promptVisible,
    downloading,
    progress,
    checkNow,
    installUpdate,
    dismissPrompt,
  } = useUpdater();

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
            {promptVisible && availability === "available" ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[color:var(--text)]">
                    发现新版本 {latestVersion}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">
                    当前版本 {currentVersion}，你可以现在下载并在安装后自动重启。
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void checkNow()}
                    disabled={checking || downloading}
                    className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)] disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
                    重新检查
                  </button>
                  <button
                    type="button"
                    onClick={() => void installUpdate()}
                    disabled={downloading}
                    className="inline-flex items-center gap-1 rounded-xl bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[color:var(--accent)]/90 disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {downloading ? "下载中..." : "立即更新"}
                  </button>
                  <button
                    type="button"
                    onClick={dismissPrompt}
                    disabled={downloading}
                    className="rounded-xl border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:text-[color:var(--text)] disabled:opacity-50"
                    title="稍后再说"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {downloading ? (
                  <div className="w-full">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all"
                        style={{ width: `${progress?.percent ?? 0}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
