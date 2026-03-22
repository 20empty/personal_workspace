import type { Priority, Project, ProjectStatus, Task, TaskStatus } from "@/types/devtracker";

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const PROJECT_NAMES = [
  "K8s 容器课程升级",
  "AI 应用开发课程",
  "数据分析课程改版",
  "云原生训练营",
];

const TASK_TITLES = ["课程 PPT", "实验手册", "讲师备注", "课后练习"];
const PROJECT_STATUSES: ProjectStatus[] = ["planning", "inProgress", "completed", "archived"];
const TASK_STATUSES: TaskStatus[] = ["pending", "inProgress", "draftDone", "qaReview", "readyToSubmit", "submitted"];
const PRIORITIES: Priority[] = ["low", "medium", "high"];

export function createProject(overrides: Partial<Project> = {}): Project {
  const startDate =
    overrides.startDate ||
    randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)).toISOString().split("T")[0];
  const endDate =
    overrides.endDate ||
    randomDate(new Date(startDate), new Date(2025, 11, 31)).toISOString().split("T")[0];
  const status = overrides.status || randomElement(PROJECT_STATUSES);
  const progress = overrides.progress ?? (status === "completed" || status === "archived" ? 100 : randomInt(0, 95));

  return {
    id: `proj-${randomInt(1000, 9999)}`,
    code: `COURSE-${new Date().getFullYear()}-${String(randomInt(1, 999)).padStart(3, "0")}`,
    name: randomElement(PROJECT_NAMES),
    description: "",
    source: "测试班期",
    status,
    startDate,
    endDate,
    progress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTask(projectId: string, overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${randomInt(1000, 9999)}`,
    projectId,
    title: randomElement(TASK_TITLES),
    description: "",
    deliverableType: "slides",
    status: overrides.status || randomElement(TASK_STATUSES),
    orderIndex: overrides.orderIndex ?? 0,
    priority: randomElement(PRIORITIES),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTaskList(projectId: string, count: number, status?: TaskStatus): Task[] {
  return Array.from({ length: count }, (_, index) =>
    createTask(projectId, { status: status || randomElement(TASK_STATUSES), orderIndex: index })
  );
}

export function createProjectList(count: number): Project[] {
  return Array.from({ length: count }, () => createProject());
}

export function createProjectsWithStatusDistribution(distribution: Record<ProjectStatus, number>): Project[] {
  return (Object.keys(distribution) as ProjectStatus[]).flatMap(status =>
    Array.from({ length: distribution[status] }, () => createProject({ status }))
  );
}

export function createTasksWithStatusDistribution(projectId: string, distribution: Record<TaskStatus, number>): Task[] {
  return (Object.keys(distribution) as TaskStatus[]).flatMap(status =>
    Array.from({ length: distribution[status] }, (_, index) => createTask(projectId, { status, orderIndex: index }))
  );
}

export function createCompleteTestSet() {
  const projects = createProjectList(5);
  const tasks = projects.flatMap(project => createTaskList(project.id, randomInt(3, 10)));
  return { projects, tasks };
}

export default {
  createProject,
  createTask,
  createTaskList,
  createProjectList,
  createProjectsWithStatusDistribution,
  createTasksWithStatusDistribution,
  createCompleteTestSet,
};
