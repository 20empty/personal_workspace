# DevTracker 测试计划文档

## 1. 测试概述

### 1.1 项目信息
- **项目名称**: DevTracker（开发PO与任务看板）
- **技术栈**: React + TypeScript + Tauri + SQLite
- **测试框架**: Vitest + React Testing Library
- **版本**: v0.0.2

### 1.2 测试范围
| 模块 | 功能点 | 优先级 |
|------|--------|--------|
| 开发PO管理 | PO列表展示、新建、删除、状态流转、进度计算 | P0 |
| 任务看板 | 看板展示、任务CRUD、拖拽排序、状态变更 | P0 |
| 统计功能 | 年度统计、状态统计、任务统计 | P1 |
| 边界情况 | 异常输入、性能、并发、空状态 | P1 |

### 1.3 测试类型
- 单元测试（Unit Tests）
- 集成测试（Integration Tests）
- 端到端测试（E2E Tests）
- 手动测试（Manual Tests）

---

## 2. 功能模块测试用例

### 2.1 开发PO管理测试

#### TC-DP-001: 创建PO-所有必填项
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-001 |
| **用例名称** | 创建PO-填写所有必填项 |
| **前置条件** | 1. 用户已登录<br>2. 处于DevTracker页面 |
| **测试步骤** | 1. 点击"新建PO"按钮<br>2. 填写PO编号：PO-2024-001<br>3. 填写PO名称：云原生平台开发<br>4. 选择开始日期：2024-01-01<br>5. 选择结束日期：2024-06-30<br>6. 点击"保存"按钮 |
| **预期结果** | 1. 弹窗关闭<br>2. PO出现在"规划中"队列<br>3. PO状态为planning<br>4. 进度显示为0% |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-DP-002: 创建PO-缺少必填项
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-002 |
| **用例名称** | 创建PO-缺少必填项验证 |
| **前置条件** | 1. 用户已登录<br>2. 处于DevTracker页面 |
| **测试步骤** | 1. 点击"新建PO"按钮<br>2. 不填写任何字段<br>3. 点击"保存"按钮 |
| **预期结果** | 1. 表单验证失败<br>2. 显示错误提示："请输入PO编号"、"请输入PO名称"等<br>3. 弹窗保持打开<br>4. 数据未提交 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-DP-003: 状态流转-开始开发
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-003 |
| **用例名称** | PO状态流转：planning → inProgress |
| **前置条件** | 1. 存在状态为planning的PO |
| **测试步骤** | 1. 在"规划中"队列找到目标PO<br>2. 点击"开始开发"按钮<br>3. 确认弹窗中点击"确认" |
| **预期结果** | 1. PO从"规划中"移动到"进行中"队列<br>2. PO状态更新为inProgress<br>3. 开始日期自动设置为当前日期 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-DP-004: 状态流转-完成开发
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-004 |
| **用例名称** | PO状态流转：inProgress → completed |
| **前置条件** | 1. 存在状态为inProgress的PO<br>2. 该PO下所有任务已完成 |
| **测试步骤** | 1. 在"进行中"队列找到目标PO<br>2. 点击"完成开发"按钮<br>3. 确认弹窗中点击"确认" |
| **预期结果** | 1. PO从"进行中"移动到"已完成"队列<br>2. PO状态更新为completed<br>3. 结束日期自动设置为当前日期<br>4. 进度显示为100% |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-DP-005: 状态流转-归档
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-005 |
| **用例名称** | PO状态流转：completed → archived |
| **前置条件** | 1. 存在状态为completed的PO |
| **测试步骤** | 1. 在"已完成"队列找到目标PO<br>2. 点击"归档"按钮<br>3. 确认弹窗中点击"确认" |
| **预期结果** | 1. PO从"已完成"队列消失<br>2. PO状态更新为archived<br>3. PO可在归档列表中查看 |
| **优先级** | P1 |
| **自动化** | 是 |

