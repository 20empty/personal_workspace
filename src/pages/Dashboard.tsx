import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useProfile } from "../hooks/useProfile";
import {
  CalendarClock,
  TerminalSquare,
  Sparkles,
} from "lucide-react";
import {
  getCoursesByClassId,
  listDeliveryClasses,
  type CourseRecord,
  type DeliveryClassRecord,
} from "../db/delivery";

type TeachingTask = {
  id: string;
  title: string;
  location: string;
  schedule: string;
};

type StatCard = {
  title: string;
  value: string;
  unit: string;
  hint: string;
};

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

export default function Dashboard() {
  const { profile } = useProfile();
  const [classes, setClasses] = useState<DeliveryClassRecord[]>([]);
  const [teachingTasks, setTeachingTasks] = useState<TeachingTask[]>([]);

  const now = new Date();
  const currentQuarter = quarterOf(now);
  const currentYear = now.getFullYear();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const rows = await listDeliveryClasses();
        if (cancelled) return;
        setClasses(rows);

        const activeClasses = rows.filter((item) => item.stage === "active");
        const taskEntries = await Promise.all(
          activeClasses.map(async (item) => {
            const courses = await getCoursesByClassId(item.id);
            const currentCourse = pickCurrentCourse(courses);
            if (!currentCourse) {
              return {
                id: item.id,
                title: `${item.title}（待排课）`,
                location: item.location,
                schedule: "待排课",
              } satisfies TeachingTask;
            }
            return {
              id: `${item.id}-${currentCourse.id}`,
              title: `${item.title} · ${currentCourse.name}`,
              location: item.location,
              schedule: `${formatDate(currentCourse.startDate)} - ${formatDate(currentCourse.endDate)}`,
            } satisfies TeachingTask;
          })
        );

        if (!cancelled) {
          setTeachingTasks(taskEntries);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        if (!cancelled) {
          setClasses([]);
          setTeachingTasks([]);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo<StatCard[]>(() => {
    const completed = classes.filter((item) => item.stage === "completed");
    const poValue = (item: DeliveryClassRecord) =>
      (item.teacherPo ?? 0) + (item.headteacherPo ?? 0);

    const yearPo = completed
      .filter((item) => parseDate(item.endDate).getFullYear() === currentYear)
      .reduce((sum, item) => sum + poValue(item), 0);

    const quarterPo = completed
      .filter((item) => {
        const endDate = parseDate(item.endDate);
        return (
          endDate.getFullYear() === currentYear &&
          quarterOf(endDate) === currentQuarter
        );
      })
      .reduce((sum, item) => sum + poValue(item), 0);

    const overseasVisited = new Set(
      classes
        .filter(
          (item) =>
            item.classType === "overseas" &&
            (item.stage === "active" || item.stage === "completed")
        )
        .map((item) => item.location.trim())
        .filter(Boolean)
    ).size;

    return [
      {
        title: "本年度已交付 PO",
        value: String(yearPo),
        unit: "个",
        hint: `${currentYear} 年结算`,
      },
      {
        title: "本季度已交付 PO",
        value: String(quarterPo),
        unit: "个",
        hint: `Q${currentQuarter} 结算`,
      },
      {
        title: "已完成开发 PO",
        value: "--",
        unit: "",
        hint: "待开发",
      },
      {
        title: "已前往国家/地区",
        value: String(overseasVisited),
        unit: "个",
        hint: "海外出差（进行中+已交付）",
      },
    ];
  }, [classes, currentQuarter, currentYear]);

  const travelSummary = useMemo(() => {
    const firstActiveLocation = classes
      .find((item) => item.stage === "active" && item.location.trim())
      ?.location.trim();
    if (!firstActiveLocation) {
      return "今日行程：待安排";
    }
    return `今日行程：${firstActiveLocation}`;
  }, [classes]);

  return (
    <div className="relative space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Dashboard
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-wide text-[color:var(--text)]">
              你好👋，{profile.name}老师
            </h1>
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs text-[color:var(--muted)]">
              {profile.title}
            </span>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
            whileHover={{ y: -6 }}
            className="group relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5 shadow-lg shadow-black/10 transition"
          >
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[color:var(--chip)] blur-2xl transition group-hover:scale-110" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-sky-500/10 to-transparent opacity-0 transition group-hover:opacity-100" />
            <p className="text-sm text-[color:var(--muted)]">{item.title}</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-semibold text-[color:var(--text)]">
                {item.value}
              </span>
              {item.unit ? (
                <span className="text-sm text-[color:var(--muted)]">{item.unit}</span>
              ) : null}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--chip)] px-2 py-1 text-xs text-[color:var(--accent)]">
              {item.hint}
            </div>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                今日教学任务
              </p>
              <h2 className="text-lg font-semibold text-[color:var(--text)]">当前交付课程</h2>
            </div>
            <CalendarClock className="h-5 w-5 text-[color:var(--muted)]" />
          </div>
          <div className="mt-6 space-y-4">
            {teachingTasks.length === 0 ? (
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-6 text-sm text-[color:var(--muted)]">
                暂无正在交付的课程
              </div>
            ) : (
              teachingTasks.map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-[color:var(--text)]">{task.title}</p>
                    <p className="text-xs text-[color:var(--muted)]">{task.location}</p>
                  </div>
                  <span className="text-sm text-[color:var(--muted-strong)]">
                    {task.schedule}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                最近活跃
              </p>
              <h2 className="text-lg font-semibold text-[color:var(--text)]">开发任务</h2>
            </div>
            <TerminalSquare className="h-5 w-5 text-[color:var(--muted)]" />
          </div>
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
            <p className="text-sm text-[color:var(--text)]">待开发</p>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              开发 PO 与活跃任务统计将在后续版本接入。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
