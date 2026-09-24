import { Link } from "react-router-dom";
import type { User } from "../lib/types";

export interface CreatorSummary {
  user: User;
  role?: string;
  skills?: string[];
  gigCount?: number;
  rating?: number;
  reviewCount?: number;
}

export default function CreatorCard({
  creator,
}: {
  creator: CreatorSummary;
}) {
  const { user, role = "Creator", skills = [], gigCount, rating = 4.9, reviewCount = 8 } = creator;

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-base font-bold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            {user.name[0]}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-violet-700 dark:text-zinc-100 dark:group-hover:text-violet-400">
              {user.name}
            </h3>
            <p className="truncate text-xs text-slate-500 dark:text-zinc-400">{role}</p>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-zinc-300">
          <span className="font-bold text-amber-500 dark:text-amber-400">★</span>
          <span className="font-semibold text-slate-800 dark:text-zinc-100">{rating}</span>
          <span className="text-slate-400 dark:text-zinc-500">({reviewCount})</span>
          {gigCount !== undefined && (
            <span className="ml-1 text-slate-400 dark:text-zinc-500">· {gigCount} gigs</span>
          )}
        </div>

        <Link
          to={`/creators/${user.id}`}
          className="text-xs font-semibold text-violet-600 hover:underline group-hover:text-violet-700 dark:text-violet-400 dark:group-hover:text-violet-300"
        >
          View profile →
        </Link>
      </div>
    </div>
  );
}
