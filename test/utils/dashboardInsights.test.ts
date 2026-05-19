import { describe, expect, it } from "vitest";
import { buildDashboardInsights } from "@/utils/dashboardInsights";
import type { DeliveryClassRecord, CourseRecord, SopTaskRecord } from "@/db/delivery";
import type { DevProjectRecord, DevTaskRecord } from "@/db/devtracker";

const baseClass = (patch: Partial<DeliveryClassRecord>): DeliveryClassRecord => ({
  id: "class-1",
  code: "CN-001",
  contractNo: "",
  title: "云原生训练营",
  location: "上海",
  status: "已排期",
  stage: "upcoming",
  classType: "centralized",
  startDate: "2026-05-22",
  endDate: "2026-05-26",
  learners: 20,
  teacherPo: 5,
  projectSupportPo: 0,
  headteacherPo: 1,
  progress: 0,
  focus: [],
  archiveState: "待归档",
  notes: null,
  createdAt: "2026-05-01",
  updatedAt: "2026-05-01",
  ...patch,
});

const baseCourse = (patch: Partial<CourseRecord>): CourseRecord => ({
  id: "course-1",
  classId: "class-1",
  courseTemplateId: null,
  name: "K8s 实战",
  level: "L3",
  days: "3",
  startDate: "2026-05-19",
  endDate: "2026-05-21",
  schedulePath: null,
  schedulePreviewPath: null,
  scheduleFileName: null,
  scheduleFileType: null,
  orderIndex: 0,
  createdAt: "2026-05-01",
  updatedAt: "2026-05-01",
  ...patch,
});

const baseTask = (patch: Partial<DevTaskRecord>): DevTaskRecord => ({
  id: "task-1",
  projectId: "project-1",
  title: "实验手册评审",
  description: "",
  deliverableType: "lab",
  status: "qaReview",
  assignee: "",
  priority: "medium",
  dueDate: "2026-05-20",
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
    contentChecked: false,
    assetsReady: false,
    finalExported: false,
  },
  draftCompletedAt: "",
  qaCompletedAt: "",
  submittedAt: "",
  createdAt: "2026-05-01",
  updatedAt: "2026-05-01",
  ...patch,
});

const project: DevProjectRecord = {
  id: "project-1",
  code: "DEV-001",
  title: "云原生课程开发",
  status: "inProgress",
  priority: "medium",
  startDate: "2026-05-01",
  endDate: "2026-06-01",
  progress: 60,
  owner: "",
  source: "",
  poCount: 5,
  description: "",
  createdAt: "2026-05-01",
  updatedAt: "2026-05-01",
};

describe("buildDashboardInsights", () => {
  it("flags upcoming classes with pending SOP inside 7 days", () => {
    const cls = baseClass({});
    const pendingSop: SopTaskRecord = {
      id: "sop-1",
      classId: cls.id,
      stage: "pre",
      title: "建群及通知",
      status: "pending",
      orderIndex: 0,
      createdAt: "2026-05-01",
    };

    const result = buildDashboardInsights({
      classes: [cls],
      coursesByClassId: {},
      sopTasksByClassId: { [cls.id]: [pendingSop] },
      devProjects: [],
      devTasks: [],
      today: new Date("2026-05-19T08:00:00"),
    });

    expect(result.actions.some((item) => item.title === "云原生训练营")).toBe(true);
    expect(result.risks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "7 天内开课但 SOP 未完成",
          badge: "3 天后",
        }),
      ])
    );
  });

  it("flags active classes without courses and dev overdue or QA tasks", () => {
    const activeClass = baseClass({ id: "class-active", stage: "active", startDate: "2026-05-01" });

    const result = buildDashboardInsights({
      classes: [activeClass],
      coursesByClassId: { "class-active": [] },
      sopTasksByClassId: {},
      devProjects: [project],
      devTasks: [
        baseTask({ id: "task-overdue", title: "PPT 初稿", status: "inProgress", dueDate: "2026-05-18" }),
        baseTask({ id: "task-qa", title: "实验手册评审", status: "qaReview", dueDate: "2026-05-20" }),
      ],
      today: new Date("2026-05-19T08:00:00"),
    });

    expect(result.risks.map((item) => item.reason)).toEqual(
      expect.arrayContaining(["进行中班级无课程", "Dev 任务逾期", "Dev 任务进入 QA"])
    );
    expect(result.actions.map((item) => item.badge)).toEqual(expect.arrayContaining(["待排课", "QA 中"]));
  });

  it("uses current courses as daily actions", () => {
    const activeClass = baseClass({ id: "class-1", stage: "active", startDate: "2026-05-01" });
    const course = baseCourse({});

    const result = buildDashboardInsights({
      classes: [activeClass],
      coursesByClassId: { "class-1": [course] },
      sopTasksByClassId: {},
      devProjects: [],
      devTasks: [],
      today: new Date("2026-05-19T08:00:00"),
    });

    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "云原生训练营 · K8s 实战",
          badge: "交付中",
        }),
      ])
    );
  });
});
