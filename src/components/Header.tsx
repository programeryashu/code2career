import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSavedGigs } from "../context/SavedGigsContext";
import { API_MODE, resetMockData } from "../lib/apiClient";
import UserSwitcher from "./UserSwitcher";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
    isActive ? "text-slate-900 font-bold bg-slate-100" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "bg-violet-50 text-violet-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
  }`;

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { saveCount } = useSavedGigs();

  function resetDemo() {
    if (window.confirm("Reset all demo data back to the seeded state?")) {
      resetMockData();
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        {/* Brand & Main Nav Links */}
        <div className="flex items-center gap-7">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs text-white group-hover:bg-violet-600 transition-colors">
              ⚡
            </span>
            <span className="text-sm font-extrabold tracking-tight text-slate-900 group-hover:text-violet-700 transition-colors">
              SkillSwap
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink to="/marketplace" className={navLinkClass}>
              Explore
            </NavLink>
            <a href="/#categories" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              Categories
            </a>
            <a href="/#how-it-works" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
              How it works
            </a>
            <span className="h-3.5 w-px bg-slate-200 mx-1" />
            <NavLink to="/my-bookings" className={navLinkClass}>
              My Bookings
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/messages" className={navLinkClass}>
              Messages
            </NavLink>
            <NavLink to="/saved" className={navLinkClass}>
              <span>Saved</span>
              {saveCount > 0 && (
                <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                  {saveCount}
                </span>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Right Actions & Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {API_MODE === "mock" && (
            <button
              onClick={resetDemo}
              title="Reset mock data to initial demo state"
              className="hidden rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 xl:inline-block"
            >
              ↺ Reset
            </button>
          )}

          <UserSwitcher />

          {/* Primary Navbar CTA: Post a Gig */}
          <Link
            to="/gigs/new"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-violet-700 active:scale-95"
          >
            <span>+</span>
            <span>Post a Gig</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200/80 bg-white px-4 py-3 lg:hidden animate-fadeIn">
          <nav className="space-y-1">
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <span>Home</span>
              <span className="text-xs text-slate-400">→</span>
            </NavLink>
            <NavLink
              to="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <span>Explore Services</span>
              <span className="text-xs text-slate-400">→</span>
            </NavLink>
            <NavLink
              to="/gigs/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-bold text-white"
            >
              <span>+ Post a Gig</span>
              <span className="text-xs">✨</span>
            </NavLink>
            <NavLink
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <span>Creator Dashboard</span>
              <span className="text-xs text-slate-400">→</span>
            </NavLink>
            <NavLink
              to="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <span>My Bookings</span>
              <span className="text-xs text-slate-400">→</span>
            </NavLink>
            <NavLink
              to="/messages"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <span>Messages & Chats</span>
              <span className="text-xs text-slate-400">→</span>
            </NavLink>
            <NavLink
              to="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <span>Saved Services</span>
              {saveCount > 0 && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                  {saveCount}
                </span>
              )}
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}
