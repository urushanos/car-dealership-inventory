import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "../components/ConfirmDialog";

describe("ConfirmDialog", () => {
  const props = {
    open: true,
    title: "Delete vehicle",
    message: "Are you sure you want to delete this vehicle?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders the dialog when open", () => {
    render(<ConfirmDialog {...props} />);

    expect(screen.getByText("Delete vehicle")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete this vehicle?")
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ConfirmDialog {...props} open={false} />);

    expect(screen.queryByText("Delete vehicle")).not.toBeInTheDocument();
  });

  it("calls onConfirm when confirmed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<ConfirmDialog {...props} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancelled", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ConfirmDialog {...props} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables confirmation while loading", () => {
    render(<ConfirmDialog {...props} loading={true} />);

    expect(screen.getByRole("button", { name: "Working..." }))
      .toBeDisabled();
  });

  it("supports a custom confirmation label", () => {
    render(
      <ConfirmDialog {...props} confirmLabel="Confirm purchase" />
    );

    expect(
      screen.getByRole("button", { name: "Confirm purchase" })
    ).toBeInTheDocument();
  });
});