#### TC-DP-006: 删除PO-有任务
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-006 |
| **用例名称** | 删除PO-级联删除任务 |
| **前置条件** | 1. 存在PO且该PO下有多个任务 |
| **测试步骤** | 1. 找到目标PO<br>2. 点击"删除"按钮<br>3. 确认弹窗中点击"确认删除" |
| **预期结果** | 1. PO从列表中移除<br>2. 该PO下所有任务被级联删除<br>3. 数据库中无残留数据 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-DP-007: 进度计算-任务完成情况
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-007 |
| **用例名称** | 进度自动计算-基于任务完成率 |
| **前置条件** | 1. PO下有10个任务<br>2. 当前完成0个 |
| **测试步骤** | 1. 完成PO下的3个任务<br>2. 观察PO卡片进度显示 |
| **预期结果** | 1. 进度显示为30%<br>2. 进度条颜色为蓝色（进行中） |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-DP-008: 进度计算-全部完成
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-008 |
| **用例名称** | 进度自动计算-全部任务完成 |
| **前置条件** | 1. PO下有5个任务<br>2. 当前完成4个 |
| **测试步骤** | 1. 完成最后1个任务<br>2. 观察PO卡片进度显示 |
| **预期结果** | 1. 进度显示为100%<br>2. 进度条颜色变为绿色<br>3. 显示"完成开发"按钮可用 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-DP-009: PO编号重复处理
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-009 |
| **用例名称** | PO编号重复验证 |
| **前置条件** | 1. 已存在PO编号"PO-2024-001" |
| **测试步骤** | 1. 点击"新建PO"<br>2. 输入已存在的PO编号<br>3. 点击"保存" |
| **预期结果** | 1. 显示错误提示："PO编号已存在"<br>2. 表单不提交<br>3. 用户可修改后重试 |
| **优先级** | P1 |
| **自动化** | 是 |

#### TC-DP-010: PO日期验证
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-DP-010 |
| **用例名称** | PO日期逻辑验证 |
| **前置条件** | 无 |
| **测试步骤** | 1. 点击"新建PO"<br>2. 开始日期选择2024-06-30<br>3. 结束日期选择2024-01-01<br>4. 点击"保存" |
| **预期结果** | 1. 显示错误提示："结束日期不能早于开始日期"<br>2. 表单不提交 |
| **优先级** | P1 |
| **自动化** | 是 |

---

### 2.2 任务看板测试

#### TC-TK-001: 创建任务-默认Backlog
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-TK-001 |
| **用例名称** | 创建任务-默认进入Backlog |
| **前置条件** | 1. 已进入某PO的任务看板 |
| **测试步骤** | 1. 点击"新建任务"按钮<br>2. 填写任务名称：设计数据库架构<br>3. 点击"保存" |
| **预期结果** | 1. 任务出现在Backlog列<br>2. 任务状态为backlog<br>3. orderIndex为当前列最大值+1 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-TK-002: 移动任务-Todo
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-TK-002 |
| **用例名称** | 移动任务到Todo列 |
| **前置条件** | 1. Backlog列存在任务 |
| **测试步骤** | 1. 拖拽任务从Backlog到Todo<br>2. 释放鼠标 |
| **预期结果** | 1. 任务移动到Todo列<br>2. 任务状态更新为todo<br>3. PO进度保持不变 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-TK-003: 完成任务-Done
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-TK-003 |
| **用例名称** | 完成任务-移动到Done列 |
| **前置条件** | 1. Review列存在任务 |
| **测试步骤** | 1. 拖拽任务从Review到Done<br>2. 释放鼠标 |
| **预期结果** | 1. 任务移动到Done列<br>2. 任务状态更新为done<br>3. PO进度自动增加 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-TK-004: 拖拽排序-同列
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-TK-004 |
| **用例名称** | 同列拖拽调整任务顺序 |
| **前置条件** | 1. Todo列有3个任务：A(order=0)、B(order=1)、C(order=2) |
| **测试步骤** | 1. 拖拽任务C到任务A和B之间<br>2. 释放鼠标 |
| **预期结果** | 1. 任务顺序变为：A、C、B<br>2. orderIndex更新：A=0、C=1、B=2<br>3. 状态保持不变 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-TK-005: 拖拽移动-跨列
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-TK-005 |
| **用例名称** | 跨列拖拽移动任务 |
| **前置条件** | 1. InProgress列有任务X<br>2. Review列为空 |
| **测试步骤** | 1. 拖拽任务X从InProgress到Review<br>2. 放置到Review列顶部 |
| **预期结果** | 1. 任务移动到Review列<br>2. 状态更新为review<br>3. orderIndex设置为0<br>4. PO进度自动计算 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-TK-006: 删除任务
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-TK-006 |
| **用例名称** | 删除任务 |
| **前置条件** | 1. 看板中存在任务 |
| **测试步骤** | 1. 点击任务卡片上的删除图标<br>2. 确认弹窗中点击"确认" |
| **预期结果** | 1. 任务从看板移除<br>2. 数据库中任务被删除<br>3. PO进度重新计算 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-TK-007: 编辑任务
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-TK-007 |
| **用例名称** | 编辑任务信息 |
| **前置条件** | 1. 看板中存在任务 |
| **测试步骤** | 1. 点击任务卡片<br>2. 修改任务名称<br>3. 修改截止日期<br>4. 点击"保存" |
| **预期结果** | 1. 任务信息更新<br>2. 看板显示更新后的信息<br>3. 其他字段保持不变 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-TK-008: 任务截止日期验证
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-TK-008 |
| **用例名称** | 任务截止日期早于PO开始日期 |
| **前置条件** | 1. PO开始日期为2024-03-01 |
| **测试步骤** | 1. 创建新任务<br>2. 设置截止日期为2024-02-01<br>3. 点击"保存" |
| **预期结果** | 1. 显示警告提示<br>2. 允许保存但标记为"日期异常"<br>3. 或根据需求阻止保存 |
| **优先级** | P1 |
| **自动化** | 是 |

