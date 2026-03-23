import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, X } from "lucide-react";
import type { WorkbookPreview } from "../../utils/courseSchedule";

type SchedulePreviewModalProps = {
  open: boolean;
  title: string;
  fileName: string;
  fileTypeLabel: string;
  workbook: WorkbookPreview | null;
  pdfUrl: string | null;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onDownload: () => Promise<void> | void;
};

export default function SchedulePreviewModal({
  open,
  title,
  fileName,
  fileTypeLabel,
  workbook,
  pdfUrl,
  error,
  loading,
  onClose,
  onDownload,
}: SchedulePreviewModalProps) {
  const [activeSheet, setActiveSheet] = useState<string>("");

  const resolvedSheet = useMemo(() => {
    if (!workbook || workbook.sheetNames.length === 0) return "";
    if (activeSheet && workbook.sheetNames.includes(activeSheet)) return activeSheet;
    return workbook.sheetNames[0];
  }, [activeSheet, workbook]);

  const rows = resolvedSheet ? workbook?.sheets[resolvedSheet] ?? [] : [];
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/55 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between border-b border-[color:var(--border)] px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              课表预览
            </div>
            <h2 className="mt-2 truncate text-xl font-semibold text-[color:var(--text)]">{title}</h2>
            <p className="mt-1 truncate text-sm text-[color:var(--muted)]">
              {fileName} · {fileTypeLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void onDownload()}
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text)] transition hover:bg-white/[0.04]"
            >
              <Download className="h-4 w-4" />
              下载副本
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[color:var(--border)] p-2 text-[color:var(--muted)] transition hover:bg-white/[0.04] hover:text-[color:var(--text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          {loading ? (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-[color:var(--border)] text-sm text-[color:var(--muted)]">
              正在加载课表预览...
            </div>
          ) : error ? (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-rose-400/35 bg-rose-500/5 px-6 text-center text-sm text-rose-200">
              {error}
            </div>
          ) : pdfUrl ? (
            <div className="h-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white">
              <iframe title={fileName} src={pdfUrl} className="h-full w-full" />
            </div>
          ) : workbook ? (
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--border)]">
              <div className="flex flex-wrap gap-2 border-b border-[color:var(--border)] bg-[color:var(--panel-strong)] px-4 py-3">
                {workbook.sheetNames.map((sheetName) => (
                  <button
                    key={sheetName}
                    type="button"
                    onClick={() => setActiveSheet(sheetName)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs transition",
                      resolvedSheet === sheetName
                        ? "border-[color:var(--accent)] bg-[color:var(--chip)] text-[color:var(--text)]"
                        : "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]",
                    ].join(" ")}
                  >
                    {sheetName}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-auto bg-[color:var(--panel)]">
                <table className="min-w-full border-collapse text-left text-sm">
                  <tbody className="divide-y divide-[color:var(--border)]">
                    {rows.length === 0 ? (
                      <tr>
                        <td className="px-5 py-10 text-center text-[color:var(--muted)]">当前工作表暂无内容</td>
                      </tr>
                    ) : (
                      rows.map((row, rowIndex) => (
                        <tr key={`${resolvedSheet}-${rowIndex}`} className="align-top">
                          {Array.from({ length: Math.max(maxColumns, 1) }).map((_, columnIndex) => (
                            <td
                              key={`${resolvedSheet}-${rowIndex}-${columnIndex}`}
                              className={[
                                "min-w-[120px] border-r border-[color:var(--border)] px-4 py-2.5 text-[color:var(--text)]",
                                rowIndex === 0 ? "bg-[color:var(--panel-strong)] font-medium" : "",
                              ].join(" ")}
                            >
                              {row[columnIndex] || ""}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-[color:var(--border)] text-sm text-[color:var(--muted)]">
              当前课表暂无可预览内容
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
