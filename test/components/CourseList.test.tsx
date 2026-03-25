import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CourseList from "@/components/delivery/CourseList";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(),
}));

vi.mock("@/db/delivery", async () => {
  const actual = await vi.importActual<typeof import("@/db/delivery")>("@/db/delivery");
  return {
    ...actual,
    listCourseTemplates: vi.fn(() => Promise.resolve([])),
  };
});

vi.mock("@/utils/courseSchedule", () => ({
  exportCourseSchedule: vi.fn(() => Promise.resolve()),
  inferScheduleFileName: vi.fn(() => "demo.xlsx"),
  inferScheduleFileType: vi.fn(() => "xlsx"),
  loadPdfBlobUrl: vi.fn(() => Promise.resolve("blob:test")),
  loadWorkbookPreview: vi.fn(() => Promise.resolve({ sheetNames: [], sheets: {} })),
}));

describe("CourseList", () => {
  it("shows a guided empty state that leads into adding the first course", () => {
    render(
      <CourseList
        courses={[]}
        onAdd={vi.fn(() => Promise.resolve())}
        onDelete={vi.fn(() => Promise.resolve())}
      />
    );

    expect(screen.getByText("还没有安排交付课程")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新增第一门课程" })).toBeInTheDocument();
  });

  it("shows a confirmation dialog before deleting a course", async () => {
    const onDelete = vi.fn(() => Promise.resolve());

    render(
      <CourseList
        courses={[
          {
            id: "course-1",
            classId: "class-1",
            courseTemplateId: null,
            name: "云原生架构",
            level: "L2",
            days: "3",
            startDate: "2026-03-20",
            endDate: "2026-03-22",
            schedulePath: null,
            schedulePreviewPath: null,
            scheduleFileName: null,
            scheduleFileType: null,
            orderIndex: 0,
            createdAt: "2026-03-20T00:00:00.000Z",
            updatedAt: "2026-03-20T00:00:00.000Z",
          },
        ]}
        onAdd={vi.fn(() => Promise.resolve())}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByTitle("删除课程"));
    expect(screen.getByText("确认删除交付课程？")).toBeInTheDocument();
    expect(screen.getByText("删除后将移除课程：")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "确认删除" }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith("course-1");
    });
  });
});
