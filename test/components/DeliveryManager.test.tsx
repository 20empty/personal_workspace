import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeliveryManager from "@/pages/DeliveryManager";

const listDeliveryClassesMock = vi.fn();
const createDeliveryClassMock = vi.fn(() => Promise.resolve("class-new"));
const completeAllSopTasksByClassIdMock = vi.fn(() => Promise.resolve());

vi.mock("@/db/delivery", async () => {
  const actual = await vi.importActual<typeof import("@/db/delivery")>("@/db/delivery");
  return {
    ...actual,
    listDeliveryClasses: (...args: unknown[]) => listDeliveryClassesMock(...args),
    createDeliveryClass: (...args: unknown[]) => createDeliveryClassMock(...args),
    completeAllSopTasksByClassId: (...args: unknown[]) => completeAllSopTasksByClassIdMock(...args),
    deleteDeliveryClass: vi.fn(() => Promise.resolve()),
    updateDeliveryClass: vi.fn(() => Promise.resolve()),
    getCoursesByClassId: vi.fn(() => Promise.resolve([])),
  };
});

vi.mock("@/components/delivery/CreateClassModal", () => ({
  __esModule: true,
  default: ({
    onSubmit,
  }: {
    onSubmit: (payload: Record<string, unknown>, options?: { completeSop?: boolean }) => Promise<void>;
  }) => (
    <button
      type="button"
      onClick={() =>
        void onSubmit(
          {
            code: "ARCH-001",
            contractNo: "",
            title: "归档班级",
            location: "培训中心",
            classType: "centralized",
            startDate: "2020-01-01",
            endDate: "2020-01-03",
            learners: 0,
            teacherPo: 0,
            projectSupportPo: 0,
            headteacherPo: 0,
            status: "已交付",
            stage: "completed",
            progress: 100,
            focus: ["待完善"],
            archiveState: "已归档",
            notes: null,
          },
          { completeSop: true }
        )
      }
    >
      提交直归档
    </button>
  ),
}));

describe("DeliveryManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listDeliveryClassesMock.mockResolvedValue([
      {
        id: "class-1",
        code: "LONG-CODE-2026-ALPHA-BETA-GAMMA-DELTA-001",
        contractNo: "",
        title: "当前班级",
        location: "中国-深圳",
        status: "进行中",
        stage: "active",
        classType: "centralized",
        startDate: "2026-03-20",
        endDate: "2026-03-24",
        learners: 20,
        teacherPo: 5,
        projectSupportPo: 0,
        headteacherPo: 2,
        progress: 40,
        focus: [],
        archiveState: "待归档",
        notes: null,
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z",
      },
    ]);
  });

  it("completes SOP tasks when a direct-archive create flow requests it", async () => {
    render(
      <MemoryRouter>
        <DeliveryManager />
      </MemoryRouter>
    );

    await screen.findByText("当前班级");
    expect(screen.getByText("LONG-CODE-2026-ALPHA-BETA-GAMMA-DELTA-001")).toHaveClass("break-all");

    fireEvent.click(screen.getByRole("button", { name: "新建班级" }));
    fireEvent.click(await screen.findByRole("button", { name: "提交直归档" }));

    await waitFor(() => {
      expect(createDeliveryClassMock).toHaveBeenCalled();
      expect(completeAllSopTasksByClassIdMock).toHaveBeenCalledWith("class-new");
    });
  });
});
