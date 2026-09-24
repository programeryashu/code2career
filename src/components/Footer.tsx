import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-xs text-white">
                ⚡
              </span>
              <span className="text-sm font-bold text-slate-900">SkillSwap</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Turn Skills Into Opportunities. A professional marketplace for emerging creators to
              offer their expertise and build meaningful careers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Product
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              <li>
                <Link to="/marketplace" className="hover:text-slate-900 transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <a href="/#categories" className="hover:text-slate-900 transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-slate-900 transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <Link to="/saved" className="hover:text-slate-900 transition-colors">
                  Saved services
                </Link>
              </li>
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Creators
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              <li>
                <Link to="/gigs/new" className="hover:text-slate-900 transition-colors">
                  Post a Gig
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
                  Creator Dashboard
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-slate-900 transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-slate-900 transition-colors">
                  Direct Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Resources
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              <li>
                <a
                  href="https://github.com/programeryashu/code2career"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900 transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <span className="text-slate-400">API Documentation</span>
              </li>
              <li>
                <span className="text-slate-400">Creator Guidelines</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} SkillSwap. All rights reserved.</p>
          <p className="text-[11px]">Turn Skills Into Opportunities.</p>
        </div>
      </div>
    </footer>
  );
}
