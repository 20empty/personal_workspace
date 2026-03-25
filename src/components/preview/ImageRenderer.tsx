import { useState } from "react";

interface ImageRendererProps {
  url: string;
  fileName: string;
}

export default function ImageRenderer({ url, fileName }: ImageRendererProps) {
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const zoomIn = () => {
    setScale((s) => Math.min(s + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((s) => Math.max(s - 0.25, 0.25));
  };

  const resetZoom = () => {
    setScale(1);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-[color:var(--border)]">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] bg-[color:var(--panel-strong)] px-5 py-3">
        <div className="text-xs text-[color:var(--muted)]">
          {fileName}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--text)] transition hover:bg-white/[0.04]"
          >
            缩小
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--text)] transition hover:bg-white/[0.04]"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--text)] transition hover:bg-white/[0.04]"
          >
            放大
          </button>
        </div>
      </div>

      {/* 图片区域 */}
      <div className="min-h-0 flex-1 overflow-auto bg-[color:var(--panel)] p-4">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-[color:var(--muted)]">正在加载图片...</div>
          </div>
        )}
        {error && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-sm text-rose-200">{error}</div>
          </div>
        )}
        <div className="flex justify-center">
          <img
            src={url}
            alt={fileName}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError("图片加载失败");
            }}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
