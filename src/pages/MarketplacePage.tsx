import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import GigCard from "../components/GigCard";
import { EmptyState, ErrorNote, PageHeading, Spinner, inputClass } from "../components/ui";
import { api } from "../lib/apiClient";
import { CATEGORIES, type Category, type GigWithCreator, type SortOption } from "../lib/types";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
];

export default function MarketplacePage() {
  // DP1 deep-link support: /?category=Design arrives from "Find Another Creator".
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") as Category | null;
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category | "All">(
    initialCategory && CATEGORIES.includes(initialCategory) ? initialCategory : "All",
  );
  const [sort, setSort] = useState<SortOption>("recommended");
  const [gigs, setGigs] = useState<GigWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Debounce the search box so typing doesn't spam the API.
  const debouncedQ = useDebounced(q, 250);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listGigs({ q: debouncedQ, category, sort })
      .then((rows) => {
        if (!cancelled) {
          setGigs(rows);
          setError("");
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, category, sort]);

  return (
    <div>
      <PageHeading
        title="Marketplace"
        subtitle="Gigs by student creators — search, filter and book in seconds."
      />

      {/* Search + sort (DP3) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Search gigs — try "React" or "video"'
          className={`${inputClass} sm:max-w-md`}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <label htmlFor="sort" className="text-sm text-slate-500">
            Sort:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className={`${inputClass} w-auto py-1.5`}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              category === c
                ? "bg-violet-600 text-white shadow-sm"
                : "border border-slate-300 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error && <ErrorNote message={error} />}
        {loading ? (
          <Spinner label="Loading gigs…" />
        ) : gigs.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No gigs match"
            body="Try a different search term or category — or be the first to post this kind of gig."
            action={
              <Link
                to="/gigs/new"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Post a Gig
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
