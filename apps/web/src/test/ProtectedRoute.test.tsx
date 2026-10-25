import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { User } from "../types/vehicle";
import ProtectedRoute from "../components/ProtectedRoute";

const authState = vi.hoisted(() => ({
  user: null as any,
  token: null as string | null,
  loading: false,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: authState.user,
    token: authState.token,
    loading: authState.loading,
    isLoading: authState.loading,
    isAuthenticated: Boolean(authState.user),
    login: () => {},
    logout: () => {},
  }),
}));

const regularUser: User = {
  id: "user-1",
  name: "Test User",
  email: "user@example.com",
  role: "user",
};

const adminUser: User = {
  id: "admin-1",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
};

function renderProtectedRoute(
  user: User | null,
  adminOnly = false
) {
  authState.user = user;
  authState.token = user ? "test-token" : null;
  authState.loading = false;

  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute adminOnly={adminOnly}>
              <h1>Protected content</h1>
            </ProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={<h1>Login page</h1>}
        />

        <Route
          path="/vehicles"
          element={<h1>Vehicles page</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    authState.user = null;
    authState.token = null;
    authState.loading = false;
  });

  it("redirects unauthenticated users to login", () => {
    renderProtectedRoute(null);

    expect(screen.getByRole("heading", { name: "Login page" }))
      .toBeInTheDocument();

    expect(screen.queryByText("Protected content"))
      .not.toBeInTheDocument();
  });

  it("allows authenticated users to access protected routes", () => {
    renderProtectedRoute(regularUser);

    expect(screen.getByText("Protected content"))
      .toBeInTheDocument();
  });

  it("redirects regular users away from admin-only routes", () => {
    renderProtectedRoute(regularUser, true);

    expect(screen.getByRole("heading", { name: "Vehicles page" }))
      .toBeInTheDocument();

    expect(screen.queryByText("Protected content"))
      .not.toBeInTheDocument();
  });

  it("allows admins to access admin-only routes", () => {
    renderProtectedRoute(adminUser, true);

    expect(screen.getByText("Protected content"))
      .toBeInTheDocument();
  });
});