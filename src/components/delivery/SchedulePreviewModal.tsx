import { Download, FileSpreadsheet, LayoutList, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PreviewContent, ScheduleFileType } from "../../utils/previewEngine";
import { getFileTypeLabel } from "../../utils/previewEngine";
import ExcelRenderer from "../preview/ExcelRenderer";
import PdfRenderer from "../preview/PdfRenderer";
import ImageRenderer from "../preview/ImageRenderer";

type SchedulePreviewModalProps = {
  open: boolean;
  title: string;
  fileName: string;
  fileType: ScheduleFileType | null;
  previewContent: PreviewContent | null;
  loading: boolean;
  onClose: () => void;
  onDownload: () => Promise<void> | void;
};

export default function SchedulePreviewModal({
  open,
  title,
  fileName,
  fileType,
  previewContent,
  loading,
  onClose,
  onDownload,
}: SchedulePreviewModalProps) {
  const [activeSheet, setActiveSheet] = useState<string>("");

  const fileTypeLabel = useMemo(() => getFileTypeLabel(fileType), [fileType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[color:var(--panel)] shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              课表审阅
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

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-[color:var(--border)] bg-[color:var(--panel-strong)] p-5 lg:border-b-0 lg:border-r">
            <div className="rounded-2xl border border-[color:var(--border)] bg-black/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
                文件概要
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-[color:var(--muted)]">文件名</p>
                  <p className="mt-1 break-all font-medium text-[color:var(--text)]">{fileName}</p>
                </div>
                <div>
                  <p className="text-xs text-[color:var(--muted)]">文件类型</p>
                  <p className="mt-1 font-medium text-[color:var(--text)]">{fileTypeLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-[color:var(--muted)]">审阅说明</p>
                  <p className="mt-1 leading-6 text-[color:var(--text)]/72">
                    左侧用于切换工作表与查看文件信息，右侧用于集中审阅课表内容。
                  </p>
                </div>
              </div>
            </div>

            {/* 工作表切换 - 仅 Excel 显示 */}
            {previewContent?.type === "excel" && previewContent.workbook.sheetNames.length > 0 && (
              <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  <LayoutList className="h-4 w-4" />
                  工作表
                </div>
                <div className="mt-4 space-y-2">
                  {previewContent.workbook.sheetNames.map((sheetName) => (
                    <button
                      key={sheetName}
                      type="button"
                      onClick={() => setActiveSheet(sheetName)}
                      className={[
                        "flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm transition",
                        (activeSheet || previewContent.workbook.sheetNames[0]) === sheetName
                          ? "border-[color:var(--accent)] bg-[color:var(--chip)] text-[color:var(--text)]"
                          : "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]",
                      ].join(" ")}
                    >
                      <span className="truncate">{sheetName}</span>
                      <span className="ml-3 shrink-0 text-[10px] uppercase tracking-[0.2em]">
                        Sheet
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="min-h-0 p-5">
            {loading ? (
              <div className="grid h-full place-items-center rounded-3xl border border-dashed border-[color:var(--border)] text-sm text-[color:var(--muted)]">
                正在加载课表预览...
              </div>
            ) : previewContent?.type === "error" ? (
              <div className="grid h-full place-items-center rounded-3xl border border-rose-400/35 bg-rose-500/5 px-6 text-center text-sm text-rose-200">
                {previewContent.message}
              </div>
            ) : previewContent?.type === "excel" ? (
              <ExcelRenderer
                workbook={previewContent.workbook}
                activeSheet={activeSheet}
                onActiveSheetChange={setActiveSheet}
              />
            ) : previewContent?.type === "pdf" ? (
              <PdfRenderer url={previewContent.url} fileName={fileName} />
            ) : previewContent?.type === "image" ? (
              <ImageRenderer url={previewContent.url} fileName={fileName} />
            ) : (
              <div className="grid h-full place-items-center rounded-3xl border border-dashed border-[color:var(--border)] text-sm text-[color:var(--muted)]">
                当前课表暂无可预览内容
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
