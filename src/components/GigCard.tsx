import { Link } from "react-router-dom";
import { useSavedGigs } from "../context/SavedGigsContext";
import { formatINR } from "../lib/format";
import { CATEGORY_EMOJI, type GigWithCreator } from "../lib/types";

export default function GigCard({ gig }: { gig: GigWithCreator }) {
  const { isSaved, toggleSave } = useSavedGigs();
  const saved = isSaved(gig.id);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div>
        {/* Creator header & Save button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              to={`/creators/${gig.creator_id}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 transition hover:bg-violet-100 hover:text-violet-700"
            >
              {gig.creator_name[0]}
            </Link>
            <div className="min-w-0">
              <Link
                to={`/creators/${gig.creator_id}`}
                className="block truncate text-xs font-semibold text-slate-800 hover:text-violet-700 hover:underline"
              >
                {gig.creator_name}
              </Link>
              <span className="block text-[11px] text-slate-400">
                {gig.category} Creator
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave(gig.id);
            }}
            title={saved ? "Remove from saved" : "Save service"}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
              saved
                ? "border-violet-200 bg-violet-50 text-violet-600"
                : "border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {saved ? "★" : "☆"}
          </button>
        </div>

        {/* Title */}
        <Link to={`/gigs/${gig.id}`} className="mt-3.5 block">
          <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-violet-700 transition-colors line-clamp-2">
            {gig.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {gig.description}
        </p>

        {/* Category & Status */}
        <div className="mt-3.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            <span>{CATEGORY_EMOJI[gig.category]}</span>
            <span>{gig.category}</span>
          </span>
          {!gig.is_open && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200/60">
              In Progress
            </span>
          )}
        </div>
      </div>

      {/* Footer: Price & CTA */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
        <div>
          <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">
            Starting at
          </span>
          <span className="text-base font-extrabold text-slate-900">
            {formatINR(gig.rate)}
          </span>
        </div>

        <Link
          to={`/gigs/${gig.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 group-hover:text-violet-700 group-hover:translate-x-0.5 transition-all"
        >
          <span>View service</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
