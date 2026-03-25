import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi, beforeAll } from "vitest";

// 模拟 crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: () => `mock-uuid-${Math.random().toString(36).substring(2, 9)}`,
  },
});

// 模拟 Tauri API
vi.mock("@tauri-apps/plugin-sql", () => ({
  default: {
    load: vi.fn(() =>
      Promise.resolve({
        execute: vi.fn(),
        select: vi.fn(),
      })
    ),
  },
}));

// 模拟 window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模拟 IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

// 模拟 ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: MockResizeObserver,
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

// 清理 after each test
afterEach(() => {
  cleanup();
});

// 全局测试前置
beforeAll(() => {
  // 设置测试时区
  process.env.TZ = "Asia/Shanghai";
});
