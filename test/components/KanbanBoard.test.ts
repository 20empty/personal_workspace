import { describe, expect, it } from "vitest";
import type { DevTaskRecord, TaskStatus } from "@/db/devtracker";
import { getColumnTasks, getTargetStatus } from "@/components/devtracker/KanbanBoard";

function makeTask(id: string, status: TaskStatus): DevTaskRecord {
  return {
    id,
    projectId: "project-1",
    title: `Task ${id}`,
    description: "",
    deliverableType: "slides",
    status,
    priority: "medium",
    assignee: "",
    dueDate: "",
    blocker: "",
    orderIndex: 0,
    contextNote: "",
    docUrl: "",
    baselineUrl: "",
    finalDocUrl: "",
    refs: [],
    subTasks: [],
    reviewerName: "",
    reviewerEta: "",
    qaChecklist: {
      feedbackReceived: false,
      annotationsResolved: false,
      cloudVerified: false,
    },
    draftCompletedAt: "",
    qaCompletedAt: "",
    submittedAt: "",
    createdAt: "2026-03-22T00:00:00.000Z",
    updatedAt: "2026-03-22T00:00:00.000Z",
  };
}

describe("KanbanBoard helpers", () => {
  it("returns previous and next statuses correctly", () => {
    expect(getTargetStatus("pending", "left")).toBeNull();
    expect(getTargetStatus("pending", "right")).toBe("inProgress");
    expect(getTargetStatus("qaReview", "right")).toBe("readyToSubmit");
    expect(getTargetStatus("submitted", "right")).toBeNull();
  });

  it("filters tasks by column", () => {
    const tasks = [
      makeTask("1", "pending"),
      makeTask("2", "inProgress"),
      makeTask("3", "pending"),
    ];

    expect(getColumnTasks(tasks, "pending").map(task => task.id)).toEqual(["1", "3"]);
    expect(getColumnTasks(tasks, "qaReview")).toEqual([]);
  });
});