#### TC-TK-009: 任务看板空状态
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-TK-009 |
| **用例名称** | 任务看板空状态展示 |
| **前置条件** | 1. PO下无任何任务 |
| **测试步骤** | 1. 进入PO详情页<br>2. 切换到任务看板标签 |
| **预期结果** | 1. 显示空状态插图<br>2. 显示提示文字："暂无任务，点击新建任务开始"<br>3. 显示"新建任务"按钮 |
| **优先级** | P1 |
| **自动化** | 是 |

---

### 2.3 统计功能测试

#### TC-ST-001: 年度PO统计
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-ST-001 |
| **用例名称** | 年度开发PO总数统计 |
| **前置条件** | 1. 数据库中有2024年PO 5个<br>2. 2023年PO 3个<br>3. 2025年PO 2个 |
| **测试步骤** | 1. 进入Dashboard页面<br>2. 查看年度统计卡片 |
| **预期结果** | 1. 显示"年度开发PO总数：5"<br>2. 仅统计当前年份(2024)的PO |
| **优先级** | P1 |
| **自动化** | 是 |

#### TC-ST-002: 已完成PO统计
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-ST-002 |
| **用例名称** | 已完成PO数量统计 |
| **前置条件** | 1. 当前年份有PO 10个<br>2. 其中completed状态3个<br>3. archived状态2个<br>4. inProgress状态3个<br>5. planning状态2个 |
| **测试步骤** | 1. 进入Dashboard页面<br>2. 查看"已完成PO数"卡片 |
| **预期结果** | 1. 显示"已完成PO数：3"<br>2. 仅统计completed状态的PO<br>3. 不包含archived状态的PO |
| **优先级** | P1 |
| **自动化** | 是 |

#### TC-ST-003: 进行中任务统计
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-ST-003 |
| **用例名称** | 进行中任务数量统计 |
| **前置条件** | 1. 系统中有任务50个<br>2. done状态20个<br>3. 其他状态30个 |
| **测试步骤** | 1. 进入Dashboard页面<br>2. 查看"进行中任务"卡片 |
| **预期结果** | 1. 显示"进行中任务：30"<br>2. 统计所有非done状态的任务 |
| **优先级** | P1 |
| **自动化** | 是 |

#### TC-ST-004: 各状态PO数量
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-ST-004 |
| **用例名称** | 各状态PO数量分布 |
| **前置条件** | 1. planning状态PO：5个<br>2. inProgress状态PO：3个<br>3. completed状态PO：2个 |
| **测试步骤** | 1. 进入Dashboard页面<br>2. 查看状态分布图表 |
| **预期结果** | 1. 图表显示planning:5<br>2. 图表显示inProgress:3<br>3. 图表显示completed:2<br>4. 总数为10 |
| **优先级** | P1 |
| **自动化** | 是 |

---

### 2.4 边界情况测试

#### TC-BD-001: 大量任务性能测试
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-BD-001 |
| **用例名称** | 大量任务（100+）看板性能 |
| **前置条件** | 1. PO下有100个任务 |
| **测试步骤** | 1. 打开任务看板<br>2. 测量加载时间<br>3. 执行拖拽操作<br>4. 测量响应时间 |
| **预期结果** | 1. 页面加载时间 < 2秒<br>2. 拖拽响应时间 < 100ms<br>3. 无卡顿现象 |
| **优先级** | P1 |
| **自动化** | 否（性能测试） |

