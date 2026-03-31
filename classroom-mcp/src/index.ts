import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  classTools,
  handleCreateClass,
  handleListClasses,
  handleGetClass,
  handleUpdateClass,
  handleDeleteClass,
} from "./tools/class-tools.js";
import {
  sopTools,
  handleListSopTemplates,
  handleGetSopTasks,
  handleToggleSopTask,
  handleCompleteAllSopTasks,
  handleCreateSopTemplate,
  handleDeleteSopTemplate,
} from "./tools/sop-tools.js";
import {
  courseTools,
  handleGetCourses,
  handleCreateCourse,
  handleUpdateCourse,
  handleDeleteCourse,
} from "./tools/course-tools.js";

// ───────── All Tools ─────────

const allTools = [...classTools, ...sopTools, ...courseTools];

type ToolHandler = (args: unknown) => Promise<{
  content: { type: "text"; text: string }[];
  isError?: boolean;
}>;

const toolHandlers: Record<string, ToolHandler> = {
  create_class: handleCreateClass as ToolHandler,
  list_classes: handleListClasses as ToolHandler,
  get_class: handleGetClass as ToolHandler,
  update_class: handleUpdateClass as ToolHandler,
  delete_class: handleDeleteClass as ToolHandler,
  get_sop_tasks: handleGetSopTasks as ToolHandler,
  toggle_sop_task: handleToggleSopTask as ToolHandler,
  complete_all_sop_tasks: handleCompleteAllSopTasks as ToolHandler,
  list_sop_templates: handleListSopTemplates as ToolHandler,
  create_sop_template: handleCreateSopTemplate as ToolHandler,
  delete_sop_template: handleDeleteSopTemplate as ToolHandler,
  get_courses: handleGetCourses as ToolHandler,
  create_course: handleCreateCourse as ToolHandler,
  update_course: handleUpdateCourse as ToolHandler,
  delete_course: handleDeleteCourse as ToolHandler,
};

// ───────── Server ─────────

const server = new Server(
  { name: "classroom-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { name, arguments: args } = request.params as any;
  const handler = toolHandlers[name];
  if (!handler) {
    return {
      content: [{ type: "text" as const, text: `Tool ${name} not found` }],
      isError: true,
    };
  }
  try {
    return await handler(args);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ───────── Start ─────────

const transport = new StdioServerTransport();
await server.connect(transport);
