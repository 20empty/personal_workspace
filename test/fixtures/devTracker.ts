import type { Project, ProjectStatus, Task, TaskStatus } from "@/types/devtracker";

const baseTask = (partial: Partial<Task>): Task => ({
  id: crypto.randomUUID(),
  projectId: "proj-001",
  title: "示例交付物",
  deliverableType: "slides",
  status: "pending",
  orderIndex: 0,
  priority: "medium",
  createdAt: "2024-02-15T08:00:00Z",
  updatedAt: "2024-02-15T08:00:00Z",
  ...partial,
});

export const mockProjects: Project[] = [
  {
    id: "proj-001",
    code: "COURSE-2024-001",
    name: "K8s 容器课程升级",
    description: "企业内训课件升级",
    source: "2024 春季班",
    status: "planning" as ProjectStatus,
    startDate: "2024-03-01",
    endDate: "2024-06-30",
    progress: 0,
    createdAt: "2024-02-15T08:00:00Z",
    updatedAt: "2024-02-15T08:00:00Z",
  },
  {
    id: "proj-002",
    code: "COURSE-2024-002",
    name: "AI 应用开发课程",
    description: "交付 PPT 与实验手册",
    source: "客户 A 内训",
    status: "inProgress" as ProjectStatus,
    startDate: "2024-01-15",
    endDate: "2024-05-30",
    progress: 68,
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
  },
];

export const mockTasks: Task[] = [
  baseTask({
    id: "task-001",
    projectId: "proj-002",
    title: "课程 PPT",
    deliverableType: "slides",
    status: "submitted",
    priority: "high",
  }),
  baseTask({
    id: "task-002",
    projectId: "proj-002",
    title: "实验手册",
    deliverableType: "lab",
    status: "qaReview",
    priority: "high",
  }),
  baseTask({
    id: "task-003",
    projectId: "proj-002",
    title: "讲师备注",
    deliverableType: "notes",
    status: "draftDone",
  }),
];

export const invalidInputs = {
  emptyString: "",
  emptyObject: {},
  emptyArray: [],
  nullValue: null,
  undefinedValue: undefined,
  longName: "a".repeat(300),
  longCode: "COURSE-" + "X".repeat(100),
  specialChars: "<script>alert('xss')</script>",
  invalidDate: "2024-13-45",
  endBeforeStart: { start: "2024-06-01", end: "2024-01-01" },
  invalidStatus: "unknown_status",
};

export const statusTransitions = {
  valid: [
    { from: "planning", to: "inProgress", expected: true },
    { from: "inProgress", to: "completed", expected: true },
    { from: "completed", to: "archived", expected: true },
  ],
};

export const kanbanColumns = [
  { id: "pending", title: "待启动", status: "pending" as TaskStatus },
  { id: "inProgress", title: "制作中", status: "inProgress" as TaskStatus },
  { id: "draftDone", title: "初稿完成", status: "draftDone" as TaskStatus },
  { id: "qaReview", title: "QA评审中", status: "qaReview" as TaskStatus },
  { id: "readyToSubmit", title: "待提交", status: "readyToSubmit" as TaskStatus },
  { id: "submitted", title: "已提交", status: "submitted" as TaskStatus },
];

export const statisticsTestData = {
  currentYear: 2024,
  projectsByStatus: {
    planning: 1,
    inProgress: 3,
    completed: 2,
    archived: 1,
  },
  tasksByStatus: {
    pending: 5,
    inProgress: 3,
    draftDone: 4,
    qaReview: 2,
    readyToSubmit: 2,
    submitted: 6,
    archived: 1,
  },
};

export function generateManyTasks(projectId: string, count: number): Task[] {
  const statuses: TaskStatus[] = ["pending", "inProgress", "draftDone", "qaReview", "readyToSubmit", "submitted"];
  return Array.from({ length: count }, (_, index) =>
    baseTask({
      id: `task-bulk-${index}`,
      projectId,
      title: `批量交付物 ${index + 1}`,
      status: statuses[index % statuses.length],
      orderIndex: index,
    })
  );
}

export default {
  mockProjects,
  mockTasks,
  invalidInputs,
  statusTransitions,
  kanbanColumns,
  statisticsTestData,
  generateManyTasks,
};
