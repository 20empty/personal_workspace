import { useId, useState } from "react";
import { useProfile } from "../hooks/useProfile";

export default function Profile() {
  const { profile, updateProfile } = useProfile();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const fileId = useId();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Profile
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">
              个人信息
            </h1>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              设置昵称、头像与简介，用于 Dashboard 欢迎语与个人识别。
            </p>
          </div>
          {saved ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
              已保存
            </span>
          ) : null}
        </div>

        <div className="mt-6 rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-cyan-400/40 via-sky-500/30 to-indigo-500/40 blur-xl" />
              <img
                src={form.avatar}
                alt={form.name}
                className="relative h-28 w-28 rounded-full border border-[color:var(--border)] object-cover"
              />
            </div>
            <p className="mt-4 text-xl font-semibold text-[color:var(--text)]">
              {form.name}老师
            </p>
            <p className="text-sm text-[color:var(--muted)]">{form.title}</p>
            <p className="mt-2 text-xs text-[color:var(--muted)]">{form.bio}</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Edit
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
          更新资料
        </h2>

        <div className="mt-6 grid gap-4">
          <label className="block text-sm text-[color:var(--muted)]">
            昵称
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
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
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
              placeholder="例如：企业云计算讲师"
            />
          </label>

          <label className="block text-sm text-[color:var(--muted)]">
            头像上传
            <div className="mt-2 flex flex-wrap items-center gap-3">
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
                      setForm((prev) => ({ ...prev, avatar: reader.result as string }));
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
              <label
                htmlFor={fileId}
                className="cursor-pointer rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm text-[color:var(--text)] transition hover:border-[color:var(--accent)]"
              >
                选择本地图片
              </label>
              <span className="text-xs text-[color:var(--muted)]">
                PNG/JPG，建议 1MB 以内
              </span>
            </div>
          </label>

          <label className="block text-sm text-[color:var(--muted)]">
            头像地址（可选）
            <input
              value={form.avatar}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, avatar: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
              placeholder="https://"
            />
          </label>

          <label className="block text-sm text-[color:var(--muted)]">
            简介
            <textarea
              value={form.bio}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, bio: event.target.value }))
              }
              rows={3}
              className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-transparent px-4 py-3 text-[color:var(--text)] outline-none transition focus:border-[color:var(--accent)]"
              placeholder="一句话描述"
            />
          </label>
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
