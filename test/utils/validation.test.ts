/**
 * 表单验证工具函数测试
 * 对应测试用例：TC-DP-002, TC-DP-009, TC-DP-010, TC-TK-008
 */

import { describe, it, expect } from "vitest";
import {
  validateProjectInput,
  validateTaskInput,
  validateProjectCode,
  isValidStatusTransition,
  sanitizeInput,
} from "@/utils/validation";

describe("validateProjectInput", () => {
  it("TC-DP-001: should pass with valid input", () => {
    const input = {
      name: "云原生平台开发",
      startDate: "2024-03-01",
      endDate: "2024-06-30",
    };

    const result = validateProjectInput(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("TC-DP-002: should fail with empty required fields", () => {
    const input = {
      name: "",
      startDate: "",
      endDate: "",
    };

    const result = validateProjectInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "name",
      message: "请输入开发任务名称",
    });
    expect(result.errors).toContainEqual({
      field: "startDate",
      message: "请选择开始日期",
    });
    expect(result.errors).toContainEqual({
      field: "endDate",
      message: "请选择结束日期",
    });
  });

  it("TC-DP-010: should fail when end date is before start date", () => {
    const input = {
      name: "测试项目",
      startDate: "2024-06-30",
      endDate: "2024-01-01",
    };

    const result = validateProjectInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "endDate",
      message: "结束日期不能早于开始日期",
    });
  });

  it("should fail with name exceeding 200 characters", () => {
    const input = {
      name: "a".repeat(201),
      startDate: "2024-03-01",
      endDate: "2024-06-30",
    };

    const result = validateProjectInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "name",
      message: "开发任务名称不能超过200个字符",
    });
  });

  it("should fail with invalid date format", () => {
    const input = {
      name: "测试项目",
      startDate: "invalid-date",
      endDate: "2024-06-30",
    };

    const result = validateProjectInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "startDate",
      message: "开始日期格式无效",
    });
  });
});

describe("validateTaskInput", () => {
  it("should pass with valid input", () => {
    const input = {
      projectId: "proj-001",
      title: "设计数据库架构",
    };

    const result = validateTaskInput(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail with empty title", () => {
    const input = {
      projectId: "proj-001",
      title: "",
    };

    const result = validateTaskInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "title",
      message: "请输入任务名称",
    });
  });

  it("should fail without projectId", () => {
    const input = {
      title: "测试任务",
    };

    const result = validateTaskInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "projectId",
      message: "请选择所属项目",
    });
  });

  it("TC-TK-008: should validate due date format", () => {
    const input = {
      projectId: "proj-001",
      title: "测试任务",
      dueDate: "invalid-date",
    };

    const result = validateTaskInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "dueDate",
      message: "截止日期格式无效",
    });
  });
});

describe("validateProjectCode", () => {
  it("TC-DP-009: should validate correct task code format", () => {
    expect(validateProjectCode("DEV-20260322-ABCD")).toBe(true);
    expect(validateProjectCode("DEV-20241201-A1B2")).toBe(true);
    expect(validateProjectCode("DEV-20250115-XYZ9")).toBe(true);
  });

  it("should reject invalid task code formats", () => {
    expect(validateProjectCode("INVALID")).toBe(false);
    expect(validateProjectCode("DEV-2024")).toBe(false);
    expect(validateProjectCode("2024-001")).toBe(false);
    expect(validateProjectCode("PO-24-001")).toBe(false);
    expect(validateProjectCode("")).toBe(false);
  });
});

describe("isValidStatusTransition", () => {
  it("TC-DP-003: should allow planning -> inProgress", () => {
    expect(isValidStatusTransition("planning", "inProgress")).toBe(true);
  });

  it("TC-DP-004: should allow inProgress -> completed", () => {
    expect(isValidStatusTransition("inProgress", "completed")).toBe(true);
  });

  it("TC-DP-005: should allow completed -> archived", () => {
    expect(isValidStatusTransition("completed", "archived")).toBe(true);
  });

  it("should reject planning -> completed (skip inProgress)", () => {
    expect(isValidStatusTransition("planning", "completed")).toBe(false);
  });

  it("should reject completed -> inProgress (cannot go back)", () => {
    expect(isValidStatusTransition("completed", "inProgress")).toBe(false);
  });

  it("should reject archived -> any status", () => {
    expect(isValidStatusTransition("archived", "completed")).toBe(false);
    expect(isValidStatusTransition("archived", "planning")).toBe(false);
  });
});

describe("sanitizeInput", () => {
  it("TC-BD-004: should remove script tags", () => {
    const input = "<script>alert('xss')</script>Hello";
    expect(sanitizeInput(input)).toBe("Hello");
  });

  it("should remove all HTML tags", () => {
    const input = "<div>Hello</div><p>World</p>";
    expect(sanitizeInput(input)).toBe("HelloWorld");
  });

  it("should keep plain text", () => {
    const input = "Hello World 123";
    expect(sanitizeInput(input)).toBe("Hello World 123");
  });

  it("should handle empty string", () => {
    expect(sanitizeInput("")).toBe("");
  });
});
