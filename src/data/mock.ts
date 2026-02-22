export const stats = [
  {
    title: "进行中班级",
    value: 3,
    unit: "个",
    delta: "+1",
  },
  {
    title: "今日教学任务",
    value: 5,
    unit: "项",
    delta: "+2",
  },
  {
    title: "活跃开发任务",
    value: 8,
    unit: "项",
    delta: "+3",
  },
  {
    title: "学员覆盖地区",
    value: 6,
    unit: "个",
    delta: "+1",
  },
];

export const recentDevTasks = [
  {
    title: "多云区实验环境自动化脚本",
    tag: "脚本开发",
    progress: 62,
  },
  {
    title: "海外机房网络加速排障指南",
    tag: "文档维护",
    progress: 45,
  },
  {
    title: "K8s 教案演示库重构",
    tag: "课程研发",
    progress: 78,
  },
];

export const todayTeaching = [
  { title: "Azure 容器服务实操", time: "09:30", location: "线上（多地）" },
  { title: "混合云网络设计评审", time: "13:30", location: "深圳" },
  { title: "GPU 集群调优 Workshop", time: "19:00", location: "远程" },
];

export const deliveryClasses = [
  {
    id: "cls-001",
    code: "CN-SZ-2403",
    title: "企业云原生训练营",
    location: "深圳",
    learners: 32,
    progress: 72,
    status: "进行中",
    stage: "active",
    dateRange: "2026.02.10 - 2026.03.08",
    nextSession: "周二 14:00",
    focus: ["Kubernetes", "微服务治理", "SRE 演练"],
  },
  {
    id: "cls-002",
    code: "AE-DXB-2403",
    title: "多云安全架构实训",
    location: "迪拜",
    learners: 28,
    progress: 48,
    status: "已排期",
    stage: "upcoming",
    dateRange: "2026.03.15 - 2026.04.02",
    nextSession: "周一 10:00",
    focus: ["多云安全", "零信任", "IAM 加固"],
  },
  {
    id: "cls-003",
    code: "NG-LAG-2403",
    title: "混合云网络交付",
    location: "拉各斯",
    learners: 24,
    progress: 64,
    status: "已排期",
    stage: "upcoming",
    dateRange: "2026.04.12 - 2026.05.01",
    nextSession: "周四 16:00",
    focus: ["混合云网络", "BGP", "SD-WAN"],
  },
  {
    id: "cls-004",
    code: "CN-SH-2402",
    title: "Kubernetes 深度演练",
    location: "上海",
    learners: 36,
    progress: 90,
    status: "已交付",
    stage: "completed",
    dateRange: "2026.01.08 - 2026.02.05",
    nextSession: "已完成",
    focus: ["调度策略", "故障演练"],
    archiveState: "已归档",
  },
  {
    id: "cls-005",
    code: "SA-RUH-2402",
    title: "云平台性能优化",
    location: "利雅得",
    learners: 22,
    progress: 38,
    status: "已排期",
    stage: "upcoming",
    dateRange: "2026.05.10 - 2026.06.01",
    nextSession: "周二 09:30",
    focus: ["性能压测", "容量规划"],
  },
  {
    id: "cls-006",
    code: "CN-BJ-2404",
    title: "GPU 集群课程交付",
    location: "北京",
    learners: 30,
    progress: 18,
    status: "已交付",
    stage: "completed",
    dateRange: "2026.06.15 - 2026.07.05",
    nextSession: "已完成",
    focus: ["GPU 调优", "算力调度"],
    archiveState: "待归档",
  },
];

export const activeClassId = "cls-001";

export type ProfileInfo = {
  name: string;
  title: string;
  avatar: string;
  bio: string;
};

export const defaultProfile: ProfileInfo = {
  name: "Jerry",
  title: "企业云计算讲师",
  avatar:
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=300&auto=format&fit=crop",
  bio: "常驻多地交付 · 专注云原生与混合云培训",
};
