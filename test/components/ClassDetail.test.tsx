import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClassDetail from "@/pages/ClassDetail";

const updateDeliveryClassMock = vi.fn(() => Promise.resolve());
const getDeliveryClassMock = vi.fn();
const seedSopTasksForClassMock = vi.fn(() => Promise.resolve());
const getSopTasksByClassIdMock = vi.fn(() => Promise.resolve([]));
const getCoursesByClassIdMock = vi.fn(() => Promise.resolve([]));

vi.mock("@/db/delivery", async () => {
  const actual = await vi.importActual<typeof import("@/db/delivery")>("@/db/delivery");
  return {
    ...actual,
    getDeliveryClass: (...args: unknown[]) => getDeliveryClassMock(...args),
    updateDeliveryClass: (...args: unknown[]) => updateDeliveryClassMock(...args),
    seedSopTasksForClass: (...args: unknown[]) => seedSopTasksForClassMock(...args),
    getSopTasksByClassId: (...args: unknown[]) => getSopTasksByClassIdMock(...args),
    getCoursesByClassId: (...args: unknown[]) => getCoursesByClassIdMock(...args),
    createDeliveryCourse: vi.fn(() => Promise.resolve("course-1")),
    deleteDeliveryCourse: vi.fn(() => Promise.resolve()),
  };
});

const baseClass = {
  id: "class-1",
  code: "CN-SZ-2026-VERY-LONG-CLASS-CODE-001-ALPHA-BETA-GAMMA",
  contractNo: "HT-2026-001",
  title: "云原生训练营",
  location: "中国-深圳",
  status: "已排期",
  stage: "upcoming",
  classType: "centralized" as const,
  startDate: "2026-03-20",
  endDate: "2026-03-24",
  learners: 30,
  teacherPo: 5,
  projectSupportPo: 1,
  headteacherPo: 4,
  progress: 0,
  focus: ["待完善"],
  archiveState: "待归档",
  notes: null,
  createdAt: "2026-03-20T00:00:00.000Z",
  updatedAt: "2026-03-20T00:00:00.000Z",
};

describe("ClassDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDeliveryClassMock.mockResolvedValue(baseClass);
  });

  it("saves projectSupportPo edits and keeps long class code in a safe layout", async () => {
    render(
      <MemoryRouter initialEntries={["/delivery/class-1"]}>
        <Routes>
          <Route path="/delivery/:classId" element={<ClassDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findAllByText("云原生训练营");
    expect(screen.getAllByText(baseClass.code)[0]).toHaveClass("break-all");

    fireEvent.click(screen.getByRole("button", { name: "编辑信息" }));
    fireEvent.change(screen.getByLabelText("项目支持PO"), { target: { value: "2" } });
    fireEvent.click(screen.getAllByRole("button", { name: "保存" })[0]);

    await waitFor(() => {
      expect(updateDeliveryClassMock).toHaveBeenCalledWith(
        "class-1",
        expect.objectContaining({
          projectSupportPo: 2,
        })
      );
    });

    await screen.findByText("项目支持PO");
    expect(screen.getByText("7.4")).toBeInTheDocument();
  });
});
