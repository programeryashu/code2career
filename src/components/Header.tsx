import { NavLink } from "react-router-dom";
import { API_MODE, resetMockData } from "../lib/apiClient";
import UserSwitcher from "./UserSwitcher";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? "bg-violet-100 text-violet-800" : "text-slate-600 hover:bg-slate-100"
  }`;

export default function Header() {
  function resetDemo() {
    if (window.confirm("Reset all demo data back to the seeded state?")) {
      resetMockData();
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              SkillSwap
            </span>
          </NavLink>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" end className={navLinkClass}>
              Marketplace
            </NavLink>
            <NavLink to="/gigs/new" className={navLinkClass}>
              Post a Gig
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              Creator Dashboard
            </NavLink>
            <NavLink to="/my-bookings" className={navLinkClass}>
              My Bookings
            </NavLink>
            <NavLink to="/messages" className={navLinkClass}>
              Messages
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {API_MODE === "mock" && (
            <>
              <span
                title="Running on in-memory demo data — set VITE_API_MODE=live to use the backend."
                className="hidden rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 md:inline-block"
              >
                demo data
              </span>
              <button
                onClick={resetDemo}
                title="Restore the seeded demo dataset (handy before recording)"
                className="hidden rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 md:inline-block"
              >
                ↺ Reset
              </button>
            </>
          )}
          <UserSwitcher />
        </div>
      </div>
    </header>
  );
}
