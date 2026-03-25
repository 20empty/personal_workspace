import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateClassModal from "@/components/delivery/CreateClassModal";

describe("CreateClassModal", () => {
  const onSubmit = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    onSubmit.mockClear();
  });

  async function fillRequiredFields() {
    fireEvent.change(screen.getByLabelText("班级名称"), { target: { value: "归档班级" } });
    fireEvent.change(screen.getByLabelText("班级编号"), { target: { value: "ARCH-001" } });
    fireEvent.change(screen.getByLabelText("交付地点"), { target: { value: "培训中心" } });
    const dateInputs = Array.from(document.querySelectorAll("input[type='date']"));
    fireEvent.change(dateInputs[0], { target: { value: "2020-01-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2020-01-03" } });
  }

  it("marks completeSop when user directly archives an expired class", async () => {
    render(<CreateClassModal onClose={() => undefined} onSubmit={onSubmit} />);

    await fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    fireEvent.click(await screen.findByRole("button", { name: "直接归档" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: "completed",
          archiveState: "已归档",
          progress: 100,
          status: "已交付",
        }),
        { completeSop: true }
      );
    });
  });

  it("keeps completeSop disabled when user only saves an expired class", async () => {
    render(<CreateClassModal onClose={() => undefined} onSubmit={onSubmit} />);

    await fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    fireEvent.click(await screen.findByRole("button", { name: "仅保存" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: "upcoming",
          archiveState: "待归档",
          progress: 0,
        }),
        { completeSop: false }
      );
    });
  });
});
