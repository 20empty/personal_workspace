/**
 * 班级导入工具 - 从 Excel 文件批量导入班级基本信息
 */

import { readFile } from "@tauri-apps/plugin-fs";
import * as XLSX from "xlsx";
import { createDeliveryClass } from "../db/delivery";
import type { DeliveryClassInput, ClassType } from "../db/delivery";

// Excel 列映射（0-indexed，对应数组索引）
const CLASS_COLUMNS = {
  contractNo: 3,    // D - 合同号
  title: 6,         // G - 培训项目（班级名称）
  location: 7,      // H - 具体地点（交付地点）
  code: 8,          // I - 班级代码
  startDate: 10,    // K - 项目开始时间
  endDate: 11,      // L - 项目结束时间
  teacherPo: 12,    // M - 班级时长（作为授课PO）
  learners: 13,     // N - 人数
  classType: 33,    // AH - 培训地点
} as const;

// 班级类型映射（基于培训地点）
const CLASS_TYPE_MAP: Record<string, ClassType> = {
  '当地': 'domestic',           // 国内出差
  '集中培训': 'centralized',
  '国内出差': 'domestic',
  '海外出差': 'overseas',
  '在线培训': 'online',
  'centralized': 'centralized',
  'domestic': 'domestic',
  'overseas': 'overseas',
  'online': 'online',
};

// 验证日期格式
function parseDate(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  // 支持：2026-05-01, 2026/05/01, 2026.05.01
  const match = str.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return null;
}

// 验证必填字段
function validateRow(
  row: unknown[],
  rowIndex: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const code = row[CLASS_COLUMNS.code];
  const title = row[CLASS_COLUMNS.title];
  const location = row[CLASS_COLUMNS.location];
  const startDate = parseDate(row[CLASS_COLUMNS.startDate]);
  const endDate = parseDate(row[CLASS_COLUMNS.endDate]);

  if (!code) errors.push(`行${rowIndex + 1}: 班级编码不能为空`);
  if (!title) errors.push(`行${rowIndex + 1}: 班级名称不能为空`);
  if (!location) errors.push(`行${rowIndex + 1}: 交付地点不能为空`);
  if (!startDate) errors.push(`行${rowIndex + 1}: 开班日期格式错误或为空`);
  if (!endDate) errors.push(`行${rowIndex + 1}: 结业日期格式错误或为空`);
  if (startDate && endDate && endDate < startDate) {
    errors.push(`行${rowIndex + 1}: 结业日期不能早于开班日期`);
  }

  return { valid: errors.length === 0, errors };
}

function parseClassType(value: unknown): ClassType {
  const str = String(value ?? '').trim();
  // 当地 -> 国内出差，其他默认集中培训
  if (str === '当地') return 'domestic';
  return CLASS_TYPE_MAP[str] || 'centralized';
}

// 解析结果类型
export interface ParseResult {
  success: boolean;
  classes: DeliveryClassInput[];
  errors: Array<{
    row: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

export interface ImportOptions {
  onProgress?: (current: number, total: number, classTitle: string) => void;
}

export interface ImportSummary {
  success: boolean;
  totalClasses: number;
  createdClassIds: string[];
  errors: Array<{ classCode: string; message: string }>;
}

/**
 * 解析 Excel 文件，返回班级数据列表
 */
export async function parseClassImportExcel(path: string): Promise<ParseResult> {
  const bytes = await readFile(path);
  const workbook = XLSX.read(bytes, { type: "array" });

  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  // 跳过表头行（第一行）
  const dataRows = rows.slice(1).filter(row =>
    row.some(cell => cell !== null && cell !== "")
  );

  const classes: DeliveryClassInput[] = [];
  const errors: ParseResult['errors'] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowIndex = i + 2; // +2 因为跳过了表头且从1开始计数

    // 判断是否是空行（所有班级相关列都为空）
    const code = row[CLASS_COLUMNS.code];
    if (!code) continue;

    // 验证必填字段
    const validation = validateRow(row, rowIndex);
    if (!validation.valid) {
      validation.errors.forEach(err => {
        errors.push({ row: rowIndex, message: err, severity: 'error' });
      });
      continue;
    }

    const teacherPo = Number(row[CLASS_COLUMNS.teacherPo]) || 0;

    const classData: DeliveryClassInput = {
      code: String(code).trim(),
      title: String(row[CLASS_COLUMNS.title] || '').trim(),
      classType: parseClassType(row[CLASS_COLUMNS.classType]),
      contractNo: String(row[CLASS_COLUMNS.contractNo] || '').trim() || undefined,
      location: String(row[CLASS_COLUMNS.location] || '').trim(),
      startDate: parseDate(row[CLASS_COLUMNS.startDate])!,
      endDate: parseDate(row[CLASS_COLUMNS.endDate])!,
      learners: Number(row[CLASS_COLUMNS.learners]) || 0,
      teacherPo,
      projectSupportPo: 0, // 模板中无此字段
      headteacherPo: Math.round(teacherPo * 0.1 * 10) / 10, // 授课 PO * 0.1
      status: '已排期',
      stage: 'upcoming',
      progress: 0,
      archiveState: '待归档',
      focus: ['待完善'],
      notes: undefined,
    };

    classes.push(classData);
  }

  return {
    success: errors.filter(e => e.severity === 'error').length === 0,
    classes,
    errors,
  };
}

/**
 * 执行导入，从 Excel 文件创建班级
 */
export async function executeClassImport(
  path: string,
  options?: ImportOptions
): Promise<ImportSummary> {
  // 1. 解析 Excel
  const parseResult = await parseClassImportExcel(path);

  if (parseResult.classes.length === 0) {
    if (parseResult.errors.length > 0) {
      throw new Error(`解析失败:\n${parseResult.errors.map(e => e.message).join('\n')}`);
    }
    throw new Error('未找到任何班级数据');
  }

  // 2. 执行导入
  const createdClassIds: string[] = [];
  const errors: ImportSummary['errors'] = [];

  for (let i = 0; i < parseResult.classes.length; i++) {
    const classData = parseResult.classes[i];

    options?.onProgress?.(i + 1, parseResult.classes.length, classData.title);

    try {
      const classId = await createDeliveryClass(classData);
      createdClassIds.push(classId);
    } catch (err) {
      errors.push({
        classCode: classData.code,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    success: errors.length === 0,
    totalClasses: parseResult.classes.length,
    createdClassIds,
    errors,
  };
}
