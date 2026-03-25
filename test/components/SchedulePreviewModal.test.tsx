import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SchedulePreviewModal from "@/components/delivery/SchedulePreviewModal";

describe("SchedulePreviewModal", () => {
  it("renders the audit-style workbook layout", () => {
    render(
      <SchedulePreviewModal
        open
        title="云原生架构"
        fileName="schedule.xlsx"
        fileType="xlsx"
        previewContent={{
          type: "excel",
          workbook: {
            sheetNames: ["Day1", "Day2"],
            sheets: {
              Day1: { name: "Day1", rows: [[{ value: "时间" }, { value: "主题" }], [{ value: "09:00" }, { value: "开场" }]], columnWidths: [], rowHeights: [], mergedCells: [] },
              Day2: { name: "Day2", rows: [[{ value: "时间" }, { value: "主题" }], [{ value: "09:00" }, { value: "复盘" }]], columnWidths: [], rowHeights: [], mergedCells: [] },
            },
          },
        }}
        loading={false}
        onClose={() => undefined}
        onDownload={vi.fn()}
      />
    );

    expect(screen.getByText("课表审阅")).toBeInTheDocument();
    expect(screen.getByText("文件概要")).toBeInTheDocument();
    expect(screen.getByText("工作表")).toBeInTheDocument();
    expect(screen.getByText("当前工作表")).toBeInTheDocument();
    // Day1 出现在工作表切换按钮、当前工作表标签等多个位置
    expect(screen.getAllByText("Day1").length).toBeGreaterThanOrEqual(2);
    // 验证表格内容
    expect(screen.getByText("时间")).toBeInTheDocument();
    expect(screen.getByText("开场")).toBeInTheDocument();
  });

  it("renders pdf and error states", () => {
    const { rerender } = render(
      <SchedulePreviewModal
        open
        title="云原生架构"
        fileName="schedule.pdf"
        fileType="pdf"
        previewContent={{
          type: "pdf",
          url: "blob:test",
        }}
        loading={false}
        onClose={() => undefined}
        onDownload={vi.fn()}
      />
    );

    // PDF 渲染器使用 canvas，不使用 iframe title
    expect(screen.getByText("云原生架构")).toBeInTheDocument();

    rerender(
      <SchedulePreviewModal
        open
        title="云原生架构"
        fileName="schedule.pdf"
        fileType="pdf"
        previewContent={{
          type: "error",
          message: "课表预览失败",
        }}
        loading={false}
        onClose={() => undefined}
        onDownload={vi.fn()}
      />
    );

    expect(screen.getByText("课表预览失败")).toBeInTheDocument();
  });
});
