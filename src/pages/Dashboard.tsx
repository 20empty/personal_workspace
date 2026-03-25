import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  TerminalSquare,
  Sparkles,
  BarChart3,
  Globe,
  Users,
  Layers,
} from "lucide-react";
import {
  getCoursesByClassId,
  listDeliveryClasses,
  listCoursesByClassIds,
  type CourseRecord,
  type DeliveryClassRecord,
  type ClassType,
} from "../db/delivery";
import {
  getQuarterLabel,
  getTasksByProject,
  listDevProjects,
  type DevProjectRecord,
  type DevTaskRecord,
} from "../db/devtracker";
import DashboardFilterBar, { type FilterState } from "../components/dashboard/DashboardFilterBar";
import CollapsibleSection from "../components/dashboard/CollapsibleSection";
import PoBreakdownCard, { type LevelBreakdown } from "../components/dashboard/PoBreakdownCard";
import ClassTypeDistribution, { type ClassTypeItem } from "../components/dashboard/ClassTypeDistribution";
import GeoBreakdown, { type GeoItem } from "../components/dashboard/GeoBreakdown";
import LearnerCountCard, { type LearnerStats } from "../components/dashboard/LearnerCountCard";
import StageDistribution, { type StageItem } from "../components/dashboard/StageDistribution";

/* ───────── Helpers ───────── */

function quarterOf(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string): string {
  return value.replace(/-/g, ".");
}

function pickCurrentCourse(courses: CourseRecord[]): CourseRecord | null {
  if (courses.length === 0) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = (dateString: string) => parseDate(dateString).getTime();

  const inProgress = courses.find((course) => {
    const start = day(course.startDate);
    const end = day(course.endDate);
    return start <= today && today <= end;
  });
  if (inProgress) return inProgress;

  const upcoming = courses
    .filter((course) => day(course.startDate) > today)
    .sort((a, b) => day(a.startDate) - day(b.startDate));
  if (upcoming.length > 0) return upcoming[0];

  return courses.slice().sort((a, b) => day(b.endDate) - day(a.endDate))[0];
}

/* ───────── Types ───────── */

type TeachingTask = {
  id: string;
  classId: string;
  title: string;
  location: string;
  schedule: string;
};

type DevSnapshot = {
  projects: DevProjectRecord[];
  tasks: DevTaskRecord[];
};

type PoBreakdown = {
  teacherPo: number;
  headteacherPo: number;
  projectSupportPo: number;
  devPo: number;
  totalPo: number;
  teachingPercent: number;
  devPercent: number;
};

const TYPE_COLORS: Record<string, string> = {
  overseas: "#38bdf8",
  domestic: "#34d399",
  centralized: "#fbbf24",
  online: "#a78bfa",
};

const STAGE_COLORS: Record<string, string> = {
  upcoming: "#6b7280",
  active: "#38bdf8",
  completed: "#34d399",
  archived: "#a78bfa",
};

/* ───────── Component ───────── */

