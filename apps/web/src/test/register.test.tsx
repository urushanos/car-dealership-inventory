import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Register from "../pages/Register";
import { registerUser } from "../lib/api";

vi.mock("../lib/api", () => ({
  registerUser: vi.fn(),
}));

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route
          path="/login"
          element={<h1>Login destination</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("Registration page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the required registration fields", () => {
    renderRegister();

    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" }))
      .toBeInTheDocument();
  });

  it("registers a new user and navigates to login", async () => {
    const user = userEvent.setup();
    vi.mocked(registerUser).mockResolvedValue({
      message: "Registration successful",
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        role: "user",
      },
    });

    renderRegister();

    await user.type(screen.getByLabelText("Full name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123");
    await user.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });
    });

    expect(await screen.findByText("Login destination"))
      .toBeInTheDocument();
  });

  it("shows an error when registration fails", async () => {
    const user = userEvent.setup();

    vi.mocked(registerUser).mockRejectedValue(
      new Error("Email is already registered")
    );

    renderRegister();

    await user.type(screen.getByLabelText("Full name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Email is already registered"))
      .toBeInTheDocument();
  });

  it("requires all fields and enforces a minimum password length", () => {
    renderRegister();

    expect(screen.getByLabelText("Full name")).toBeRequired();
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByLabelText("Password")).toHaveAttribute("minLength", "6");
  });

  it("disables registration while the request is pending", async () => {
    const user = userEvent.setup();

    let resolveRegistration!: (value: {
      message: string;
      user: {
        id: string;
        name: string;
        email: string;
        role: "user";
      };
    }) => void;

    vi.mocked(registerUser).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegistration = resolve;
        })
    );

    renderRegister();

    await user.type(screen.getByLabelText("Full name"), "Test User");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(
      await screen.findByRole("button", { name: "Creating account..." })
    ).toBeDisabled();

    resolveRegistration({
      message: "Success",
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        role: "user",
      },
    });
  });
});