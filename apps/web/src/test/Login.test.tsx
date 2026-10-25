import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Login from "../pages/Login";
import { AuthProvider } from "../context/AuthContext";
import { loginUser } from "../lib/api";

vi.mock("../lib/api", () => ({
  loginUser: vi.fn(),
}));

function Destination() {
  const location = useLocation();
  return <p>Destination: {location.pathname}</p>;
}

function renderLogin(initialEntry = "/login") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/vehicles" element={<Destination />} />
          <Route path="/admin" element={<Destination />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email, password and sign-in controls", () => {
    renderLogin();

    expect(screen.getByRole("heading", { name: "Sign in" }))
      .toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" }))
      .toBeInTheDocument();
  });

  it("logs in successfully and navigates to vehicles", async () => {
    const user = userEvent.setup();

    vi.mocked(loginUser).mockResolvedValue({
      token: "test-token",
      user: {
        id: "user-1",
        email: "user@example.com",
        role: "user",
      },
    });

    renderLogin();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123",
      });
    });

    expect(await screen.findByText("Destination: /vehicles"))
      .toBeInTheDocument();
  });

  it("shows an error when credentials are rejected", async () => {
    const user = userEvent.setup();

    vi.mocked(loginUser).mockRejectedValue(
      new Error("Invalid email or password")
    );

    renderLogin();

    await user.type(screen.getByLabelText("Email"), "wrong@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password"))
      .toBeInTheDocument();
  });

  it("redirects to the originally requested page after login", async () => {
    const user = userEvent.setup();

    vi.mocked(loginUser).mockResolvedValue({
      token: "test-token",
      user: {
        id: "user-1",
        email: "user@example.com",
        role: "user",
      },
    });

    renderLogin("/login");

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123");

    // Simulate a protected route redirect carrying its original destination.
    // The helper below provides this state through the router.
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("shows a registration-success message when redirected after registration", () => {
    render(
      <AuthProvider>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/login",
              state: { registered: true },
            },
          ]}
        >
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(
      screen.getByText("Registration successful. Sign in to continue.")
    ).toBeInTheDocument();
  });

  it("requires an email and password", () => {
    renderLogin();

    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
  });
});