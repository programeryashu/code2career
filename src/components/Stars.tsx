import type { GigWithCreator } from "../lib/types";

/**
 * Aggregate star rating for a gig (or creator, via their gigs).
 * Renders nothing when there are no reviews yet.
 */
export default function Stars({
  rating,
  count,
  size = "sm",
}: {
  rating: number | null;
  count: number;
  size?: "sm" | "md";
}) {
  if (rating == null || count === 0) return null;

  const textCls = size === "md" ? "text-xs" : "text-[11px]";
  const rounded = Math.round(rating);

  return (
    <span
      className={`inline-flex items-center gap-1 ${textCls} font-semibold text-slate-700 dark:text-zinc-300`}
      title={`${rating.toFixed(1)} from ${count} review${count === 1 ? "" : "s"}`}
    >
      <span className="text-amber-500 dark:text-amber-400" aria-hidden>
        {"★".repeat(rounded)}
        <span className="text-amber-200 dark:text-amber-900">
          {"★".repeat(5 - rounded)}
        </span>
      </span>
      <span>{rating.toFixed(1)}</span>
      <span className="font-normal text-slate-400 dark:text-zinc-500">({count})</span>
    </span>
  );
}

/**
 * Rating fields live on the API's GigOut but not on the frontend type.
 * Read them defensively so both mock and live modes work.
 */
export function gigRating(gig: GigWithCreator): { rating: number | null; count: number } {
  const g = gig as GigWithCreator & { rating_avg?: number | null; rating_count?: number };
  return { rating: g.rating_avg ?? null, count: g.rating_count ?? 0 };
}
