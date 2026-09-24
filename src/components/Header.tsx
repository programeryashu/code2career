import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useFeedback } from "./Feedback";
import { useSavedGigs } from "../context/SavedGigsContext";
import { useTheme } from "../context/ThemeContext";
import { API_MODE, resetMockData } from "../lib/apiClient";
import UserSwitcher from "./UserSwitcher";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
    isActive
      ? "bg-slate-100 font-bold text-slate-900 dark:bg-zinc-800 dark:text-zinc-100"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
      : "text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
  }`;

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { saveCount } = useSavedGigs();
  const { theme, toggleTheme } = useTheme();
  const { confirm, toast } = useFeedback();

  async function resetDemo() {
    const ok = await confirm({
      title: "Reset demo data?",
      body: "All mock bookings, chats and gigs go back to the seeded state.",
      confirmLabel: "Reset",
      danger: true,
    });
    if (ok) {
      resetMockData();
      toast("Demo data reset to the seeded state", "success");
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        {/* Brand & Main Nav Links */}
        <div className="flex items-center gap-7">
          <Link to="/" className="group flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs text-white transition-colors group-hover:bg-violet-600 dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-violet-500 dark:group-hover:text-white">
              ⚡
              </span>
            <span className="text-sm font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-violet-700 dark:text-zinc-100 dark:group-hover:text-violet-400">
              SkillSwap
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink to="/marketplace" className={navLinkClass}>
              Explore
            </NavLink>
            <a href="/#categories" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100">
              Categories
            </a>
            <a href="/#how-it-works" className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100">
              How it works
            </a>
            <span className="mx-1 h-3.5 w-px bg-slate-200 dark:bg-zinc-700" />
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
                <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:bg-zinc-700 dark:text-zinc-200">
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
              className="hidden rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-50 xl:inline-block dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
            >
              ↺ Reset
            </button>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle color theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-600 transition hover:bg-slate-50 active:scale-90 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <UserSwitcher />

          {/* Primary Navbar CTA: Post a Gig */}
          <Link
            to="/gigs/new"
            className="hidden items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-violet-700 active:scale-95 sm:inline-flex dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            <span>+</span>
            <span>Post a Gig</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="animate-fadeIn border-t border-slate-200/80 bg-white px-4 py-3 lg:hidden dark:border-zinc-800/80 dark:bg-zinc-950">
          <nav className="space-y-1">
            <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <span>Home</span>
              <span className="text-xs text-slate-400 dark:text-zinc-500">→</span>
            </NavLink>
            <NavLink to="/marketplace" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <span>Explore Services</span>
              <span className="text-xs text-slate-400 dark:text-zinc-500">→</span>
            </NavLink>
            <NavLink
              to="/gigs/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-bold text-white"
            >
              <span>+ Post a Gig</span>
              <span className="text-xs">✨</span>
            </NavLink>
            <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <span>Creator Dashboard</span>
              <span className="text-xs text-slate-400 dark:text-zinc-500">→</span>
            </NavLink>
            <NavLink to="/my-bookings" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <span>My Bookings</span>
              <span className="text-xs text-slate-400 dark:text-zinc-500">→</span>
            </NavLink>
            <NavLink to="/messages" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <span>Messages & Chats</span>
              <span className="text-xs text-slate-400 dark:text-zinc-500">→</span>
            </NavLink>
            <NavLink to="/saved" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClass}>
              <span>Saved Services</span>
              {saveCount > 0 && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
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
