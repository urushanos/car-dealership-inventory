import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VehicleFilters, {
  toFilters,
} from "../components/VehicleFilters";

const initialValue = {
  make: "",
  model: "",
  category: "",
  minPrice: "",
  maxPrice: "",
};

describe("VehicleFilters", () => {
  it("renders all search and filter controls", () => {
    render(
      <VehicleFilters
        value={initialValue}
        onChange={vi.fn()}
        onApply={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText("Make")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Model")).toBeInTheDocument();
    expect(screen.getByText("All categories")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Min price (INR)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max price (INR)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /apply filters/i })
    ).toBeInTheDocument();
  });

  it("calls onChange when make is entered", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <VehicleFilters
        value={initialValue}
        onChange={onChange}
        onApply={vi.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText("Make"), "Toyota");

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith({
      ...initialValue,
      make: "a",
    });
  });

  it("calls onChange when a category is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <VehicleFilters
        value={initialValue}
        onChange={onChange}
        onApply={vi.fn()}
      />
    );

    await user.selectOptions(
      screen.getByRole("combobox"),
      "SUV"
    );

    expect(onChange).toHaveBeenCalledWith({
      ...initialValue,
      category: "SUV",
    });
  });

  it("applies the selected filters", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    const value = {
      make: "Toyota",
      model: "Camry",
      category: "Sedan",
      minPrice: "1000000",
      maxPrice: "3000000",
    };

    render(
      <VehicleFilters
        value={value}
        onChange={vi.fn()}
        onApply={onApply}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /apply filters/i })
    );

    expect(onApply).toHaveBeenCalledWith({
      make: "Toyota",
      model: "Camry",
      category: "Sedan",
      minPrice: 1000000,
      maxPrice: 3000000,
    });
  });

  it("trims whitespace and converts empty filters to undefined", () => {
    expect(
      toFilters({
        make: "  Toyota  ",
        model: " ",
        category: "",
        minPrice: "",
        maxPrice: "2000000",
      })
    ).toEqual({
      make: "Toyota",
      model: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: 2000000,
    });
  });

  it("converts price boundaries to numbers", () => {
    expect(
      toFilters({
        make: "",
        model: "",
        category: "",
        minPrice: "0",
        maxPrice: "5000000",
      })
    ).toEqual({
      make: undefined,
      model: undefined,
      category: undefined,
      minPrice: 0,
      maxPrice: 5000000,
    });
  });
});