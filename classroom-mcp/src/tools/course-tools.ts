import {
  getCoursesByClassId,
  createDeliveryCourse,
  updateDeliveryCourse,
  deleteDeliveryCourse,
} from "../db/sqlite.js";
import type { CourseRecord } from "../db/schema.js";

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const courseTools: Tool[] = [
  {
    name: "get_courses",
    description: "获取指定班级的所有课程。",
    inputSchema: {
      type: "object",
      properties: {
        classId: {
          type: "string",
          description: "班级 ID",
        },
      },
      required: ["classId"],
    },
  },
  {
    name: "create_course",
    description: "为班级创建一个课程。",
    inputSchema: {
      type: "object",
      properties: {
        classId: {
          type: "string",
          description: "班级 ID",
        },
        name: {
          type: "string",
          description: "课程名称",
        },
        level: {
          type: "string",
          description: "课程级别：L2, L3, L4",
        },
        days: {
          type: "string",
          description: "课程天数",
        },
        startDate: {
          type: "string",
          description: "课程开始日期 YYYY-MM-DD",
        },
        endDate: {
          type: "string",
          description: "课程结束日期 YYYY-MM-DD",
        },
        courseTemplateId: {
          type: "string",
          description: "课程模板 ID（可选）",
        },
        orderIndex: {
          type: "number",
          description: "排序索引",
        },
      },
      required: ["classId", "name", "days", "startDate", "endDate"],
    },
  },
  {
    name: "update_course",
    description: "更新课程信息。",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "课程 ID",
        },
        name: {
          type: "string",
          description: "课程名称",
        },
        level: {
          type: "string",
          description: "课程级别：L2, L3, L4",
        },
        days: {
          type: "string",
          description: "课程天数",
        },
        startDate: {
          type: "string",
          description: "课程开始日期 YYYY-MM-DD",
        },
        endDate: {
          type: "string",
          description: "课程结束日期 YYYY-MM-DD",
        },
        orderIndex: {
          type: "number",
          description: "排序索引",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_course",
    description: "删除课程。",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "课程 ID",
        },
      },
      required: ["id"],
    },
  },
];

// ───────── Tool Handlers ─────────

export async function handleGetCourses(args: unknown) {
  const { classId } = args as { classId: string };
  const courses = getCoursesByClassId(classId);
  return {
    content: [{ type: "text", text: JSON.stringify(courses, null, 2) }],
  };
}

export async function handleCreateCourse(args: unknown) {
  const input = args as Omit<CourseRecord, "id" | "createdAt" | "updatedAt">;
  const id = createDeliveryCourse(input);
  return {
    content: [{ type: "text", text: `课程 ${id} 已创建：${input.name}` }],
  };
}

export async function handleUpdateCourse(args: unknown) {
  const { id, ...patch } = args as { id: string } & Partial<Omit<CourseRecord, "id" | "createdAt" | "updatedAt">>;
  updateDeliveryCourse(id, patch);
  return {
    content: [{ type: "text", text: `课程 ${id} 已更新` }],
  };
}

export async function handleDeleteCourse(args: unknown) {
  const { id } = args as { id: string };
  deleteDeliveryCourse(id);
  return {
    content: [{ type: "text", text: `课程 ${id} 已删除` }],
  };
}