export default function Dashboard() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<DeliveryClassRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [teachingTasks, setTeachingTasks] = useState<TeachingTask[]>([]);
  const [devSnapshot, setDevSnapshot] = useState<DevSnapshot>({ projects: [], tasks: [] });

  const now = new Date();
  const currentYear = now.getFullYear();

  /* ── Filter state ── */
  const [filter, setFilter] = useState<FilterState>({
    year: currentYear,
    quarter: "all",
    classType: "all",
    stage: "all",
    level: "all",
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rows = await listDeliveryClasses();
        if (cancelled) return;
        setClasses(rows);

        const devProjects = await listDevProjects();
        if (!cancelled) {
          const devTaskGroups = await Promise.all(
            devProjects.map((project) => getTasksByProject(project.id, true))
          );
          if (!cancelled) {
            setDevSnapshot({ projects: devProjects, tasks: devTaskGroups.flat() });
          }
        }

        const activeClasses = rows.filter((item) => item.stage === "active");
        const taskEntries = await Promise.all(
          activeClasses.map(async (item) => {
            const courses = await getCoursesByClassId(item.id);
            const currentCourse = pickCurrentCourse(courses);
            if (!currentCourse) {
              return {
                id: item.id,
                classId: item.id,
                title: `${item.title}（待排课）`,
                location: item.location,
                schedule: "待排课",
              } satisfies TeachingTask;
            }
            return {
              id: `${item.id}-${currentCourse.id}`,
              classId: item.id,
              title: `${item.title} · ${currentCourse.name}`,
              location: item.location,
              schedule: `${formatDate(currentCourse.startDate)} - ${formatDate(currentCourse.endDate)}`,
            } satisfies TeachingTask;
          })
        );

        if (!cancelled) {
          setTeachingTasks(taskEntries);
        }

        // 加载所有课程用于 PO 按等级统计
        const allCourses = await listCoursesByClassIds(rows.map((r) => r.id));
        if (!cancelled) {
          setCourses(allCourses);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (!cancelled) {
          setClasses([]);
          setCourses([]);
          setTeachingTasks([]);
          setDevSnapshot({ projects: [], tasks: [] });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Filtered data ── */
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const endYear = parseDate(cls.endDate).getFullYear();
      if (endYear !== filter.year) return false;
      if (filter.quarter !== "all") {
        const q = quarterOf(parseDate(cls.endDate));
        if (q !== filter.quarter) return false;
      }
      if (filter.classType !== "all" && cls.classType !== filter.classType) return false;
      if (filter.stage !== "all" && cls.stage !== filter.stage) return false;
      return true;
    });
  }, [classes, filter]);

  const filteredDevProjects = useMemo(() => {
    return devSnapshot.projects.filter((project) => {
      const endYear = parseDate(project.endDate).getFullYear();
      if (endYear !== filter.year) return false;
      if (filter.quarter !== "all") {
        const q = quarterOf(parseDate(project.endDate));
        if (q !== filter.quarter) return false;
      }
      return true;
    });
  }, [devSnapshot.projects, filter.year, filter.quarter]);

  /* ── PO Breakdown ── */
  const poBreakdown = useMemo<PoBreakdown>(() => {
    const teacherPo = filteredClasses.reduce((sum, c) => sum + (c.teacherPo ?? 0), 0);
    const headteacherPo = filteredClasses.reduce((sum, c) => sum + (c.headteacherPo ?? 0) * 0.1, 0);
    const projectSupportPo = filteredClasses.reduce((sum, c) => sum + (c.projectSupportPo ?? 0), 0);
    const devPo = filteredDevProjects.reduce((sum, p) => sum + (p.poCount ?? 0), 0);

    const teachingPo = teacherPo + headteacherPo + projectSupportPo;
    const totalPo = teachingPo + devPo;

    return {
      teacherPo,
      headteacherPo,
      projectSupportPo,
      devPo,
      totalPo,
      teachingPercent: totalPo > 0 ? Math.round((teachingPo / totalPo) * 100) : 0,
      devPercent: totalPo > 0 ? Math.round((devPo / totalPo) * 100) : 0,
    };
  }, [filteredClasses, filteredDevProjects]);

  /* ── Level Breakdown (PO by level from courses) ── */
  const levelBreakdown = useMemo<LevelBreakdown>(() => {
    const filteredClassIds = new Set(filteredClasses.map((c) => c.id));
    const coursesForFiltered = courses.filter((course) => filteredClassIds.has(course.classId));

    let L2 = 0, L3 = 0, L4 = 0;
    for (const course of coursesForFiltered) {
      const days = Number(course.days) || 0;
      if (filter.level === "all" || course.level === filter.level) {
        if (course.level === "L2") L2 += days;
        else if (course.level === "L3") L3 += days;
        else if (course.level === "L4") L4 += days;
      }
    }
    return { L2, L3, L4 };
  }, [filteredClasses, courses, filter.level]);

  /* ── Class Type Distribution ── */
  const classTypeDistribution = useMemo<ClassTypeItem[]>(() => {
    const types: ClassType[] = ["overseas", "domestic", "centralized", "online"];
    return types.map((type) => {
      const filtered = filteredClasses.filter((c) => c.classType === type);
      const po = filtered.reduce((sum, c) => sum + (c.teacherPo ?? 0) + (c.headteacherPo ?? 0) * 0.1, 0);
      const learners = filtered.reduce((sum, c) => sum + (c.learners ?? 0), 0);
      return {
        type,
        label: type,
        count: filtered.length,
        po,
        learners,
        color: TYPE_COLORS[type] ?? "#6b7280",
      };
    });
  }, [filteredClasses]);

  /* ── Stage Distribution ── */
  const stageDistribution = useMemo<StageItem[]>(() => {
    const stages = ["upcoming", "active", "completed", "archived"] as const;
    return stages.map((stage) => ({
      stage,
      label: stage,
      count: filteredClasses.filter((c) => c.stage === stage).length,
      color: STAGE_COLORS[stage] ?? "#6b7280",
    }));
  }, [filteredClasses]);

  /* ── Geo Breakdown ── */
  const geoBreakdown = useMemo<GeoItem[]>(() => {
    const locationMap = new Map<string, GeoItem>();
    filteredClasses
      .filter((c) => c.classType === "overseas" || c.classType === "domestic")
      .forEach((c) => {
        const loc = (c.location ?? "").trim();
        if (!loc) return;
        const existing = locationMap.get(loc) ?? { location: loc, count: 0, learners: 0, po: 0 };
        locationMap.set(loc, {
          location: loc,
          count: existing.count + 1,
          learners: existing.learners + (c.learners ?? 0),
          po: existing.po + (c.teacherPo ?? 0) + (c.headteacherPo ?? 0) * 0.1,
        });
      });
    return Array.from(locationMap.values()).sort((a, b) => b.po - a.po);
  }, [filteredClasses]);

  /* ── Learner Stats ── */
  const learnerStats = useMemo<LearnerStats>(() => {
    const total = filteredClasses.reduce((sum, c) => sum + (c.learners ?? 0), 0);
    const types: ClassType[] = ["overseas", "domestic", "centralized", "online"];
    const byType = types
      .map((type) => ({
        type,
        count: filteredClasses.filter((c) => c.classType === type).reduce((sum, c) => sum + (c.learners ?? 0), 0),
        color: TYPE_COLORS[type] ?? "#6b7280",
      }))
      .filter((t) => t.count > 0);
    return { total, byType };
  }, [filteredClasses]);

  /* ── Travel summary ── */
  const travelSummary = useMemo(() => {
    const firstActiveLocation = classes
      .find((item) => item.stage === "active" && item.location.trim())
      ?.location.trim();
    if (!firstActiveLocation) {
      return "今日行程：待安排";
    }
    return `今日行程：${firstActiveLocation}`;
  }, [classes]);

  /* ── Dev insights ── */
  const devInsights = useMemo(() => {
    const activeProjects = devSnapshot.projects
      .filter((project) => project.status === "planning" || project.status === "inProgress")
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);

    const activeProjectMap = new Map(devSnapshot.projects.map((project) => [project.id, project]));
    const today = new Date().toISOString().slice(0, 10);
    const nearDue = devSnapshot.tasks
      .filter(
        (task) =>
          task.status !== "submitted" &&
          task.status !== "archived" &&
          task.dueDate
      )
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
      .slice(0, 6);

    const qaItems = devSnapshot.tasks.filter((task) => task.status === "qaReview").slice(0, 3);
    const readyToSubmit = devSnapshot.tasks.filter((task) => task.status === "readyToSubmit").slice(0, 3);
    const overdueCount = devSnapshot.tasks.filter(
      (task) =>
        task.status !== "submitted" &&
        task.status !== "archived" &&
        task.dueDate &&
        task.dueDate < today
    ).length;

    return {
      activeProjects,
      activeProjectMap,
      nearDue,
      qaItems,
      readyToSubmit,
      overdueCount,
    };
  }, [devSnapshot]);

  /* ── Filter bar year stats ── */
  const filterYearStats = useMemo(() => {
    const yearClasses = classes.filter((c) => parseDate(c.endDate).getFullYear() === filter.year);
    const yearDevProjects = devSnapshot.projects.filter((p) => parseDate(p.endDate).getFullYear() === filter.year);
    const yearOverseas = new Set(
      yearClasses
        .filter((c) => c.classType === "overseas" && (c.stage === "active" || c.stage === "completed"))
        .map((c) => c.location.trim())
        .filter(Boolean)
    ).size;
    const yearPo = yearClasses.reduce((sum, c) => sum + (c.teacherPo ?? 0) + (c.headteacherPo ?? 0) * 0.1, 0);
    const yearDevPo = yearDevProjects.reduce((sum, p) => sum + (p.poCount ?? 0), 0);
    return { yearOverseas, yearPo, yearDevPo };
  }, [classes, devSnapshot.projects, filter.year]);

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Dashboard
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-wide text-[color:var(--text)]">
              {profile.name ? `你好，${profile.name}老师` : "你好，欢迎回来"}
            </h1>
            {profile.title && (
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {profile.title}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            交付全局概览
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 text-sm text-[color:var(--muted)]">
          <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
          {travelSummary}
        </div>
      </header>

      {/* 筛选栏 */}
      <DashboardFilterBar filter={filter} onChange={setFilter} />

      {/* 年度总览卡片 */}
      <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.4, ease: "easeOut" }}
          whileHover={{ y: -4 }}
          className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 shadow-lg shadow-black/10 transition"
        >
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-sky-500/20 blur-2xl transition group-hover:scale-110" />
          <p className="text-sm text-[color:var(--muted)]">{filter.year} 年总 PO</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-sky-400">
              {filterYearStats.yearPo + filterYearStats.yearDevPo}
            </span>
            <span className="text-sm text-[color:var(--muted)]">个</span>
          </div>
          <div className="mt-2 flex gap-3 text-xs text-[color:var(--muted)]">
            <span>授课 {filterYearStats.yearPo}</span>
            <span>开发 {filterYearStats.yearDevPo}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease: "easeOut" }}
          whileHover={{ y: -4 }}
          className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 shadow-lg shadow-black/10 transition"
        >
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl transition group-hover:scale-110" />
          <p className="text-sm text-[color:var(--muted)]">筛选班级数</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-emerald-400">
              {filteredClasses.length}
            </span>
            <span className="text-sm text-[color:var(--muted)]">个班级</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          whileHover={{ y: -4 }}
          className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 shadow-lg shadow-black/10 transition"
        >
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl transition group-hover:scale-110" />
          <p className="text-sm text-[color:var(--muted)]">已前往国家/地区</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-amber-400">
              {filterYearStats.yearOverseas}
            </span>
            <span className="text-sm text-[color:var(--muted)]">个</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
          whileHover={{ y: -4 }}
          className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 shadow-lg shadow-black/10 transition"
        >
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl transition group-hover:scale-110" />
          <p className="text-sm text-[color:var(--muted)]">总学员数</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-purple-400">
              {learnerStats.total}
            </span>
            <span className="text-sm text-[color:var(--muted)]">人</span>
          </div>
        </motion.div>
      </section>

      {/* PO 总览 */}
      <CollapsibleSection
        title="PO 分解"
        subtitle="授课 PO 与开发 PO 占比"
        icon={<BarChart3 className="h-4 w-4" />}
        defaultExpanded={true}
      >
        <PoBreakdownCard po={poBreakdown} levelBreakdown={levelBreakdown} />
      </CollapsibleSection>

      {/* 分类看板 + 学员统计 row */}
      <section className="grid gap-6 lg:grid-cols-2">
        <CollapsibleSection
          title="课程类型分布"
          subtitle="各类别的班级数与 PO"
          icon={<Layers className="h-4 w-4" />}
          defaultExpanded={true}
        >
          <ClassTypeDistribution items={classTypeDistribution} />
        </CollapsibleSection>

        <CollapsibleSection
          title="学员统计"
          subtitle="总学员数及类型占比"
          icon={<Users className="h-4 w-4" />}
          defaultExpanded={true}
        >
          <LearnerCountCard stats={learnerStats} />
        </CollapsibleSection>
      </section>

      {/* 阶段分布 */}
      <CollapsibleSection
        title="阶段分布"
        subtitle="各阶段班级数量"
        icon={<BarChart3 className="h-4 w-4" />}
        defaultExpanded={false}
      >
        <StageDistribution items={stageDistribution} />
      </CollapsibleSection>

      {/* 今日教学 + 课程开发 row */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <CollapsibleSection
          title="今日教学任务"
          subtitle="当前交付课程"
          icon={<CalendarClock className="h-4 w-4" />}
          defaultExpanded={true}
        >
          <div className="space-y-4">
            {teachingTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] py-6 text-center text-sm text-[color:var(--muted)]">
                暂无正在交付的课程
              </div>
            ) : (
              teachingTasks.map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="rounded-2xl"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/delivery/${task.classId}`)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-left transition hover:border-[color:var(--accent)]/45 hover:bg-white/[0.02] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/35"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[color:var(--text)]" title={task.title}>
                        {task.title}
                      </p>
                      <p className="truncate text-xs text-[color:var(--muted)]" title={task.location}>
                        {task.location}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-[color:var(--muted-strong)]">
                      {task.schedule}
                    </span>
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="课程开发"
          subtitle="DevTracker 活跃项目"
          icon={<TerminalSquare className="h-4 w-4" />}
          defaultExpanded={true}
        >
          <div className="space-y-4">
            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3">
              <DevMiniStat
                label="活跃项目"
                value={String(devInsights.activeProjects.length)}
                icon={<TerminalSquare className="h-4 w-4 text-sky-400" />}
              />
              <DevMiniStat
                label="待提交"
                value={String(devInsights.readyToSubmit.length)}
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              />
              <DevMiniStat
                label="逾期"
                value={String(devInsights.overdueCount)}
                icon={<Clock3 className="h-4 w-4 text-amber-400" />}
              />
            </div>

            {/* 关键开发项 */}
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-4">
              <p className="text-sm font-medium text-[color:var(--text)]">关键开发项</p>
              <div className="mt-4 space-y-3">
                {devInsights.nearDue.length === 0 &&
                devInsights.qaItems.length === 0 &&
                devInsights.readyToSubmit.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[color:var(--border)] py-4 text-center text-sm text-[color:var(--muted)]">
                    当前没有需要重点关注的课程开发交付物。
                  </div>
                ) : (
                  [...devInsights.nearDue.slice(0, 2), ...devInsights.qaItems.slice(0, 1), ...devInsights.readyToSubmit.slice(0, 1)]
                    .slice(0, 4)
                    .map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() =>
                          navigate("/dev", {
                            state: {
                              activeTab: "kanban",
                              selectedProjectId: task.projectId,
                            },
                          })
                        }
                        className="flex w-full items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-left transition hover:border-[color:var(--accent)]/45 hover:bg-white/[0.02] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/35"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-[color:var(--text)]">{task.title}</p>
                          <p className="truncate text-xs text-[color:var(--muted)]">
                            {devInsights.activeProjectMap.get(task.projectId)?.title ?? "未分组"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[color:var(--chip)] px-2 py-1 text-[10px] text-[color:var(--accent)]">
                          {task.status === "qaReview"
                            ? "QA 中"
                            : task.status === "readyToSubmit"
                              ? "待提交"
                              : task.dueDate || "待排期"}
                        </span>
                      </button>
                    ))
                )}
              </div>
            </div>

            {/* 活跃课程项目 */}
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-4">
              <p className="text-sm font-medium text-[color:var(--text)]">活跃课程项目</p>
              <div className="mt-4 space-y-3">
                {devInsights.activeProjects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[color:var(--border)] py-4 text-center text-sm text-[color:var(--muted)]">
                    当前没有进行中的课程开发项目。
                  </div>
                ) : (
                  devInsights.activeProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() =>
                        navigate("/dev", {
                          state: {
                            activeTab: "kanban",
                            selectedProjectId: project.id,
                          },
                        })
                      }
                      className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-left transition hover:border-[color:var(--accent)]/45 hover:bg-white/[0.02] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/35"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-[color:var(--text)]">{project.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
                            <span>{project.endDate} 截止</span>
                            <div className="flex items-center space-x-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-sky-500/50" />
                              <span>{getQuarterLabel(project.endDate)}</span>
                            </div>
                            {project.poCount > 0 && (
                              <div className="flex items-center space-x-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500/50" />
                                <span>PO {project.poCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[color:var(--text)]">{project.progress}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--border)]">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </section>

      {/* 地理分布 */}
      <CollapsibleSection
        title="地理分布"
        subtitle="按地点分组的班级与 PO"
        icon={<Globe className="h-4 w-4" />}
        defaultExpanded={false}
      >
        <GeoBreakdown items={geoBreakdown} />
      </CollapsibleSection>
    </div>
  );
}

function DevMiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[color:var(--muted)]">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{value}</p>
    </div>
  );
}
