import { useEffect, useMemo, useState } from "react";
import type { ExcelWorkbook, ExcelCell } from "../../utils/previewEngine";

const DEFAULT_INITIAL_ROW_LIMIT = 300;
const DEFAULT_ROW_INCREMENT = 300;
const DEFAULT_MAX_COLUMN_LIMIT = 80;

// 将 ARGB 颜色转换为 CSS 颜色
function resolveColor(color: string | undefined): string {
  if (!color) return "transparent";
  // ARGB 格式 (如 FF000000) -> 去掉前两位 alpha
  if (color.length === 8) {
    return `#${color.slice(2)}`;
  }
  return color;
}

// 渲染单个单元格样式
function getCellStyle(cell: ExcelCell): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (cell.style?.font) {
    if (cell.style.font.bold) style.fontWeight = "bold";
    if (cell.style.font.color) style.color = resolveColor(cell.style.font.color);
    if (cell.style.font.size) style.fontSize = `${cell.style.font.size}px`;
    if (cell.style.font.name) style.fontFamily = cell.style.font.name;
  }

  if (cell.style?.fill?.color) {
    style.backgroundColor = resolveColor(cell.style.fill.color);
  }

  if (cell.style?.alignment) {
    if (cell.style.alignment.horizontal) {
      style.textAlign = cell.style.alignment.horizontal as React.CSSProperties["textAlign"];
    }
    if (cell.style.alignment.vertical) {
      style.verticalAlign = cell.style.alignment.vertical as React.CSSProperties["verticalAlign"];
    }
    if (cell.style.alignment.wrapText) {
      style.whiteSpace = "pre-wrap";
    }
  }

  if (cell.style?.border) {
    const b = cell.style.border;
    if (b.top?.style) {
      style.borderTop = `${b.top.style} ${resolveColor(b.top.color)}`;
    }
    if (b.bottom?.style) {
      style.borderBottom = `${b.bottom.style} ${resolveColor(b.bottom.color)}`;
    }
    if (b.left?.style) {
      style.borderLeft = `${b.left.style} ${resolveColor(b.left.color)}`;
    }
    if (b.right?.style) {
      style.borderRight = `${b.right.style} ${resolveColor(b.right.color)}`;
    }
  }

  return style;
}

interface ExcelRendererProps {
  workbook: ExcelWorkbook;
  activeSheet?: string;
  onActiveSheetChange?: (sheet: string) => void;
  initialRowLimit?: number;
  rowIncrement?: number;
  maxColumnLimit?: number;
}

