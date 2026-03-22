/**
 * 进度计算工具函数
 */

import type { Task, TaskStatus } from "../types/devtracker";

const STATUS_PROGRESS: Record<TaskStatus, number> = {
  pending: 0,
  inProgress: 35,
  draftDone: 60,
  qaReview: 75,
  readyToSubmit: 90,
  submitted: 100,
  archived: 100,
};

/**
 * 计算项目进度
 * 基于交付物状态权重的平均值
 */
export function calculateProjectProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, task) => sum + STATUS_PROGRESS[task.status], 0);
  return Math.round(total / tasks.length);
}

/**
 * 计算各状态任务数量
 */
export function countTasksByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    pending: 0,
    inProgress: 0,
    draftDone: 0,
    qaReview: 0,
    readyToSubmit: 0,
    submitted: 0,
    archived: 0,
  };

  tasks.forEach(task => {
    counts[task.status] += 1;
  });

  return counts;
}

/**
 * 获取进行中的交付物数（未提交 / 未归档）
 */
export function getInProgressTaskCount(tasks: Task[]): number {
  return tasks.filter(task => task.status !== "submitted" && task.status !== "archived").length;
}

/**
 * 获取已完成交付物数
 */
export function getCompletedTaskCount(tasks: Task[]): number {
  return tasks.filter(task => task.status === "submitted" || task.status === "archived").length;
}

/**
 * 根据进度获取进度条颜色
 */
export function getProgressColor(progress: number): string {
  if (progress === 0) return "gray";
  if (progress < 30) return "red";
  if (progress < 70) return "blue";
  if (progress < 100) return "yellow";
  return "green";
}

/**
 * 检查项目是否可以完成
 */
export function canCompleteProject(tasks: Task[]): boolean {
  if (tasks.length === 0) return false;
  return tasks.every(task => task.status === "submitted" || task.status === "archived");
}

/**
 * 计算预计剩余工作量
 */
export function estimateRemainingWork(tasks: Task[]): number {
  return tasks.reduce((total, task) => total + (100 - STATUS_PROGRESS[task.status]) / 100, 0);
}
