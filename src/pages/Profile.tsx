import { useEffect, useId, useMemo, useState } from "react";
import { Camera, Sparkles, UserRound } from "lucide-react";
import { useProfile } from "../hooks/useProfile";

export default function Profile() {
  const { profile, updateProfile } = useProfile();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const fileId = useId();

  useEffect(() => {
    setForm(profile);  }, [profile]);

  const profileStrength = useMemo(() => {
    const fields = [form.name, form.title, form.avatar];
    const completed = fields.filter((item) => item.trim().length > 0).length;
    return Math.round((completed / fields.length) * 100);
  }, [form.avatar, form.name, form.title]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-xl shadow-black/10 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Profile
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[color:var(--text)]">
              个人信息
            </h1>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              管理你自己的工作台身份信息，让欢迎语、头像和识别信息更统一。
            </p>
          </div>
          {saved ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
              已保存
            </span>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel-strong)] group/avatar-section">
          <div className="relative p-6">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.28),_transparent_58%),radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_42%)] transition-all duration-700 group-hover/avatar-section:opacity-80" />
            <div className="relative flex flex-col items-center text-center">
              <input
                id={fileId}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      const base64 = reader.result;
                      const newForm = { ...form, avatar: base64 };
                      setForm(newForm);
                      updateProfile(newForm);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
              <label 
                htmlFor={fileId} 
                className="relative cursor-pointer group/avatar-img"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("scale-105");
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("scale-105");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("scale-105");
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        const base64 = reader.result;
                        const newForm = { ...form, avatar: base64 };
                        setForm(newForm);
                        updateProfile(newForm);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              >
                <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-cyan-400/40 via-sky-500/30 to-indigo-500/40 blur-2xl opacity-0 transition-opacity duration-500 group-hover/avatar-img:opacity-100" />
                <div className="relative h-32 w-32 transition-transform duration-300">
                  <img
                    src={form.avatar}
                    alt={form.name}
                    className="h-full w-full rounded-full border-2 border-white/20 object-cover shadow-2xl transition-all duration-500 group-hover/avatar-img:scale-[1.03] group-hover/avatar-img:border-cyan-400/50"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 opacity-0 transition-all duration-300 group-hover/avatar-img:opacity-100 backdrop-blur-[2px]">
                    <Camera className="h-6 w-6 text-white mb-1" />
                    <span className="text-[10px] uppercase font-bold text-white tracking-widest">
                      更换头像
                    </span>
                  </div>
                </div>
              </label>
              
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[color:var(--muted-strong)] backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
                资料完整度 {profileStrength}%
              </div>
              <p className="mt-4 text-2xl font-semibold text-[color:var(--text)] tracking-tight">
                {form.name || "未设置昵称"}
                {form.name ? "老师" : ""}
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)] max-w-[200px] leading-relaxed">
                {form.title || "填写头衔后会展示在 Dashboard 欢迎区"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-xl shadow-black/10 backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Edit
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
          更新资料
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          保留必要信息即可，左侧会实时预览最终效果。
        </p>

        <div className="mt-6 space-y-6">
          <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-500/15 text-sky-400">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[color:var(--text)]">
                  基础展示
                </h3>
                <p className="text-sm text-[color:var(--muted)]">
                  用于你自己的工作台欢迎语和身份标识。
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-[color:var(--muted)]">
                昵称
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)] focus:bg-white/5"
                  placeholder="请输入昵称"
                />
              </label>

              <label className="block text-sm text-[color:var(--muted)]">
                职称/头衔
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)] focus:bg-white/5"
                  placeholder="例如：企业云计算讲师"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20"
          >
            保存资料
          </button>
          {!saved ? (
            <span className="text-sm text-[color:var(--muted)]">
              保存后自动更新 Dashboard
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
