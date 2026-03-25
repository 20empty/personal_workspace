# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Classroom is an offline-first desktop application for training delivery management. It helps trainers manage class lifecycles, SOP execution, course scheduling, and delivery reviews in a single local app.

Tech stack: Tauri v2, React 18 + Vite, TypeScript, Tailwind CSS, Framer Motion, SQLite via Drizzle ORM.

## 交互规范
- **语言偏好**：请始终使用 **中文** 与我交流、解释代码逻辑和输出状态。
- **回复风格**：简洁、专业，直接给出解决方案。
- **注释要求**：代码中的新增注释请使用中文。

## Commands

```bash
npm run dev       # Start web UI dev server (http://localhost:5173)
npm run build     # Build web frontend (outputs to dist/)
npm run tauri:dev # Run desktop app in dev mode
npm run tauri:build # Build production desktop bundle

npx vitest              # Run all tests (watch mode)
npx vitest run          # Run all tests once
npx vitest run test/components/CourseList.test.tsx  # Run single test file
```

## Architecture

### Two Feature Domains

- **Delivery** (`src/pages/DeliveryManager`, `src/pages/ClassDetail`): Class lifecycle, SOP tasks, course scheduling, PO tracking.
- **DevTracker** (`src/pages/DevTracker`): Project and task kanban for development work.

### Data Layer

- **SQLite** via `@tauri-apps/plugin-sql` — database file: `src-tauri/classroom.db`
- **Drizzle ORM** schemas in `src/db/schema.ts` — tables: `delivery_classes`, `delivery_courses`, `delivery_sop_tasks`, `course_templates`, `dev_projects`, `dev_tasks`
- Data access functions live in `src/db/delivery.ts` and `src/db/devtracker.ts`
- SQL migrations in `src-tauri/migrations/` (numbered `0001_*.sql`, `0002_*.sql`)

### UI Conventions

- **Dark glassy theme** with CSS variables: `--panel`, `--panel-strong`, `--border`, `--accent`, `--muted`, `--text`
- **Panel style**: `rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 shadow-lg shadow-black/10`
- Animations via **Framer Motion** `motion` components
- No separate button component — buttons use inline styles matching the theme

### Routing

`src/App.tsx` — React Router v6 with `MainLayout` wrapper:
- `/` and `/dashboard` → Dashboard
- `/delivery` → DeliveryManager
- `/delivery/:classId` → ClassDetail
- `/dev` → DevTracker
- `/settings` → Settings

### Tauri Plugins in Use

- `@tauri-apps/plugin-sql` — SQLite database
- `@tauri-apps/plugin-dialog` — file save dialogs (used for course schedule export)
- `@tauri-apps/plugin-fs` — file system access (schedule files)
- `@tauri-apps/plugin-shell` — shell commands
- `@tauri-apps/plugin-opener` — open URLs externally

## Testing

Tests live in `test/` matching the src structure. Vitest runs with jsdom. The test setup (`test/setup.ts`) mocks Tauri SQL plugin, `crypto.randomUUID`, `IntersectionObserver`, `ResizeObserver`, and `matchMedia`. Test factories and fixtures are in `test/factories/` and `test/fixtures/`.
