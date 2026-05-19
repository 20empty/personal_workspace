import type { CourseRecord, DeliveryClassRecord, SopTaskRecord } from "../db/delivery";
import type { DevProjectRecord, DevTaskRecord } from "../db/devtracker";

export type DashboardActionItem = {
  id: string;
  title: string;
  meta: string;
  badge: string;
  tone: "sky" | "emerald" | "amber" | "rose";
  target: { type: "delivery"; classId: string } | { type: "dev"; projectId: string };
};

export type DashboardRiskItem = DashboardActionItem & {
  reason: string;
};

type BuildDashboardInsightsInput = {
  classes: DeliveryClassRecord[];
  coursesByClassId: Record<string, CourseRecord[]>;
  sopTasksByClassId: Record<string, SopTaskRecord[]>;
  devProjects: DevProjectRecord[];
  devTasks: DevTaskRecord[];
  today?: Date;
};

function atStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string) {
  return value.replace(/-/g, ".");
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysUntil(date: string, today: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((parseDate(date).getTime() - atStartOfDay(today).getTime()) / msPerDay);
}

function pickCurrentOrNextCourse(courses: CourseRecord[], today: Date) {
  const currentTime = atStartOfDay(today).getTime();
  const day = (dateString: string) => parseDate(dateString).getTime();
  const current = courses.find((course) => day(course.startDate) <= currentTime && currentTime <= day(course.endDate));
  if (current) return current;
  return courses
    .filter((course) => day(course.startDate) > currentTime)
    .sort((a, b) => day(a.startDate) - day(b.startDate))[0] ?? null;
}

function projectTitle(projects: DevProjectRecord[], projectId: string) {
  return projects.find((project) => project.id === projectId)?.title ?? "未分组开发项目";
}

export function buildDashboardInsights(input: BuildDashboardInsightsInput) {
  const today = input.today ?? new Date();
  const todayIso = dateKey(today);

  const actions: DashboardActionItem[] = [];
  const risks: DashboardRiskItem[] = [];

  const upcomingClasses = input.classes
    .filter((cls) => cls.stage === "upcoming")
    .map((cls) => ({ cls, days: daysUntil(cls.startDate, today) }))
    .filter((item) => item.days >= 0 && item.days <= 7)
    .sort((a, b) => a.days - b.days);

  for (const { cls, days } of upcomingClasses) {
    const tasks = input.sopTasksByClassId[cls.id] ?? [];
    const pendingCount = tasks.filter((task) => task.status !== "completed").length;
    const badge = days === 0 ? "今天开课" : `${days} 天后`;
    actions.push({
      id: `upcoming-${cls.id}`,
      title: cls.title,
      meta: `${cls.location} · ${formatDate(cls.startDate)} 开课`,
      badge,
      tone: pendingCount > 0 ? "amber" : "sky",
      target: { type: "delivery", classId: cls.id },
    });
    if (pendingCount > 0) {
      risks.push({
        id: `sop-${cls.id}`,
        title: cls.title,
        meta: `${pendingCount} 项 SOP 待完成`,
        badge,
        tone: "amber",
        reason: "7 天内开课但 SOP 未完成",
        target: { type: "delivery", classId: cls.id },
      });
    }
  }

  for (const cls of input.classes.filter((item) => item.stage === "active")) {
    const courses = input.coursesByClassId[cls.id] ?? [];
    const currentCourse = pickCurrentOrNextCourse(courses, today);
    actions.push({
      id: `active-${cls.id}`,
      title: currentCourse ? `${cls.title} · ${currentCourse.name}` : cls.title,
      meta: currentCourse
        ? `${cls.location} · ${formatDate(currentCourse.startDate)} - ${formatDate(currentCourse.endDate)}`
        : `${cls.location} · 待排课`,
      badge: currentCourse ? "交付中" : "待排课",
      tone: currentCourse ? "emerald" : "rose",
      target: { type: "delivery", classId: cls.id },
    });
    if (courses.length === 0) {
      risks.push({
        id: `no-course-${cls.id}`,
        title: cls.title,
        meta: `${cls.location} · 进行中班级未配置课程`,
        badge: "待排课",
        tone: "rose",
        reason: "进行中班级无课程",
        target: { type: "delivery", classId: cls.id },
      });
    }
  }

  for (const cls of input.classes.filter((item) => item.stage === "completed" && item.archiveState !== "已归档")) {
    risks.push({
      id: `archive-${cls.id}`,
      title: cls.title,
      meta: `${formatDate(cls.endDate)} 结束 · ${cls.archiveState}`,
      badge: "待归档",
      tone: "amber",
      reason: "已完成但待归档",
      target: { type: "delivery", classId: cls.id },
    });
  }

  const openDevTasks = input.devTasks.filter((task) => task.status !== "submitted" && task.status !== "archived");
  for (const task of openDevTasks.filter((task) => task.dueDate && task.dueDate < todayIso)) {
    risks.push({
      id: `dev-overdue-${task.id}`,
      title: task.title,
      meta: `${projectTitle(input.devProjects, task.projectId)} · ${task.dueDate} 截止`,
      badge: "逾期",
      tone: "rose",
      reason: "Dev 任务逾期",
      target: { type: "dev", projectId: task.projectId },
    });
  }

  for (const task of openDevTasks.filter((task) => task.status === "qaReview" || task.status === "readyToSubmit")) {
    const ready = task.status === "readyToSubmit";
    const item = {
      id: `dev-${task.id}`,
      title: task.title,
      meta: `${projectTitle(input.devProjects, task.projectId)}${task.dueDate ? ` · ${task.dueDate} 截止` : ""}`,
      badge: ready ? "待提交" : "QA 中",
      tone: ready ? "emerald" as const : "sky" as const,
      target: { type: "dev" as const, projectId: task.projectId },
    };
    actions.push(item);
    risks.push({
      ...item,
      reason: ready ? "Dev 任务待提交" : "Dev 任务进入 QA",
    });
  }

  return {
    actions: actions.slice(0, 8),
    risks: risks.slice(0, 8),
  };
}
