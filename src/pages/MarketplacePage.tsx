import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import GigCard from "../components/GigCard";
import { EmptyState, ErrorNote, PageHeading, SkeletonGrid, inputClass } from "../components/ui";
import { api } from "../lib/apiClient";
import { CATEGORIES, type Category, type GigWithCreator, type SortOption } from "../lib/types";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
];

export default function MarketplacePage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") as Category | null;
  const initialQ = searchParams.get("q") || "";

  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState<Category | "All">(
    initialCategory && CATEGORIES.includes(initialCategory) ? initialCategory : "All",
  );
  const [sort, setSort] = useState<SortOption>("recommended");
  const [gigs, setGigs] = useState<GigWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync state if URL query params change
  useEffect(() => {
    const urlCategory = searchParams.get("category") as Category | null;
    const urlQ = searchParams.get("q");
    if (urlCategory && CATEGORIES.includes(urlCategory)) {
      setCategory(urlCategory);
    }
    if (urlQ !== null) {
      setQ(urlQ);
    }
  }, [searchParams]);

  // Debounce search input
  const debouncedQ = useDebounced(q, 200);

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
    <div className="space-y-6">
      <PageHeading
        title="Explore services"
        subtitle="Find skilled creators for your next project."
        action={
          <Link
            to="/gigs/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
          >
            <span>+</span>
            <span>Post a Gig</span>
          </Link>
        }
      />

      {/* Search and Sort controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search services, skills or creators..."
            className={`${inputClass} pl-10`}
          />
          <span className="absolute left-3.5 top-3 text-sm text-slate-400">🔍</span>
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <label htmlFor="sort" className="text-xs font-semibold text-slate-500 shrink-0">
            Sort by:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-violet-500 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              category === c
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {c === "Video Editing" ? "Video" : c === "Content" ? "Writing" : c}
          </button>
        ))}
      </div>

      {/* Results Section */}
      <div className="mt-6">
        {error && <ErrorNote message={error} />}

        {loading ? (
          <SkeletonGrid count={6} />
        ) : gigs.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title="No services found"
            body="Try another search term or select a different category."
            action={
              <button
                onClick={() => {
                  setQ("");
                  setCategory("All");
                }}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
