# Classroom

> Offline-first desktop workspace for delivery-focused trainers.
> 面向讲师与交付管理的本地优先桌面工作台。

Classroom 聚焦「培训交付」与「内容开发」双主线，把班级生命周期管理、SOP 执行、课程安排、讲师复盘、课件开发看板和数据概览集中到一个本地应用中，减少手工跟进与信息分散。

![Classroom Demo Recording](./assets/demo.webp)

## Highlights

- **Offline-first**: 核心数据保存在本地 SQLite，无网可用，隐私安全。
- **Delivery-centric**: 围绕班级从排期、进行中到归档的完整生命周期管理。
- **Dev-ready (Course Builder)**: 内置课件开发工作台，支持项目看板管理交付物。
- **Advanced Preview**: 统一课表预览引擎，支持 Excel (.xlsx) 与 Numbers 的跨平台稳定预览。
- **SOP-driven**: 支持按班级类型配置 SOP 模版并自动生成任务，规范交付流程。
- **Desktop Experience**: 基于 Tauri v2，极致轻量，启动快、资源占用低。

## Core Features

### 1. Delivery Manager (交付管理)
- **班级流转**: Upcoming -> Active -> Completed 状态自动化管理。
- **课程库集成**: 支持从标准课程库一键导入课程（含时长、级别 L2/L3/L4 等信息）。
- **SOP 任务**: 随班级创建自动生成的任务清单，实时统计交付进度。
- **课表管理**: 支持托管课表文件，一键预览或导出副本。
- **讲师复盘**: 结构化记录交付反馈，支持 MD 格式。

### 2. Dev Tracker (课件开发)
- **开发总览**: 统计所有开发项目中的任务状态分布。
- **项目列表**: 集中管理各种课件开发项目（如：新课开发、迭代更新）。
- **任务看板**: 拖拽式看板管理开发阶段（待处理、开发中、评审中、已交付）。

### 3. Dashboard (数据总览)
- **多维统计**: 年度/季度 PO 汇总、交付课程级别分布（L2/L3/L4）。
- **地理分布**: 自动统计海外与国内交付城市覆盖情况。
- **业务分布**: 班级类型（海外/国内/集中/线上）与学员数量分布。
- **实时行程**: 自动识别当前正在交付的地点与课程任务。

### 4. Preview Engine (预览引擎)
| 格式 | 预览方案 | 特色 |
|------|------|------|
| **Excel (.xlsx/.xls)** | exceljs 渲染 | 保持单元格格式与样式，无需安装 Office |
| **Numbers** | 自动转换渲染 | macOS 风格原生支持，导出预览图 |
| **PDF** | pdfjs-dist | 矢量清晰预览，支持多页/缩放 |
| **图片** | 原生渲染 | 支持常见图片格式的一体化查看 |

### 5. Settings (配置中心)
- **SOP 模版**: 自定义「训前/训中/训后」标准动作，支持排序与实时生效。
- **课程库管理**: 维护标准课程字典，支持设置课程级别及托管原始课表。

## Tech Stack

- **Framework**: Tauri v2
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Framer Motion (Dark Glassy Theme)
- **Database**: SQLite via **Drizzle ORM**
- **Plugins**: `@tauri-apps/plugin-sql`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`

## Quick Start

### 1) Prerequisites
- **Node.js**: v18+
- **Rust**: Latest stable version
- **System**: macOS (Best supported) or Windows (WebView2 & C++ Build Tools required)

### 2) Install
```bash
npm install
```

### 3) Run Desktop (Dev Mode)
```bash
npm run tauri:dev
```

### 4) Build
```bash
npm run tauri:build
```

## Data & Storage

- **Local DB file**: `src-tauri/classroom.db`
- **Managed Schedules**: 课表文件及其预览副本托管在应用专用的数据目录中。
- 数据以本地文件形式持久化，请自行做好备份策略。

## Roadmap

- [x] Dev Tracker 核心功能 (Dashboard, Kanban)
- [x] 课程库标准管理功能
- [x] Numbers 文件稳定预览方案
- [ ] 导出班级交付总结报告 (PDF/Excel)
- [ ] 讲师日历集成（系统日历同步）
- [ ] 数据云同步/导入导出（Zip 格式）

## Production Release

- **Signed Release**: `.github/workflows/release-binaries.yml`
- **Guide**: [Release Signing](docs/release-signing.md) / [Unsigned Beta](docs/unsigned-beta.md)

## License

MIT © 2024-2026 Classroom Team.
