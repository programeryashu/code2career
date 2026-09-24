import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSavedGigs } from "../context/SavedGigsContext";
import { formatINR } from "../lib/format";
import { CATEGORY_EMOJI, type GigWithCreator } from "../lib/types";
import Stars, { gigRating } from "./Stars";

export default function GigCard({ gig }: { gig: GigWithCreator }) {
  const { isSaved, toggleSave } = useSavedGigs();
  const saved = isSaved(gig.id);
  const { rating, count } = gigRating(gig);
  const [bump, setBump] = useState(false);
  const bumpTimer = useRef<number | null>(null);

  // One-shot pulse when the star is toggled — a tiny bit of juice.
  useEffect(() => {
    return () => {
      if (bumpTimer.current) window.clearTimeout(bumpTimer.current);
    };
  }, []);

  function onSaveToggle() {
    toggleSave(gig.id);
    setBump(true);
    if (bumpTimer.current) window.clearTimeout(bumpTimer.current);
    bumpTimer.current = window.setTimeout(() => setBump(false), 360);
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
      <div>
        {/* Creator header & Save button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              to={`/creators/${gig.creator_id}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 transition hover:bg-violet-100 hover:text-violet-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-violet-950/60 dark:hover:text-violet-300"
            >
              {gig.creator_name[0]}
            </Link>
            <div className="min-w-0">
              <Link
                to={`/creators/${gig.creator_id}`}
                className="block truncate text-xs font-semibold text-slate-800 transition hover:text-violet-700 hover:underline dark:text-zinc-200 dark:hover:text-violet-400"
              >
                {gig.creator_name}
              </Link>
              <span className="block text-[11px] text-slate-400 dark:text-zinc-500">
                {gig.category} Creator
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSaveToggle();
            }}
            title={saved ? "Remove from saved" : "Save service"}
            aria-pressed={saved}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
              saved
                ? "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/40 dark:bg-violet-950/40 dark:text-violet-300"
                : "border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <span className={bump ? "inline-block animate-pulseOnce" : undefined}>
              {saved ? "★" : "☆"}
            </span>
          </button>
        </div>

        {/* Title */}
        <Link to={`/gigs/${gig.id}`} className="mt-3.5 block">
          <h3 className="text-sm font-bold leading-snug text-slate-900 transition-colors line-clamp-2 group-hover:text-violet-700 dark:text-zinc-100 dark:group-hover:text-violet-400">
            {gig.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2 dark:text-zinc-400">
          {gig.description}
        </p>

        {/* Category, Rating & Status */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
            <span>{CATEGORY_EMOJI[gig.category]}</span>
            <span>{gig.category}</span>
          </span>
          {!gig.is_open && (
            <span className="rounded-md border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
              In Progress
            </span>
          )}
          {rating != null && (
            <span className="ml-auto">
              <Stars rating={rating} count={count} />
            </span>
          )}
        </div>
      </div>

      {/* Footer: Price & CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800">
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Starting at
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
            {formatINR(gig.rate)}
          </span>
        </div>

        <Link
          to={`/gigs/${gig.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 transition-all group-hover:translate-x-0.5 group-hover:text-violet-700 dark:text-violet-400 dark:group-hover:text-violet-300"
        >
          <span>View service</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
