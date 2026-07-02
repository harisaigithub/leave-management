import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const employeeLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/apply", label: "Apply for leave" },
  { to: "/history", label: "Leave history" },
  { to: "/profile", label: "Profile" },
];

const managerLinks = [
  { to: "/manager/dashboard", label: "Dashboard" },
  { to: "/manager/pending", label: "Pending approvals" },
  { to: "/manager/employees", label: "Employees" },
  { to: "/manager/profile", label: "Profile" },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="8" fill="#2F6F5E" />
        <path d="M8 14.5L12 18.5L20 9.5" stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-lg font-extrabold tracking-tight text-ink">Leave Hub</span>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === "MANAGER" ? managerLinks : employeeLinks;

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <BrandMark />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-50 text-brand-600" : "text-muted hover:bg-bg hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:inline">
            {user?.name} <span className="text-border">·</span> {user?.role === "MANAGER" ? "Manager" : "Employee"}
          </span>
          <button onClick={handleLogout} className="btn-secondary !px-3 !py-2 text-sm">
            Log out
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-1.5 md:hidden" aria-label="Primary mobile">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                isActive ? "bg-brand-50 text-brand-600" : "text-muted"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