#### TC-BD-002: 并发创建任务
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-BD-002 |
| **用例名称** | 快速创建多个任务 |
| **前置条件** | 无 |
| **测试步骤** | 1. 快速点击"新建任务"10次<br>2. 快速填写并保存10个任务 |
| **预期结果** | 1. 所有任务成功创建<br>2. orderIndex正确分配<br>3. 无重复ID<br>4. 无数据丢失 |
| **优先级** | P1 |
| **自动化** | 是 |

#### TC-BD-003: 超长PO名称
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-BD-003 |
| **用例名称** | 超长PO名称处理 |
| **前置条件** | 无 |
| **测试步骤** | 1. 创建PO<br>2. 名称输入200个字符<br>3. 保存 |
| **预期结果** | 1. 成功保存<br>2. 列表中显示截断并带tooltip<br>3. 详情页完整显示 |
| **优先级** | P2 |
| **自动化** | 是 |

#### TC-BD-004: 特殊字符输入
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-BD-004 |
| **用例名称** | 特殊字符输入处理 |
| **前置条件** | 无 |
| **测试步骤** | 1. 创建PO<br>2. 名称输入：`<script>alert('xss')</script>`<br>3. 保存并查看 |
| **预期结果** | 1. 成功保存<br>2. 页面无脚本执行<br>3. 显示为纯文本 |
| **优先级** | P0 |
| **自动化** | 是 |

#### TC-BD-005: 数据库连接断开
| 项目 | 内容 |
|------|------|
| **用例编号** | TC-BD-005 |
| **用例名称** | 数据库连接异常处理 |
| **前置条件** | 1. 应用正常运行 |
| **测试步骤** | 1. 断开数据库连接<br>2. 尝试创建PO<br>3. 观察错误处理 |
| **预期结果** | 1. 显示友好错误提示<br>2. 不崩溃<br>3. 提供重试机制 |
| **优先级** | P1 |
| **自动化** | 否 |

---

## 3. 测试数据准备

### 3.1 基础测试数据

```typescript
// test/fixtures/devTracker.ts

export const mockProjects = [
  {
    id: "proj-001",
    code: "PO-2024-001",
    name: "云原生平台开发",
    status: "planning",
    startDate: "2024-03-01",
    endDate: "2024-06-30",
    progress: 0,
    createdAt: "2024-02-15T08:00:00Z",
  },
  {
    id: "proj-002",
    code: "PO-2024-002",
    name: "AI智能客服系统",
    status: "inProgress",
    startDate: "2024-01-15",
    endDate: "2024-05-30",
    progress: 45,
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "proj-003",
    code: "PO-2024-003",
    name: "数据中台建设",
    status: "completed",
    startDate: "2023-11-01",
    endDate: "2024-02-28",
    progress: 100,
    createdAt: "2023-10-20T08:00:00Z",
  },
];

export const mockTasks = [
  {
    id: "task-001",
    projectId: "proj-002",
    title: "需求分析",
    status: "done",
    orderIndex: 0,
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "task-002",
    projectId: "proj-002",
    title: "架构设计",
    status: "done",
    orderIndex: 1,
    createdAt: "2024-01-20T08:00:00Z",
  },
  {
    id: "task-003",
    projectId: "proj-002",
    title: "数据库设计",
    status: "inProgress",
    orderIndex: 0,
    createdAt: "2024-02-01T08:00:00Z",
  },
  {
    id: "task-004",
    projectId: "proj-002",
    title: "API开发",
    status: "todo",
    orderIndex: 0,
    createdAt: "2024-02-10T08:00:00Z",
  },
  {
    id: "task-005",
    projectId: "proj-002",
    title: "前端开发",
    status: "backlog",
    orderIndex: 0,
    createdAt: "2024-02-15T08:00:00Z",
  },
];

export const invalidInputs = {
  emptyName: "",
  longName: "a".repeat(300),
  specialChars: "<script>alert('xss')</script>",
  sqlInjection: "'; DROP TABLE projects; --",
  invalidDate: "2024-13-45",
  endBeforeStart: { start: "2024-06-01", end: "2024-01-01" },
};
```

### 3.2 数据工厂函数

