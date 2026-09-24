import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
                ⚡
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">SkillSwap</span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
              Turn Skills Into Opportunities. A professional marketplace for emerging creators to
              offer their expertise and build meaningful careers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
              Product
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-zinc-400">
              <li>
                <Link to="/marketplace" className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">
                  Explore
                </Link>
              </li>
              <li>
                <a href="/#categories" className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">
                  Categories
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">
                  How it works
                </a>
              </li>
              <li>
                <Link to="/saved" className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">
                  Saved services
                </Link>
              </li>
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
              Creators
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-zinc-400">
              <li>
                <Link to="/gigs/new" className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">
                  Post a Gig
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">
                  Creator Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/messages" className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">
                  Direct Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
              Resources
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-zinc-400">
              <li>
                <a
                  href="https://github.com/programeryashu/code2career"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <span className="text-slate-400 dark:text-zinc-600">API Documentation</span>
              </li>
              <li>
                <span className="text-slate-400 dark:text-zinc-600">Creator Guidelines</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row dark:border-zinc-800 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} SkillSwap. All rights reserved.</p>
          <p className="text-[11px]">Turn Skills Into Opportunities.</p>
        </div>
      </div>
    </footer>
  );
}
