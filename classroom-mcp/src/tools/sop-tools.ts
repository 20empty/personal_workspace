import {
  getSopTasksByClassId,
  toggleSopTaskStatus,
  completeAllSopTasksByClassId,
  listSopTemplatesByClassType,
  createSopTemplate,
  deleteSopTemplate,
} from "../db/sqlite.js";
import type { ClassType } from "../db/schema.js";

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const sopTools: Tool[] = [
  {
    name: "list_sop_templates",
    description: "列出指定班级类型的 SOP 任务模板。",
    inputSchema: {
      type: "object",
      properties: {
        classType: {
          type: "string",
          enum: ["overseas", "domestic", "centralized", "online"],
          description: "班级类型",
        },
      },
      required: ["classType"],
    },
  },
  {
    name: "get_sop_tasks",
    description: "获取指定班级的所有 SOP 任务。",
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
    name: "toggle_sop_task",
    description: "切换单个 SOP 任务的状态。",
    inputSchema: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "SOP 任务 ID",
        },
        newStatus: {
          type: "string",
          enum: ["pending", "completed"],
          description: "新状态：pending=待完成, completed=已完成",
        },
      },
      required: ["taskId", "newStatus"],
    },
  },
  {
    name: "complete_all_sop_tasks",
    description: "将指定班级的所有 SOP 任务标记为已完成。",
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
    name: "create_sop_template",
    description: "为指定班级类型创建一个 SOP 模板任务。",
    inputSchema: {
      type: "object",
      properties: {
        classType: {
          type: "string",
          enum: ["overseas", "domestic", "centralized", "online"],
          description: "班级类型",
        },
        stage: {
          type: "string",
          enum: ["pre", "during", "post"],
          description: "阶段：pre=课前, during=课中, post=课后",
        },
        title: {
          type: "string",
          description: "任务标题",
        },
      },
      required: ["classType", "stage", "title"],
    },
  },
  {
    name: "delete_sop_template",
    description: "删除一个 SOP 模板任务。",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "SOP 模板 ID",
        },
      },
      required: ["id"],
    },
  },
];

// ───────── Tool Handlers ─────────

export async function handleListSopTemplates(args: unknown) {
  const { classType } = args as { classType: ClassType };
  const templates = listSopTemplatesByClassType(classType);
  return {
    content: [{ type: "text", text: JSON.stringify(templates, null, 2) }],
  };
}

export async function handleGetSopTasks(args: unknown) {
  const { classId } = args as { classId: string };
  const tasks = getSopTasksByClassId(classId);
  return {
    content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
  };
}

export async function handleToggleSopTask(args: unknown) {
  const { taskId, newStatus } = args as { taskId: string; newStatus: string };
  toggleSopTaskStatus(taskId, newStatus);
  return {
    content: [{ type: "text", text: `任务 ${taskId} 已更新为 ${newStatus}` }],
  };
}

export async function handleCompleteAllSopTasks(args: unknown) {
  const { classId } = args as { classId: string };
  completeAllSopTasksByClassId(classId);
  return {
    content: [{ type: "text", text: `班级 ${classId} 的所有 SOP 任务已标记为完成` }],
  };
}

export async function handleCreateSopTemplate(args: unknown) {
  const { classType, stage, title } = args as {
    classType: ClassType;
    stage: string;
    title: string;
  };
  const id = createSopTemplate({ classType, stage, title });
  return {
    content: [{ type: "text", text: `SOP 模板 ${id} 已创建：${title}` }],
  };
}

export async function handleDeleteSopTemplate(args: unknown) {
  const { id } = args as { id: string };
  deleteSopTemplate(id);
  return {
    content: [{ type: "text", text: `SOP 模板 ${id} 已删除` }],
  };
}