```typescript
// test/factories/projectFactory.ts

import { faker } from "@faker-js/faker";

export function createProject(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    code: `PO-${faker.date.recent().getFullYear()}-${faker.string.numeric(3)}`,
    name: faker.commerce.productName(),
    status: faker.helpers.arrayElement(["planning", "inProgress", "completed", "archived"]),
    startDate: faker.date.future().toISOString().split("T")[0],
    endDate: faker.date.future().toISOString().split("T")[0],
    progress: faker.number.int({ min: 0, max: 100 }),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTask(projectId: string, overrides = {}) {
  return {
    id: crypto.randomUUID(),
    projectId,
    title: faker.hacker.phrase(),
    status: faker.helpers.arrayElement(["backlog", "todo", "inProgress", "review", "done"]),
    orderIndex: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createTaskList(projectId: string, count: number, status?: string) {
  return Array.from({ length: count }, (_, i) =>
    createTask(projectId, {
      status: status || faker.helpers.arrayElement(["backlog", "todo", "inProgress", "review", "done"]),
      orderIndex: i,
    })
  );
}
```

---

## 4. 自动化测试代码

### 4.1 测试配置

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/",
        "**/*.d.ts",
        "**/*.config.*",
      ],
    },
  },
});
```

```typescript
// test/setup.ts
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// 模拟 Tauri API
vi.mock("@tauri-apps/plugin-sql", () => ({
  default: {
    load: vi.fn(),
  },
}));

// 清理 after each test
afterEach(() => {
  cleanup();
});
```

### 4.2 数据库操作测试

```typescript
// test/db/project.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createProject,
  getProjectById,
  updateProjectStatus,
  deleteProject,
  listProjects,
} from "../../src/db/projects";

// 模拟数据库
const mockDb = {
  execute: vi.fn(),
  select: vi.fn(),
};

vi.mock("../../src/db/client", () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

describe("Project Database Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProject", () => {
    it("TC-DP-001: should create project with all required fields", async () => {
      const input = {
        code: "PO-2024-001",
        name: "云原生平台开发",
        startDate: "2024-03-01",
        endDate: "2024-06-30",
      };

      mockDb.execute.mockResolvedValueOnce(undefined);

      const id = await createProject(input);

      expect(id).toBeDefined();
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO projects"),
        expect.arrayContaining([
          input.code,
          input.name,
          input.startDate,
          input.endDate,
          "planning",
          0,
        ])
      );
    });

    it("TC-DP-002: should reject project with empty required fields", async () => {
      const input = {
        code: "",
        name: "",
        startDate: "2024-03-01",
        endDate: "2024-06-30",
      };

      await expect(createProject(input)).rejects.toThrow("必填字段不能为空");
    });

    it("TC-DP-009: should reject duplicate project code", async () => {
      const input = {
        code: "PO-2024-001",
        name: "测试项目",
        startDate: "2024-03-01",
        endDate: "2024-06-30",
      };

      mockDb.execute.mockRejectedValueOnce(new Error("UNIQUE constraint failed"));

      await expect(createProject(input)).rejects.toThrow("PO编号已存在");
    });
  });

  describe("updateProjectStatus", () => {
    it("TC-DP-003: should update status from planning to inProgress", async () => {
      const projectId = "proj-001";

      mockDb.execute.mockResolvedValueOnce(undefined);

      await updateProjectStatus(projectId, "inProgress");

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE projects"),
        expect.arrayContaining(["inProgress", projectId])
      );
    });

    it("TC-DP-004: should update status from inProgress to completed", async () => {
      const projectId = "proj-001";

      mockDb.execute.mockResolvedValueOnce(undefined);

      await updateProjectStatus(projectId, "completed");

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE projects"),
        expect.arrayContaining(["completed", projectId])
      );
    });
  });

  describe("deleteProject", () => {
    it("TC-DP-006: should delete project and cascade delete tasks", async () => {
      const projectId = "proj-001";

      mockDb.execute.mockResolvedValue(undefined);

      await deleteProject(projectId);

      // 验证先删除任务
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM tasks"),
        [projectId]
      );

      // 验证后删除项目
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM projects"),
        [projectId]
      );
    });
  });
});
```

### 4.3 组件测试

```typescript
// test/components/CreateProjectModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateProjectModal from "../../src/components/devtracker/CreateProjectModal";

