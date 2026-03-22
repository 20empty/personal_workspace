import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TaskCardModal, {
  getFileDisplayName,
  normalizeLocalFileUrl,
} from "@/components/devtracker/TaskCardModal";

const openDialogMock = vi.fn();
const openPathMock = vi.fn();
const updateDevTaskMock = vi.fn(() => Promise.resolve());

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: unknown[]) => openDialogMock(...args),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openPath: (...args: unknown[]) => openPathMock(...args),
}));

vi.mock("@/db/devtracker", async () => {
  const actual = await vi.importActual<typeof import("@/db/devtracker")>("@/db/devtracker");
  return {
    ...actual,
    updateDevTask: (...args: unknown[]) => updateDevTaskMock(...args),
  };
});

function makeTask() {
  return {
    id: "task-1",
    projectId: "project-1",
    title: "课程 PPT",
    description: "",
    deliverableType: "slides" as const,
    status: "inProgress" as const,
    priority: "medium" as const,
    assignee: "",
    dueDate: "2026-04-01",
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

describe("TaskCardModal helpers", () => {
  it("normalizes local paths into file URLs", () => {
    expect(normalizeLocalFileUrl("/tmp/demo.pptx")).toBe("file:///tmp/demo.pptx");
    expect(normalizeLocalFileUrl("file:///tmp/demo.pptx")).toBe("file:///tmp/demo.pptx");
  });

  it("returns a short display name from a file URL", () => {
    expect(getFileDisplayName("file:///tmp/demo.pptx")).toBe("demo.pptx");
  });
});

describe("TaskCardModal", () => {
  beforeEach(() => {
    openDialogMock.mockReset();
    openPathMock.mockReset();
    updateDevTaskMock.mockClear();
  });

  it("opens on the overview tab and can switch to files", () => {
    render(<TaskCardModal task={makeTask()} onClose={() => undefined} onSaved={() => undefined} />);

    expect(screen.getByRole("button", { name: "概览" })).toHaveClass("bg-[color:var(--background)]");
    expect(screen.getByText("执行信息")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "文件" }));

    expect(screen.getByText("当前原稿")).toBeInTheDocument();
    expect(screen.getByText("终稿文件")).toBeInTheDocument();
  });

  it("fills a file field from the native file picker", async () => {
    openDialogMock.mockResolvedValue("/Users/jerry/Documents/demo.pptx");

    render(<TaskCardModal task={makeTask()} onClose={() => undefined} onSaved={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "文件" }));
    fireEvent.click(screen.getAllByRole("button", { name: "选择文件" })[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue("file:///Users/jerry/Documents/demo.pptx")).toBeInTheDocument();
    });
  });
});