export default function ExcelRenderer({
  workbook,
  activeSheet: externalActiveSheet,
  onActiveSheetChange,
  initialRowLimit = DEFAULT_INITIAL_ROW_LIMIT,
  rowIncrement = DEFAULT_ROW_INCREMENT,
  maxColumnLimit = DEFAULT_MAX_COLUMN_LIMIT,
}: ExcelRendererProps) {
  const [internalActiveSheet, setInternalActiveSheet] = useState<string>("");
  const [visibleRowCount, setVisibleRowCount] = useState(initialRowLimit);
  const isExternal = externalActiveSheet !== undefined;
  const activeSheet = isExternal ? externalActiveSheet : internalActiveSheet;
  const setActiveSheet = isExternal ? (onActiveSheetChange ?? (() => {})) : setInternalActiveSheet;

  const resolvedSheet = useMemo(() => {
    if (!workbook || workbook.sheetNames.length === 0) return "";
    if (activeSheet && workbook.sheetNames.includes(activeSheet)) return activeSheet;
    return workbook.sheetNames[0];
  }, [activeSheet, workbook]);

  const currentSheet = resolvedSheet ? workbook.sheets[resolvedSheet] : null;
  const rows = currentSheet?.rows ?? [];
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const visibleRows = useMemo(
    () => rows.slice(0, Math.min(visibleRowCount, rows.length)),
    [rows, visibleRowCount]
  );
  const visibleColumnCount = Math.min(Math.max(maxColumns, 1), maxColumnLimit);
  const hiddenRowCount = Math.max(rows.length - visibleRows.length, 0);
  const hiddenColumnCount = Math.max(maxColumns - visibleColumnCount, 0);

  useEffect(() => {
    setVisibleRowCount(initialRowLimit);
  }, [initialRowLimit, resolvedSheet, workbook]);

  // 使用 useMemo 缓存所有单元格的样式，避免每次渲染重新计算
  const cellStyles = useMemo(() => {
    return visibleRows.map((row) =>
      row.map((cell) => (cell ? getCellStyle(cell) : {}))
    );
  }, [visibleRows]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-[color:var(--border)]">
      {/* 表头 */}
      <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] bg-[color:var(--panel-strong)] px-5 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">
            当前工作表
          </p>
          <p className="mt-1 text-sm font-medium text-[color:var(--text)]">
            {resolvedSheet || "未选择工作表"}
          </p>
        </div>
        <div className="text-xs text-[color:var(--muted)]">
          显示 {visibleRows.length}/{rows.length} 行，{visibleColumnCount}/{Math.max(maxColumns, 1)} 列
        </div>
      </div>

      {/* 工作表切换 */}
      {workbook.sheetNames.length > 1 && (
        <div className="flex gap-2 border-b border-[color:var(--border)] bg-[color:var(--panel)] px-5 py-2 overflow-x-auto">
          {workbook.sheetNames.map((sheetName) => (
            <button
              key={sheetName}
              type="button"
              onClick={() => setActiveSheet(sheetName)}
              className={[
                "shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                resolvedSheet === sheetName
                  ? "bg-[color:var(--accent)] text-white"
                  : "text-[color:var(--muted)] hover:text-[color:var(--text)]",
              ].join(" ")}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}

      {/* 表格区域 */}
      <div className="min-h-0 flex-1 overflow-auto bg-[color:var(--panel)]">
        {rows.length === 0 ? (
          <div className="grid h-full place-items-center px-6 py-10 text-sm text-[color:var(--muted)]">
            当前工作表暂无内容
          </div>
        ) : (
          <table className="min-w-full border-collapse text-left text-sm">
            <tbody className="divide-y divide-[color:var(--border)]">
              {visibleRows.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className="align-top"
                  style={{
                    height: currentSheet?.rowHeights?.[rowIndex]
                      ? `${currentSheet.rowHeights[rowIndex]}px`
                      : undefined,
                  }}
                >
                  {Array.from({ length: visibleColumnCount }).map((_, columnIndex) => {
                    const cell = row[columnIndex];
                    const cellStyle = cellStyles[rowIndex]?.[columnIndex] ?? {};
                    const isFirstRow = rowIndex === 0;

                    return (
                      <td
                        key={`cell-${rowIndex}-${columnIndex}`}
                        style={{
                          ...cellStyle,
                          minWidth: currentSheet?.columnWidths?.[columnIndex]
                            ? `${currentSheet.columnWidths[columnIndex] * 8}px`
                            : "140px",
                        }}
                        className={[
                          "border-r border-[color:var(--border)] px-4 py-3 text-[color:var(--text)]",
                          isFirstRow ? "bg-[color:var(--panel-strong)] font-semibold" : "",
                        ].join(" ")}
                      >
                        {cell ? String(cell.value ?? "") : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {(hiddenRowCount > 0 || hiddenColumnCount > 0) && (
          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] bg-[color:var(--panel)] px-5 py-3 text-xs text-[color:var(--muted)]">
            <span>
              {hiddenRowCount > 0 ? `还有 ${hiddenRowCount} 行未显示` : "所有行已显示"}
              {hiddenColumnCount > 0 ? `，已限制展示前 ${visibleColumnCount} 列` : ""}
            </span>
            {hiddenRowCount > 0 && (
              <button
                type="button"
                onClick={() => setVisibleRowCount((count) => Math.min(count + rowIncrement, rows.length))}
                className="rounded-xl border border-[color:var(--border)] px-3 py-1.5 font-medium text-[color:var(--text)] transition hover:bg-white/[0.04]"
              >
                加载更多
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
