import { readFile } from "@tauri-apps/plugin-fs";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

// 图片格式类型
export type ImageFileType = "png" | "jpg" | "jpeg" | "webp" | "gif";

// 文件格式类型
export type ScheduleFileType = "xlsx" | "xls" | "numbers" | "pdf" | ImageFileType;

// 单元格样式
export type CellStyle = {
  font?: { bold?: boolean; color?: string; size?: number; name?: string };
  fill?: { color?: string; type?: string };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: {
    top?: { style?: string; color?: string };
    bottom?: { style?: string; color?: string };
    left?: { style?: string; color?: string };
    right?: { style?: string; color?: string };
  };
  colSpan?: number;
  rowSpan?: number;
};

// Excel 单元格
export type ExcelCell = {
  value: string | number | boolean | null;
  style?: CellStyle;
};

// Excel 工作表
export type ExcelSheet = {
  name: string;
  rows: ExcelCell[][];
  columnWidths: number[];
  rowHeights: number[];
  mergedCells: string[];
};

// Excel 工作簿
export type ExcelWorkbook = {
  sheetNames: string[];
  sheets: Record<string, ExcelSheet>;
};

// 预览内容类型
export type PreviewContent =
  | { type: "excel"; workbook: ExcelWorkbook }
  | { type: "pdf"; url: string }
  | { type: "image"; url: string }
  | { type: "error"; message: string };

// 从 exceljs 样式转换为我们自己的格式
function convertExcelStyle(cell: ExcelJS.Cell): CellStyle | undefined {
  const style = cell.style;
  if (!style || (Object.keys(style).length === 0)) return undefined;

  const result: CellStyle = {};

  if (style.font) {
    result.font = {
      bold: style.font.bold,
      color: style.font.color
        ? typeof style.font.color === "string"
          ? style.font.color
          : style.font.color?.argb
        : undefined,
      size: style.font.size,
      name: style.font.name,
    };
  }

  // 处理 fill - 只有 pattern 类型有 fgColor
  if (style.fill && style.fill.type) {
    const fillType = style.fill.type;
    if (fillType === "pattern") {
      const patternFill = style.fill as ExcelJS.FillPattern;
      result.fill = {
        color:
          patternFill.fgColor
            ? typeof patternFill.fgColor === "string"
              ? patternFill.fgColor
              : patternFill.fgColor?.argb
            : undefined,
        type: fillType,
      };
    }
    // 渐变填充暂不支持复杂处理，跳过
  }

  if (style.alignment) {
    result.alignment = {
      horizontal: style.alignment.horizontal,
      vertical: style.alignment.vertical,
      wrapText: style.alignment.wrapText,
    };
  }

  if (style.border) {
    const border: CellStyle["border"] = {};
    if (style.border.top) {
      border.top = {
        style: style.border.top.style,
        color:
          typeof style.border.top.color === "string"
            ? style.border.top.color
            : style.border.top.color?.argb,
      };
    }
    if (style.border.bottom) {
      border.bottom = {
        style: style.border.bottom.style,
        color:
          typeof style.border.bottom.color === "string"
            ? style.border.bottom.color
            : style.border.bottom.color?.argb,
      };
    }
    if (style.border.left) {
      border.left = {
        style: style.border.left.style,
        color:
          typeof style.border.left.color === "string"
            ? style.border.left.color
            : style.border.left.color?.argb,
      };
    }
    if (style.border.right) {
      border.right = {
        style: style.border.right.style,
        color:
          typeof style.border.right.color === "string"
            ? style.border.right.color
            : style.border.right.color?.argb,
      };
    }
    result.border = border;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

// 使用 exceljs 读取带样式的 Excel
async function loadExcelWorkbookWithStyles(path: string): Promise<ExcelWorkbook> {
  const bytes = await readFile(path);
  const workbook = new ExcelJS.Workbook();
  // exceljs 可以直接加载 ArrayBuffer
  await workbook.xlsx.load(bytes.buffer);

  const sheets: Record<string, ExcelSheet> = {};

  for (const worksheet of workbook.worksheets) {
    const sheetName = worksheet.name;
    const rows: ExcelCell[][] = [];
    const columnWidths: number[] = [];
    const rowHeights: number[] = [];
    const mergedCells: string[] = [];

    // 读取合并单元格
    if (worksheet.model?.merges) {
      for (const merge of worksheet.model.merges) {
        mergedCells.push(merge);
      }
    }

    // 读取列宽
    worksheet.columns?.forEach((col) => {
      columnWidths.push(col.width || 10);
    });

    // 读取工作表数据
    worksheet.eachRow((row, _rowNumber) => {
      rowHeights.push(row.height || 15);
      const rowCells: ExcelCell[] = [];

      row.eachCell((cell, _colNumber) => {
        const value = cell.value;
        let cellValue: string | number | boolean | null = null;

        if (value !== undefined && value !== null) {
          if (typeof value === "object" && "formula" in value) {
            // 公式单元格，使用计算后的值
            cellValue = value.result?.toString() ?? null;
          } else if (typeof value === "object" && "error" in value) {
            cellValue = `#${value.error}`;
          } else {
            cellValue = value as string | number | boolean | null;
          }
        }

        rowCells.push({
          value: cellValue,
          style: convertExcelStyle(cell),
        });
      });

      rows.push(rowCells);
    });

    sheets[sheetName] = {
      name: sheetName,
      rows,
      columnWidths,
      rowHeights,
      mergedCells,
    };
  }

  return {
    sheetNames: workbook.worksheets.map((ws) => ws.name),
    sheets,
  };
}

// 使用 xlsx 读取纯数据 Excel（回退方案）
async function loadExcelWorkbookBasic(path: string): Promise<ExcelWorkbook> {
  const bytes = await readFile(path);
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheets: Record<string, ExcelSheet> = {};

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
      workbook.Sheets[sheetName],
      { header: 1, raw: false, defval: "" }
    );

    sheets[sheetName] = {
      name: sheetName,
      rows: rows.map((row) => row.map((cell) => ({ value: cell ?? null }))),
      columnWidths: [],
      rowHeights: [],
      mergedCells: [],
    };
  }

  return {
    sheetNames: workbook.SheetNames,
    sheets,
  };
}

