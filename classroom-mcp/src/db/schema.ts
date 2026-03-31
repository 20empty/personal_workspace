// 类型定义（复刻自 src/db/schema.ts，无 Drizzle 依赖）

export type ClassType = "overseas" | "domestic" | "centralized" | "online";

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  overseas: "海外出差培训",
  domestic: "国内出差培训",
  centralized: "集中培训",
  online: "在线培训",
};

export type DeliveryClassInput = {
  title: string;
  code: string;
  contractNo?: string;
  location: string;
  startDate: string;
  endDate: string;
  classType?: ClassType;
  learners?: number;
  teacherPo?: number;
  projectSupportPo?: number;
  headteacherPo?: number;
  status?: string;
  stage?: string;
  progress?: number;
  nextSession?: string;
  focus?: string[];
  archiveState?: string;
  notes?: string | null;
};

export type DeliveryClassRecord = {
  id: string;
  code: string;
  contractNo: string;
  title: string;
  location: string;
  status: string;
  stage: string;
  classType: ClassType;
  startDate: string;
  endDate: string;
  learners: number;
  teacherPo: number;
  projectSupportPo: number;
  headteacherPo: number;
  progress: number;
  nextSession?: string;
  focus: string[];
  archiveState: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SopTaskRecord = {
  id: string;
  classId: string;
  stage: string;
  title: string;
  status: string;
  orderIndex: number;
  createdAt: string;
};

export type CourseRecord = {
  id: string;
  classId: string;
  courseTemplateId: string | null;
  name: string;
  level: string;
  days: string;
  startDate: string;
  endDate: string;
  schedulePath: string | null;
  schedulePreviewPath: string | null;
  scheduleFileName: string | null;
  scheduleFileType: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type SopTemplateRecord = {
  id: string;
  classType: ClassType;
  stage: string;
  title: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

export type CourseTemplateRecord = {
  id: string;
  name: string;
  level: string;
  days: string;
  schedulePath: string | null;
  schedulePreviewPath: string | null;
  scheduleFileName: string | null;
  scheduleFileType: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};
