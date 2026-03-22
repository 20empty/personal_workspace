import { describe, expect, it } from "vitest";
import {
  calculateProjectProgress,
  canCompleteProject,
  countTasksByStatus,
  getCompletedTaskCount,
  getInProgressTaskCount,
  getProgressColor,
} from "@/utils/progress";
import type { Task } from "@/types/devtracker";

function makeTask(id: string, status: Task["status"]): Task {
  return {
    id,
    projectId: "p1",
    title: `Task ${id}`,
    deliverableType: "slides",
    status,
    orderIndex: 0,
    createdAt: "",
    updatedAt: "",
  };
}

describe("calculateProjectProgress", () => {
  it("averages deliverable progress by status", () => {
    const tasks: Task[] = [
      makeTask("1", "submitted"),
      makeTask("2", "submitted"),
      makeTask("3", "submitted"),
      makeTask("4", "inProgress"),
      makeTask("5", "pending"),
    ];

    expect(calculateProjectProgress(tasks)).toBe(67);
  });

  it("returns 0 for an empty list", () => {
    expect(calculateProjectProgress([])).toBe(0);
  });
});

describe("countTasksByStatus", () => {
  it("counts each new workflow stage", () => {
    const tasks: Task[] = [
      makeTask("1", "pending"),
      makeTask("2", "pending"),
      makeTask("3", "draftDone"),
      makeTask("4", "qaReview"),
      makeTask("5", "submitted"),
    ];

    expect(countTasksByStatus(tasks)).toEqual({
      pending: 2,
      inProgress: 0,
      draftDone: 1,
      qaReview: 1,
      readyToSubmit: 0,
      submitted: 1,
      archived: 0,
    });
  });
});

describe("task counters", () => {
  it("counts active deliverables as in progress", () => {
    const tasks: Task[] = [
      makeTask("1", "submitted"),
      makeTask("2", "inProgress"),
      makeTask("3", "readyToSubmit"),
      makeTask("4", "pending"),
    ];

    expect(getInProgressTaskCount(tasks)).toBe(3);
  });

  it("counts submitted and archived deliverables as completed", () => {
    const tasks: Task[] = [
      makeTask("1", "submitted"),
      makeTask("2", "archived"),
      makeTask("3", "inProgress"),
    ];

    expect(getCompletedTaskCount(tasks)).toBe(2);
  });
});

describe("canCompleteProject", () => {
  it("returns true when every deliverable is submitted or archived", () => {
    expect(canCompleteProject([makeTask("1", "submitted"), makeTask("2", "archived")])).toBe(true);
  });

  it("returns false when active work remains", () => {
    expect(canCompleteProject([makeTask("1", "submitted"), makeTask("2", "qaReview")])).toBe(false);
  });
});

describe("getProgressColor", () => {
  it("maps progress to color bands", () => {
    expect(getProgressColor(0)).toBe("gray");
    expect(getProgressColor(29)).toBe("red");
    expect(getProgressColor(50)).toBe("blue");
    expect(getProgressColor(90)).toBe("yellow");
    expect(getProgressColor(100)).toBe("green");
  });
});