// 加载 PDF Blob URL
async function loadPdfBlobUrl(path: string): Promise<string> {
  const bytes = await readFile(path);
  const pdfBlob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(pdfBlob);
}

// 加载图片 Blob URL
async function loadImageBlobUrl(path: string): Promise<string> {
  const bytes = await readFile(path);
  const ext = path.toLowerCase().split(".").pop() || "png";
  let mimeType = "image/png";

  if (ext === "jpg" || ext === "jpeg") {
    mimeType = "image/jpeg";
  } else if (ext === "webp") {
    mimeType = "image/webp";
  } else if (ext === "gif") {
    mimeType = "image/gif";
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

// 推断文件类型
export function inferFileType(path: string, explicitType?: string | null): ScheduleFileType | null {
  const explicit = explicitType?.toLowerCase();
  if (explicit === "xlsx" || explicit === "xls" || explicit === "numbers" || explicit === "pdf") {
    return explicit;
  }
  if (explicit === "png" || explicit === "jpg" || explicit === "jpeg" || explicit === "webp" || explicit === "gif") {
    return explicit;
  }

  const lower = path.toLowerCase();
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".xls")) return "xls";
  if (lower.endsWith(".numbers")) return "numbers";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".webp")) return "webp";
  if (lower.endsWith(".gif")) return "gif";

  return null;
}

// 统一的预览加载函数
export async function loadPreview(
  path: string,
  fileType: ScheduleFileType,
  previewPath?: string | null
): Promise<PreviewContent> {
  try {
    switch (fileType) {
      case "xlsx":
      case "xls": {
        try {
          const workbook = await loadExcelWorkbookWithStyles(path);
          return { type: "excel", workbook };
        } catch {
          // 如果带样式读取失败，使用基础读取
          const workbook = await loadExcelWorkbookBasic(path);
          return { type: "excel", workbook };
        }
      }

      case "numbers": {
        if (!previewPath) {
          return { type: "error", message: "当前课表还没有可用的预览文件，请先在课程库中预览一次后再查看。" };
        }
        const url = await loadPdfBlobUrl(previewPath);
        return { type: "pdf", url };
      }

      case "pdf": {
        const url = await loadPdfBlobUrl(path);
        return { type: "pdf", url };
      }

      case "png":
      case "jpeg":
      case "webp":
      case "gif": {
        const url = await loadImageBlobUrl(path);
        return { type: "image", url };
      }

      default:
        return { type: "error", message: `不支持的文件类型: ${fileType}` };
    }
  } catch (error) {
    console.error("Preview loading error:", error);
    return { type: "error", message: `预览加载失败: ${String(error)}` };
  }
}

// 获取文件类型标签
export function getFileTypeLabel(fileType: ScheduleFileType | null): string {
  if (!fileType) return "未知类型";

  const labels: Record<ScheduleFileType, string> = {
    xlsx: "Excel (.xlsx)",
    xls: "Excel (.xls)",
    numbers: "Numbers",
    pdf: "PDF",
    png: "图片 (.png)",
    jpg: "图片 (.jpg)",
    jpeg: "图片 (.jpeg)",
    webp: "图片 (.webp)",
    gif: "图片 (.gif)",
  };

  return labels[fileType] || fileType.toUpperCase();
}
