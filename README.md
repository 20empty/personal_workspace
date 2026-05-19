# Classroom

> Offline-first desktop workspace for delivery-focused trainers and course builders.  
> 面向培训交付与课程开发场景的本地优先桌面工作台。

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white)](https://tauri.app/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

**Quick Links**: [Highlights](#highlights) · [Screenshots](#screenshots) · [Quick Start](#quick-start) · [Release & Auto Update](#release--auto-update)

Classroom 是一个基于 Tauri v2 构建的桌面应用，围绕「培训交付」与「课件开发」两条主线，把班级管理、SOP 执行、课程库、课表预览、开发看板和数据总览整合到一个本地应用中。

它适合这样的工作流：
- 你需要长期管理培训班级，从排期、进行中到归档都希望有统一视图
- 你希望 SOP 任务能随着班级自动生成，而不是靠手工记忆
- 你既做培训交付，也在持续维护课程资料、实验手册、PPT 或版本迭代
- 你希望核心数据保存在本地，可离线使用，不依赖在线系统

![Classroom Demo Recording](./assets/demo.webp)

## Highlights

- **Offline-first**: 核心数据保存在本地 SQLite，断网也能继续工作
- **Delivery-centric**: 围绕班级生命周期设计，不是通用项目管理工具的硬套壳
- **SOP-driven**: 支持按班级类型维护标准 SOP，并在创建班级时自动落地任务
- **Built for course operations**: 同时覆盖培训交付、课程资料维护与版本推进
- **Desktop-native**: 基于 Tauri，启动快、体积轻、资源占用低
- **In-app updater**: 支持通过 GitHub Releases 做桌面端应用内更新

## Screenshots

### Dashboard

![Dashboard](./assets/dashboard.png)

### Delivery Manager

![Delivery Manager](./assets/delivery.png)

### Settings & Updater

![Settings](./assets/settings.png)

## Workflow Fit

- 适合讲师、交付经理、课程负责人长期维护自己的本地工作台
- 适合把班级交付和课件开发放在同一个系统里统一跟进
- 适合对数据隐私和离线可用性有要求的小团队或个人
- 不追求复杂的多人 SaaS 协作，更强调个人桌面端效率

## Core Modules

### Delivery Manager
- 班级按阶段管理：待开始、进行中、已完成、待归档
- 课程库复用标准课程信息，减少重复录入
- 创建班级时自动生成 SOP 任务清单
- 支持讲师复盘记录、交付状态推进和归档整理

### Course Library & Schedule Management
- 维护标准课程名称、级别和课时信息
- 托管课程课表附件，避免外部路径失效
- 支持导出课表副本，方便分发和归档
- 统一预览入口，减少“文件在，但打不开”的情况

### Preview Engine
- Excel (`.xlsx`, `.xls`) 直接渲染，无需 Office
- Numbers 文件可托管并生成稳定预览
- PDF 与图片统一查看
- 重点是“可在桌面端稳定预览”，而不是依赖外部应用

### Dev Tracker
- 用项目 + 看板的方式管理课程开发和交付物迭代
- 支持从待处理到开发中、评审中、已交付的阶段推进
- 适合管理 PPT、实验手册、讲义、版本更新等长期任务

### Dashboard
- 聚合查看交付分布、课程级别、学员数量与城市覆盖
- 从班级视角回看年度/季度交付情况
- 让讲师或交付负责人快速看到当前工作负载

### Settings
- 配置不同班级类型的 SOP 模版
- 管理标准课程库
- 提供桌面端应用更新检查与安装入口

## Tech Stack

- **Desktop Shell**: Tauri v2
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Database**: SQLite + Drizzle ORM
- **Tauri Plugins**:
  - `@tauri-apps/plugin-sql`
  - `@tauri-apps/plugin-dialog`
  - `@tauri-apps/plugin-fs`
  - `@tauri-apps/plugin-opener`
  - `@tauri-apps/plugin-updater`

## Quick Start

### Requirements

- Node.js 18+
- Rust stable
- macOS or Windows
- Windows 开发环境需要 WebView2 与常见 C++ Build Tools

### Install

```bash
npm install
```

### Run In Dev Mode

```bash
npm run tauri:dev
```

### Build Desktop App

```bash
npm run tauri:build
```

### Common Scripts

```bash
npm run dev
npm run build
npm run tauri:dev
npm run tauri:build
```

## Local Data

- 本地数据库默认使用 SQLite
- 课表等附件会托管到应用自己的数据目录，而不是长期依赖外部原始路径
- 这是一个本地优先应用，请自行规划备份策略

## Release & Auto Update

项目已经接入 GitHub Actions + GitHub Releases 的桌面端发布流程，并支持应用内自动更新。

- Release workflow: [.github/workflows/release-binaries.yml](.github/workflows/release-binaries.yml)
- Signing guide: [docs/release-signing.md](docs/release-signing.md)
- Latest releases: [GitHub Releases](https://github.com/20empty/personal_workspace/releases)

发布时需要保证：
- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

这三处版本一致，并和 Git tag 对齐，例如：
- app version: `1.3.0`
- git tag: `v1.3.0`

## Roadmap

- [x] 交付管理主流程
- [x] 课程库与课表托管
- [x] Dev Tracker 看板
- [x] 应用内自动更新
- [x] 日常工作台与风险提醒
- [ ] 交付总结导出
- [ ] 数据导入导出
- [ ] 更完整的发布说明与截图文档

## Notes

- 当前仓库以桌面端体验为主，不提供 Web 部署形态
- 自动更新依赖 GitHub Releases 与 updater 签名配置
- 如果你在 Windows 上本地开发，请优先确认 WebView2 和构建工具链已安装

## License

MIT
