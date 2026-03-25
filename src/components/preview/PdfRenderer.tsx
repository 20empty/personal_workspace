import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfRendererProps {
  url: string;
  fileName?: string;
}

export default function PdfRenderer({ url, fileName: _fileName }: PdfRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // 加载 PDF 文档
  useEffect(() => {
    let isMounted = true;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        pdfDocRef.current = pdf;
        setPageCount(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error("PDF loading error:", err);
        setError(`PDF 加载失败: ${String(err)}`);
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [url]);

  // 渲染当前页面
  useEffect(() => {
    if (!pdfDocRef.current || !canvasRef.current || !containerRef.current) return;

    let isMounted = true;

    async function renderPage() {
      try {
        const page = await pdfDocRef.current!.getPage(currentPage);
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;

        // 计算缩放后的视口
        const containerWidth = containerRef.current!.clientWidth - 32;
        const viewport = page.getViewport({ scale: 1 });
        const actualScale = Math.min((containerWidth / viewport.width) * scale, 2);
        const scaledViewport = page.getViewport({ scale: actualScale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;

        if (!isMounted) return;
      } catch (err) {
        console.error("Page render error:", err);
      }
    }

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, scale]);

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < pageCount) setCurrentPage(currentPage + 1);
  };

  const zoomIn = () => {
    setScale((s) => Math.min(s + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((s) => Math.max(s - 0.25, 0.5));
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[color:var(--border)]">
        <div className="text-center text-sm text-[color:var(--muted)]">正在加载 PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-rose-400/35 bg-rose-500/5">
        <div className="text-center text-sm text-rose-200">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-[color:var(--border)]">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] bg-[color:var(--panel-strong)] px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--text)] transition hover:bg-white/[0.04] disabled:opacity-30"
          >
            上一页
          </button>
          <span className="text-xs text-[color:var(--muted)]">
            {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage >= pageCount}
            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--text)] transition hover:bg-white/[0.04] disabled:opacity-30"
          >
            下一页
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--text)] transition hover:bg-white/[0.04]"
          >
            缩小
          </button>
          <span className="text-xs text-[color:var(--muted)]">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs text-[color:var(--text)] transition hover:bg-white/[0.04]"
          >
            放大
          </button>
        </div>
      </div>

      {/* PDF 画布 */}
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto bg-[color:var(--panel)] p-4"
      >
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="max-w-full rounded shadow-lg"
            style={{ backgroundColor: "#fff" }}
          />
        </div>
      </div>
    </div>
  );
}