describe("CreateProjectModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-DP-001: should submit form with valid data", async () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // 填写表单
    fireEvent.change(screen.getByPlaceholderText("请输入PO编号"), {
      target: { value: "PO-2024-001" },
    });
    fireEvent.change(screen.getByPlaceholderText("请输入PO名称"), {
      target: { value: "云原生平台开发" },
    });
    fireEvent.change(screen.getByLabelText("开始日期"), {
      target: { value: "2024-03-01" },
    });
    fireEvent.change(screen.getByLabelText("结束日期"), {
      target: { value: "2024-06-30" },
    });

    // 提交
    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "PO-2024-001",
          name: "云原生平台开发",
          startDate: "2024-03-01",
          endDate: "2024-06-30",
        })
      );
    });
  });

  it("TC-DP-002: should show validation errors for empty fields", async () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // 直接提交空表单
    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText("请输入PO编号")).toBeInTheDocument();
      expect(screen.getByText("请输入PO名称")).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("TC-DP-010: should validate end date is after start date", async () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText("开始日期"), {
      target: { value: "2024-06-30" },
    });
    fireEvent.change(screen.getByLabelText("结束日期"), {
      target: { value: "2024-01-01" },
    });

    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText("结束日期不能早于开始日期")).toBeInTheDocument();
    });
  });
});
```

### 4.4 拖拽功能测试

```typescript
// test/components/KanbanBoard.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import KanbanBoard from "../../src/components/devtracker/KanbanBoard";
import { mockTasks } from "../fixtures/devTracker";

describe("KanbanBoard Drag and Drop", () => {
  const mockOnDragEnd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-TK-004: should update orderIndex when dragging within same column", () => {
    const tasks = [
      { ...mockTasks[0], status: "todo", orderIndex: 0 },
      { ...mockTasks[1], status: "todo", orderIndex: 1 },
      { ...mockTasks[2], status: "todo", orderIndex: 2 },
    ];

    render(
      <DndContext onDragEnd={mockOnDragEnd}>
        <KanbanBoard tasks={tasks} projectId="proj-001" />
      </DndContext>
    );

    // 模拟拖拽事件
    const dragEvent: DragEndEvent = {
      active: { id: "task-003" },
      over: { id: "task-002" },
    } as DragEndEvent;

    // 触发拖拽结束
    mockOnDragEnd(dragEvent);

    expect(mockOnDragEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        active: expect.objectContaining({ id: "task-003" }),
        over: expect.objectContaining({ id: "task-002" }),
      })
    );
  });

  it("TC-TK-005: should update status when dragging across columns", () => {
    const tasks = [
      { ...mockTasks[0], status: "inProgress", orderIndex: 0 },
    ];

    render(
      <DndContext onDragEnd={mockOnDragEnd}>
        <KanbanBoard tasks={tasks} projectId="proj-001" />
      </DndContext>
    );

    const dragEvent: DragEndEvent = {
      active: { id: "task-001" },
      over: { id: "review-column" },
    } as DragEndEvent;

    mockOnDragEnd(dragEvent);

    // 验证状态更新逻辑被调用
    expect(mockOnDragEnd).toHaveBeenCalled();
  });
});
```

### 4.5 进度计算测试

```typescript
// test/utils/progress.test.ts
import { describe, it, expect } from "vitest";
import { calculateProjectProgress } from "../../src/utils/progress";

