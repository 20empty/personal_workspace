import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "@/pages/Dashboard";

const useProfileMock = vi.fn(() => ({
  profile: {
    name: "Jerry",
    title: "Trainer",
  },
}));

const listDeliveryClassesMock = vi.fn();
const getCoursesByClassIdMock = vi.fn();
const getSopTasksByClassIdMock = vi.fn();
const listCoursesByClassIdsMock = vi.fn();
const listDevProjectsMock = vi.fn();

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => useProfileMock(),
}));

vi.mock("@/db/delivery", async () => {
  const actual = await vi.importActual<typeof import("@/db/delivery")>("@/db/delivery");
  return {
    ...actual,
    listDeliveryClasses: (...args: unknown[]) => listDeliveryClassesMock(...args),
    getCoursesByClassId: (...args: unknown[]) => getCoursesByClassIdMock(...args),
    getSopTasksByClassId: (...args: unknown[]) => getSopTasksByClassIdMock(...args),
    listCoursesByClassIds: (...args: unknown[]) => listCoursesByClassIdsMock(...args),
  };
});

vi.mock("@/db/devtracker", async () => {
  const actual = await vi.importActual<typeof import("@/db/devtracker")>("@/db/devtracker");
  return {
    ...actual,
    listDevProjects: (...args: unknown[]) => listDevProjectsMock(...args),
    getTasksByProject: vi.fn(() => Promise.resolve([])),
    getQuarterLabel: vi.fn(() => "Q1"),
  };
});

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listDeliveryClassesMock.mockResolvedValue([
      {
        id: "class-1",
        code: "CN-SH-001",
        contractNo: "",
        title: "云原生训练营",
        location: "上海",
        status: "进行中",
        stage: "active",
        classType: "centralized",
        startDate: "2026-03-20",
        endDate: "2026-03-28",
        learners: 24,
        teacherPo: 5,
        projectSupportPo: 1,
        headteacherPo: 3,
        progress: 50,
        focus: [],
        archiveState: "待归档",
        notes: null,
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z",
      },
    ]);
    getCoursesByClassIdMock.mockResolvedValue([
      {
        id: "course-1",
        classId: "class-1",
        courseTemplateId: null,
        name: "K8s 实战",
        level: "L3",
        days: "3",
        startDate: "2026-03-24",
        endDate: "2026-03-26",
        schedulePath: null,
        schedulePreviewPath: null,
        scheduleFileName: null,
        scheduleFileType: null,
        orderIndex: 0,
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z",
      },
    ]);
    getSopTasksByClassIdMock.mockResolvedValue([]);
    listCoursesByClassIdsMock.mockResolvedValue([]);
    listDevProjectsMock.mockResolvedValue([]);
  });

  it("navigates to class detail when clicking a teaching task", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/delivery/:classId" element={<div>已进入课程详情页</div>} />
        </Routes>
      </MemoryRouter>
    );

    const taskButton = await screen.findByRole("button", { name: /云原生训练营 · K8s 实战/i });
    fireEvent.click(taskButton);

    await waitFor(() => {
      expect(screen.getByText("已进入课程详情页")).toBeInTheDocument();
    });
  });

  it("opens the related dev project board when clicking a development item", async () => {
    listDevProjectsMock.mockResolvedValue([
      {
        id: "project-1",
        code: "DEV-001",
        title: "云原生课程开发",
        description: "desc",
        source: "internal",
        poCount: 5,
        startDate: "2026-03-20",
        endDate: "2026-03-30",
        status: "inProgress",
        priority: "medium",
        progress: 60,
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dev" element={<DevStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    const devProjectButton = await screen.findByRole("button", { name: /云原生课程开发/i });
    fireEvent.click(devProjectButton);

    await waitFor(() => {
      expect(screen.getByText("/dev")).toBeInTheDocument();
      expect(screen.getByText("kanban")).toBeInTheDocument();
      expect(screen.getByText("project-1")).toBeInTheDocument();
    });
  });
});

function DevStateProbe() {
  const location = useLocation();
  const state = (location.state as { activeTab?: string; selectedProjectId?: string } | null) ?? null;

  return (
    <div>
      <div>{location.pathname}</div>
      <div>{state?.activeTab ?? "no-tab"}</div>
      <div>{state?.selectedProjectId ?? "no-project"}</div>
    </div>
  );
}
