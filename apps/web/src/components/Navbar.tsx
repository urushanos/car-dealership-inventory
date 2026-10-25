import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CarFront, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "text-emerald-400" : "text-slate-200 hover:text-emerald-400"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <nav className="bg-[#0b1b33] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <CarFront className="h-6 w-6 text-emerald-400" />
            <span>
              Turnover<span className="text-slate-400">Tech</span>
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/vehicles" className={linkClass}>
              Inventory
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="flex items-center text-sm text-slate-300">
                <UserIcon className="mr-1.5 h-4 w-4" />
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center rounded-md bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm text-slate-200 hover:text-emerald-400">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-slate-200 hover:bg-slate-800 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-t border-slate-800 px-4 py-3 md:hidden">
          <NavLink to="/vehicles" className={linkClass} onClick={() => setOpen(false)}>
            Inventory
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
              Admin
            </NavLink>
          )}
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-slate-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          ) : (
            <div className="flex gap-2 px-3">
              <Link to="/login" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link to="/register" onClick={() => setOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
