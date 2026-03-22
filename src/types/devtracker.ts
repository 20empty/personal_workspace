/**
 * DevTracker 类型定义
 */

// 课程项目状态
export type ProjectStatus = "planning" | "inProgress" | "completed" | "archived";

// 交付物状态
export type TaskStatus =
  | "pending"
  | "inProgress"
  | "draftDone"
  | "qaReview"
  | "readyToSubmit"
  | "submitted"
  | "archived";

// 优先级
export type Priority = "low" | "medium" | "high";

export type DeliverableType = "slides" | "lab" | "notes" | "other";

// 课程项目
export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  source?: string;
  poCount?: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// 交付物
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  deliverableType: DeliverableType;
  status: TaskStatus;
  orderIndex: number;
  priority?: Priority;
  assignee?: string;
  dueDate?: string;
  blocker?: string;
  docUrl?: string;
  baselineUrl?: string;
  finalDocUrl?: string;
  reviewerName?: string;
  reviewerEta?: string;
  draftCompletedAt?: string;
  qaCompletedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建课程项目输入
export interface CreateProjectInput {
  name: string;
  description?: string;
  source?: string;
  poCount?: string;
  startDate: string;
  endDate: string;
}

// 创建交付物输入
export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  deliverableType: DeliverableType;
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  dueDate?: string;
  blocker?: string;
}

// 统计信息
export interface Statistics {
  totalProjects: number;
  completedProjects: number;
  inProgressTasks: number;
  projectsByStatus: Record<ProjectStatus, number>;
}

// 看板列
export interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus;
}

// 拖拽结果
export interface DragResult {
  taskId: string;
  sourceColumn: TaskStatus;
  targetColumn: TaskStatus;
  newOrderIndex: number;
}
