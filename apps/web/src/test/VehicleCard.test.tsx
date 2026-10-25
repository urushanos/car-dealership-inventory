import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VehicleCard from "../components/VehicleCard";
import { purchaseVehicle } from "../lib/api";
import type { Vehicle } from "../types/vehicle";

vi.mock("../lib/api", () => ({
  purchaseVehicle: vi.fn(),
}));

const vehicle: Vehicle = {
  id: "vehicle-1",
  make: "Toyota",
  model: "Camry",
  category: "Sedan",
  price: 2500000,
  quantity: 3,
  year: 2024,
};

describe("VehicleCard", () => {
  const onPurchased = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays vehicle details and price", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        token="test-token"
        onPurchased={onPurchased}
      />
    );

    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText(/Sedan/)).toBeInTheDocument();
    expect(screen.getByText(/25,00,000/)).toBeInTheDocument();
    expect(screen.getByText("3 in stock")).toBeInTheDocument();
  });

  it("disables purchase when quantity is zero", () => {
    render(
      <VehicleCard
        vehicle={{ ...vehicle, quantity: 0 }}
        token="test-token"
        onPurchased={onPurchased}
      />
    );

    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Purchase" }))
      .toBeDisabled();
  });

  it("allows purchase when stock is available", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        token="test-token"
        onPurchased={onPurchased}
      />
    );

    expect(screen.getByRole("button", { name: "Purchase" }))
      .toBeEnabled();
  });

  it("purchases a vehicle and calls onPurchased", async () => {
    const user = userEvent.setup();
    const updatedVehicle = { ...vehicle, quantity: 2 };

    vi.mocked(purchaseVehicle).mockResolvedValue(updatedVehicle);

    render(
      <VehicleCard
        vehicle={vehicle}
        token="test-token"
        onPurchased={onPurchased}
      />
    );

    await user.click(screen.getByRole("button", { name: "Purchase" }));

    await waitFor(() => {
      expect(purchaseVehicle).toHaveBeenCalledWith(
        "test-token",
        "vehicle-1"
      );
      expect(onPurchased).toHaveBeenCalledWith(updatedVehicle);
    });
  });

  it("displays an error when purchase fails", async () => {
    const user = userEvent.setup();

    vi.mocked(purchaseVehicle).mockRejectedValue(
      new Error("Insufficient stock")
    );

    render(
      <VehicleCard
        vehicle={vehicle}
        token="test-token"
        onPurchased={onPurchased}
      />
    );

    await user.click(screen.getByRole("button", { name: "Purchase" }));

    expect(await screen.findByText("Insufficient stock"))
      .toBeInTheDocument();

    expect(onPurchased).not.toHaveBeenCalled();
  });

  it("does not call the API when the vehicle is out of stock", async () => {
    const user = userEvent.setup();

    render(
      <VehicleCard
        vehicle={{ ...vehicle, quantity: 0 }}
        token="test-token"
        onPurchased={onPurchased}
      />
    );

    await user.click(screen.getByRole("button", { name: "Purchase" }));

    expect(purchaseVehicle).not.toHaveBeenCalled();
  });
});