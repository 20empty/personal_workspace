/**
 * 表单验证工具函数
 */

import type { CreateProjectInput, CreateTaskInput } from "../types/devtracker";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * 验证项目输入
 */
export function validateProjectInput(input: Partial<CreateProjectInput>): ValidationResult {
  const errors: ValidationError[] = [];

  // 验证开发任务名称
  if (!input.name || input.name.trim() === "") {
    errors.push({ field: "name", message: "请输入开发任务名称" });
  } else if (input.name.length > 200) {
    errors.push({ field: "name", message: "开发任务名称不能超过200个字符" });
  }

  // 验证开始日期
  if (!input.startDate) {
    errors.push({ field: "startDate", message: "请选择开始日期" });
  } else if (!isValidDate(input.startDate)) {
    errors.push({ field: "startDate", message: "开始日期格式无效" });
  }

  // 验证结束日期
  if (!input.endDate) {
    errors.push({ field: "endDate", message: "请选择结束日期" });
  } else if (!isValidDate(input.endDate)) {
    errors.push({ field: "endDate", message: "结束日期格式无效" });
  }

  // 验证日期逻辑
  if (input.startDate && input.endDate) {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (end < start) {
      errors.push({ field: "endDate", message: "结束日期不能早于开始日期" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 验证任务输入
 */
export function validateTaskInput(input: Partial<CreateTaskInput>): ValidationResult {
  const errors: ValidationError[] = [];

  // 验证任务标题
  if (!input.title || input.title.trim() === "") {
    errors.push({ field: "title", message: "请输入任务名称" });
  } else if (input.title.length > 200) {
    errors.push({ field: "title", message: "任务名称不能超过200个字符" });
  }

  // 验证所属项目
  if (!input.projectId) {
    errors.push({ field: "projectId", message: "请选择所属项目" });
  }

  // 验证截止日期（如果有）
  if (input.dueDate && !isValidDate(input.dueDate)) {
    errors.push({ field: "dueDate", message: "截止日期格式无效" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 验证开发任务编号格式
 * 格式：DEV-YYYYMMDD-XXXX
 */
export function validateProjectCode(code: string): boolean {
  const pattern = /^DEV-\d{8}-[A-Z0-9]{4,}$/;
  return pattern.test(code);
}

/**
 * 检查日期是否有效
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * 验证状态流转是否合法
 */
export function isValidStatusTransition(
  from: string,
  to: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    planning: ["inProgress"],
    inProgress: ["completed"],
    completed: ["archived"],
    archived: [], // 归档后不能再流转
  };

  const allowed = validTransitions[from] || [];
  return allowed.includes(to);
}

/**
 * 清理用户输入（防止XSS）
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, ""); // 移除所有HTML标签
}

/**
 * 验证是否为正整数
 */
export function isPositiveInteger(value: unknown): boolean {
  if (typeof value !== "number" && typeof value !== "string") return false;
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}
