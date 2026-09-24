import { Link } from "react-router-dom";
import { formatINR, postedLabel } from "../lib/format";
import { CATEGORY_EMOJI, type GigWithCreator } from "../lib/types";

export default function GigCard({ gig }: { gig: GigWithCreator }) {
  return (
    <Link
      to={`/gigs/${gig.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-xl">
            {CATEGORY_EMOJI[gig.category]}
          </span>
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-violet-700">
              {gig.title}
            </h3>
            <p className="text-xs text-slate-500">
              by {gig.creator_name} · {postedLabel(gig.created_at)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-slate-900">
            {formatINR(gig.rate)}
          </div>
          {!gig.is_open && (
            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Closed
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{gig.description}</p>
      <span className="mt-4 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        {gig.category}
      </span>
    </Link>
  );
}
