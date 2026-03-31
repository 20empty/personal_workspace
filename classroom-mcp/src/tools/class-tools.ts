import {
  listDeliveryClasses,
  getDeliveryClass,
  createDeliveryClass,
  updateDeliveryClass,
  deleteDeliveryClass,
} from "../db/sqlite.js";
import type { DeliveryClassInput } from "../db/schema.js";

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const classTools: Tool[] = [
  {
    name: "create_class",
    description:
      "创建一个新的培训班级。创建后会自动根据班级类型生成 SOP 任务模板。",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "班级名称，如 '2024 Q1 海外班'",
        },
        code: {
          type: "string",
          description: "班级编号，如 'CLASS-2024-001'",
        },
        classType: {
          type: "string",
          enum: ["overseas", "domestic", "centralized", "online"],
          description: "班级类型：overseas=海外出差培训, domestic=国内出差培训, centralized=集中培训, online=在线培训",
        },
        location: {
          type: "string",
          description: "培训地点",
        },
        startDate: {
          type: "string",
          description: "开班日期，格式 YYYY-MM-DD",
        },
        endDate: {
          type: "string",
          description: "结业日期，格式 YYYY-MM-DD",
        },
        learners: {
          type: "number",
          description: "学员数量",
        },
        teacherPo: {
          type: "number",
          description: "讲师 PO 工号",
        },
        headteacherPo: {
          type: "number",
          description: "班主任 PO 工号",
        },
        status: {
          type: "string",
          description: "班级状态，默认 '已排期'",
        },
        stage: {
          type: "string",
          description: "班级阶段，默认 'upcoming'",
        },
      },
      required: ["title", "code", "classType", "location", "startDate", "endDate"],
    },
  },
  {
    name: "list_classes",
    description: "列出所有培训班级，按开班日期倒序排列。",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_class",
    description: "获取指定班级的详细信息。",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "班级 ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "update_class",
    description: "更新班级的信息。",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "班级 ID",
        },
        title: {
          type: "string",
          description: "班级名称",
        },
        code: {
          type: "string",
          description: "班级编号",
        },
        location: {
          type: "string",
          description: "培训地点",
        },
        status: {
          type: "string",
          description: "班级状态",
        },
        stage: {
          type: "string",
          description: "班级阶段",
        },
        startDate: {
          type: "string",
          description: "开班日期 YYYY-MM-DD",
        },
        endDate: {
          type: "string",
          description: "结业日期 YYYY-MM-DD",
        },
        learners: {
          type: "number",
          description: "学员数量",
        },
        teacherPo: {
          type: "number",
          description: "讲师 PO 工号",
        },
        headteacherPo: {
          type: "number",
          description: "班主任 PO 工号",
        },
        progress: {
          type: "number",
          description: "进度百分比 0-100",
        },
        nextSession: {
          type: "string",
          description: "下一场次",
        },
        archiveState: {
          type: "string",
          description: "归档状态",
        },
        notes: {
          type: "string",
          description: "备注",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_class",
    description: "删除班级及其关联的课程和 SOP 任务。",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "班级 ID",
        },
      },
      required: ["id"],
    },
  },
];

// ───────── Tool Handlers ─────────

export async function handleCreateClass(args: unknown) {
  const input = args as DeliveryClassInput;
  const id = createDeliveryClass(input);
  const record = getDeliveryClass(id);
  return {
    content: [{ type: "text", text: JSON.stringify(record, null, 2) }],
  };
}

export async function handleListClasses(_args: unknown) {
  const records = listDeliveryClasses();
  return {
    content: [{ type: "text", text: JSON.stringify(records, null, 2) }],
  };
}

export async function handleGetClass(args: unknown) {
  const { id } = args as { id: string };
  const record = getDeliveryClass(id);
  if (!record) {
    return {
      content: [{ type: "text", text: `班级 ${id} 不存在` }],
      isError: true,
    };
  }
  return {
    content: [{ type: "text", text: JSON.stringify(record, null, 2) }],
  };
}

export async function handleUpdateClass(args: unknown) {
  const { id, ...patch } = args as { id: string } & Partial<DeliveryClassInput>;
  updateDeliveryClass(id, patch);
  const record = getDeliveryClass(id);
  return {
    content: [{ type: "text", text: JSON.stringify(record, null, 2) }],
  };
}

export async function handleDeleteClass(args: unknown) {
  const { id } = args as { id: string };
  deleteDeliveryClass(id);
  return {
    content: [{ type: "text", text: `班级 ${id} 已删除` }],
  };
}
