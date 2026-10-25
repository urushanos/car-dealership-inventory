import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VehicleForm from "../components/VehicleForm";
import type { Vehicle } from "../types/vehicle";

describe("VehicleForm", () => {
  const defaultProps = {
    submitting: false,
    error: "",
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders the add vehicle form", () => {
    render(<VehicleForm {...defaultProps} />);

    expect(screen.getByLabelText("Make")).toBeInTheDocument();
    expect(screen.getByLabelText("Model")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Price (INR)")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add vehicle" }))
      .toBeInTheDocument();
  });

  it("submits a new vehicle with numeric price and quantity", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <VehicleForm
        {...defaultProps}
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText("Make"), "Toyota");
    await user.type(screen.getByLabelText("Model"), "Camry");
    await user.clear(screen.getByLabelText("Price (INR)"));
    await user.type(screen.getByLabelText("Price (INR)"), "2500000");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "5");

    await user.click(screen.getByRole("button", { name: "Add vehicle" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        make: "Toyota",
        model: "Camry",
        category: "Sedan",
        price: 2500000,
        quantity: 5,
        year: new Date().getFullYear(),
      })
    );
  });

  it("trims whitespace from vehicle fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <VehicleForm {...defaultProps} onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText("Make"), "  Honda  ");
    await user.type(screen.getByLabelText("Model"), "  City  ");
    await user.type(screen.getByLabelText("Price (INR)"), "1200000");

    await user.click(screen.getByRole("button", { name: "Add vehicle" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        make: "Honda",
        model: "City",
        price: 1200000,
      })
    );
  });

  it("includes VIN when provided", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <VehicleForm {...defaultProps} onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText("Make"), "Honda");
    await user.type(screen.getByLabelText("Model"), "City");
    await user.type(screen.getByLabelText("Price (INR)"), "1200000");
    await user.type(screen.getByLabelText("VIN (optional)"), "TESTVIN123");

    await user.click(screen.getByRole("button", { name: "Add vehicle" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ vin: "TESTVIN123" })
    );
  });

  it("prefills the form when editing a vehicle", () => {
    const vehicle: Vehicle = {
      id: "vehicle-1",
      make: "Honda",
      model: "City",
      category: "Sedan",
      price: 1200000,
      quantity: 4,
      year: 2023,
      vin: "TESTVIN123",
    };

    render(
      <VehicleForm {...defaultProps} initial={vehicle} />
    );

    expect(screen.getByLabelText("Make")).toHaveValue("Honda");
    expect(screen.getByLabelText("Model")).toHaveValue("City");
    expect(screen.getByLabelText("Price (INR)")).toHaveValue(1200000);
    expect(screen.getByLabelText("Quantity")).toHaveValue(4);
    expect(screen.getByLabelText("Year")).toHaveValue(2023);
    expect(screen.getByLabelText("VIN (optional)")).toHaveValue("TESTVIN123");

    expect(screen.getByRole("button", { name: "Save changes" }))
      .toBeInTheDocument();
  });

  it("does not submit when required fields are empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <VehicleForm {...defaultProps} onSubmit={onSubmit} />
    );

    await user.click(screen.getByRole("button", { name: "Add vehicle" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows API or submission errors", () => {
    render(
      <VehicleForm
        {...defaultProps}
        error="Unable to save vehicle"
      />
    );

    expect(screen.getByText("Unable to save vehicle"))
      .toBeInTheDocument();
  });

  it("disables submission while saving", () => {
    render(
      <VehicleForm {...defaultProps} submitting={true} />
    );

    expect(screen.getByRole("button", { name: "Saving..." }))
      .toBeDisabled();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <VehicleForm {...defaultProps} onCancel={onCancel} />
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});