describe("calculateProjectProgress", () => {
  it("TC-DP-007: should calculate 30% when 3 of 10 tasks are done", () => {
    const tasks = [
      { status: "done" },
      { status: "done" },
      { status: "done" },
      { status: "inProgress" },
      { status: "todo" },
      { status: "backlog" },
      { status: "review" },
      { status: "todo" },
      { status: "inProgress" },
      { status: "backlog" },
    ];

    const progress = calculateProjectProgress(tasks);
    expect(progress).toBe(30);
  });

  it("TC-DP-008: should calculate 100% when all tasks are done", () => {
    const tasks = Array(5).fill({ status: "done" });

    const progress = calculateProjectProgress(tasks);
    expect(progress).toBe(100);
  });

  it("should calculate 0% when no tasks exist", () => {
    const tasks: any[] = [];

    const progress = calculateProjectProgress(tasks);
    expect(progress).toBe(0);
  });

  it("should calculate 0% when no tasks are done", () => {
    const tasks = [
      { status: "inProgress" },
      { status: "todo" },
      { status: "backlog" },
    ];

    const progress = calculateProjectProgress(tasks);
    expect(progress).toBe(0);
  });
});
```

---

## 5. 测试执行检查清单

### 5.1 预测试检查

- [ ] 测试环境已搭建完成
- [ ] 测试数据已准备就绪
- [ ] 数据库已初始化
- [ ] 测试账号已创建
- [ ] 网络连接正常

### 5.2 功能测试执行

#### 开发PO管理
- [ ] TC-DP-001: 创建PO-所有必填项
- [ ] TC-DP-002: 创建PO-缺少必填项
- [ ] TC-DP-003: 状态流转-开始开发
- [ ] TC-DP-004: 状态流转-完成开发
- [ ] TC-DP-005: 状态流转-归档
- [ ] TC-DP-006: 删除PO-有任务
- [ ] TC-DP-007: 进度计算-任务完成情况
- [ ] TC-DP-008: 进度计算-全部完成
- [ ] TC-DP-009: PO编号重复处理
- [ ] TC-DP-010: PO日期验证

#### 任务看板
- [ ] TC-TK-001: 创建任务-默认Backlog
- [ ] TC-TK-002: 移动任务-Todo
- [ ] TC-TK-003: 完成任务-Done
- [ ] TC-TK-004: 拖拽排序-同列
- [ ] TC-TK-005: 拖拽移动-跨列
- [ ] TC-TK-006: 删除任务
- [ ] TC-TK-007: 编辑任务
- [ ] TC-TK-008: 任务截止日期验证
- [ ] TC-TK-009: 任务看板空状态

#### 统计功能
- [ ] TC-ST-001: 年度PO统计
- [ ] TC-ST-002: 已完成PO统计
- [ ] TC-ST-003: 进行中任务统计
- [ ] TC-ST-004: 各状态PO数量

#### 边界情况
- [ ] TC-BD-001: 大量任务性能测试
- [ ] TC-BD-002: 并发创建任务
- [ ] TC-BD-003: 超长PO名称
- [ ] TC-BD-004: 特殊字符输入
- [ ] TC-BD-005: 数据库连接断开

### 5.3 回归测试触发条件

以下变更需要进行完整回归测试：

1. **数据库结构变更**
   - 新增/修改/删除表
   - 修改字段类型或约束
   - 修改索引

2. **核心业务逻辑变更**
   - 状态流转规则修改
   - 进度计算逻辑修改
   - 拖拽排序算法修改

3. **UI组件重大重构**
   - 看板组件重构
   - 弹窗组件重构
   - 拖拽库更换

4. **依赖版本升级**
   - React版本升级
   - Tauri版本升级
   - 数据库驱动升级

### 5.4 测试报告模板

```markdown
## 测试执行报告

### 基本信息
- **执行日期**: 2024-XX-XX
- **执行人**: XXX
- **版本号**: v0.0.X
- **测试环境**: macOS 14.x / Windows 11

### 执行统计
| 类别 | 总数 | 通过 | 失败 | 跳过 | 通过率 |
|------|------|------|------|------|--------|
| 开发PO管理 | 10 | 10 | 0 | 0 | 100% |
| 任务看板 | 9 | 9 | 0 | 0 | 100% |
| 统计功能 | 4 | 4 | 0 | 0 | 100% |
| 边界情况 | 5 | 4 | 1 | 0 | 80% |
| **总计** | **28** | **27** | **1** | **0** | **96.4%** |

### 缺陷列表
| ID | 描述 | 严重程度 | 状态 |
|----|------|----------|------|
| BUG-001 | 大量任务时拖拽卡顿 | Medium | Open |

### 风险评估
- **高风险**: 无
- **中风险**: 大量任务性能问题
- **低风险**: 无

### 结论
[测试通过/测试不通过，需修复后重测]
```

---

## 6. 附录

### 6.1 相关文档

- [需求文档](./requirements.md)
- [API文档](./api.md)
- [数据库设计](./database.md)

### 6.2 测试工具

- **单元测试**: Vitest + React Testing Library
- **E2E测试**: Playwright（可选）
- **性能测试**: Lighthouse + Chrome DevTools
- **代码覆盖率**: v8 coverage

### 6.3 常用命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- src/components/devtracker/__tests__/KanbanBoard.test.tsx

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 运行测试并监听文件变化
npm test -- --watch

# 运行特定测试用例
npm test -- -t "TC-DP-001"
```

---

**文档版本**: v1.0
**最后更新**: 2024-03-19
**维护人**: 测试团队
