import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DeleteDeliverableModal from "@/components/devtracker/DeleteDeliverableModal";

describe("DeleteDeliverableModal", () => {
  it("does not confirm deletion when user clicks cancel", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteDeliverableModal
        title="课程 PPT"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms deletion only when user clicks confirm", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteDeliverableModal
        title="课程 PPT"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /确认删除/ }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
