import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import GigCard from "../components/GigCard";
import { StaggerGrid } from "../components/Motion";
import { EmptyState, ErrorNote, PageHeading, SkeletonGrid, inputClass } from "../components/ui";
import { api } from "../lib/apiClient";
import { CATEGORIES, type Category, type GigWithCreator, type SortOption } from "../lib/types";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

const VALID_SORTS: SortOption[] = ["recommended", "newest", "price_asc", "price_desc"];

/** DP3 client mirror: surface the budget/category hints the backend parses. */
function parseSmartHints(q: string): { budgetMax: number | null; category: Category | null } {
  const lowered = q.toLowerCase();
  const budgetMatch = lowered.match(
    /(?:under|below|less than|max(?:imum)?)\s*(?:rs\.?|inr|₹)?\s*(\d{2,6})/,
  );
  const budgetMax = budgetMatch ? Number(budgetMatch[1]) : null;
  const category = CATEGORIES.find((c) => lowered.includes(c.toLowerCase())) ?? null;
  return { budgetMax, category };
}

function formatINRShort(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") as Category | null;
  const initialQ = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") as SortOption | null;

  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState<Category | "All">(
    initialCategory && CATEGORIES.includes(initialCategory) ? initialCategory : "All",
  );
  const [sort, setSort] = useState<SortOption>(
    initialSort && VALID_SORTS.includes(initialSort) ? initialSort : "recommended",
  );
  const [gigs, setGigs] = useState<GigWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync state if URL query params change (back/forward nav, header links).
  useEffect(() => {
    const urlCategory = searchParams.get("category") as Category | null;
    const urlQ = searchParams.get("q");
    const urlSort = searchParams.get("sort") as SortOption | null;
    if (urlCategory && CATEGORIES.includes(urlCategory)) {
      setCategory(urlCategory);
    }
    if (urlQ !== null) {
      setQ(urlQ);
    }
    if (urlSort && VALID_SORTS.includes(urlSort)) {
      setSort(urlSort);
    }
  }, [searchParams]);

  // Debounce search input
  const debouncedQ = useDebounced(q, 200);

  // Keep the URL in sync so refresh / share preserves the filter state.
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedQ.trim()) next.set("q", debouncedQ.trim());
    if (category !== "All") next.set("category", category);
    if (sort !== "recommended") next.set("sort", sort);
    setSearchParams(next, { replace: true });
  }, [debouncedQ, category, sort, setSearchParams]);

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

  const hints = useMemo(() => parseSmartHints(debouncedQ), [debouncedQ]);
  const showHints = debouncedQ.trim().length > 0 && (hints.budgetMax != null || hints.category != null);
  const hasActiveFilters = debouncedQ.trim() !== "" || category !== "All" || sort !== "recommended";

  return (
    <div className="space-y-6">
      <PageHeading
        title="Explore services"
        subtitle="Find skilled creators for your next project."
        action={
          <Link
            to="/gigs/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-violet-700"
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
            placeholder="Try “React developer under 3000”…"
            className={`${inputClass} pl-10`}
          />
          <span className="absolute left-3.5 top-3 text-sm text-slate-400 dark:text-zinc-500">🔍</span>
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-3 text-xs text-slate-400 transition hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <label htmlFor="sort" className="shrink-0 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            Sort by:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DP3 smart-search feedback chip */}
      {showHints && (
        <div className="animate-fadeIn flex flex-wrap items-center gap-2 rounded-xl border border-violet-200/80 bg-violet-50/70 px-3.5 py-2 text-xs text-violet-800 dark:border-violet-500/30 dark:bg-violet-950/30 dark:text-violet-300">
          <span className="font-bold">✨ Understood:</span>
          {hints.category && (
            <span className="rounded-md bg-white/80 px-2 py-0.5 font-semibold dark:bg-zinc-900/60">
              {hints.category}
            </span>
          )}
          {hints.budgetMax != null && (
            <span className="rounded-md bg-white/80 px-2 py-0.5 font-semibold dark:bg-zinc-900/60">
              under {formatINRShort(hints.budgetMax)}
            </span>
          )}
          <span className="text-violet-600/80 dark:text-violet-400/80">
            — filtering & ranking results to match.
          </span>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
              category === c
                ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
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
              hasActiveFilters ? (
                <button
                  onClick={() => {
                    setQ("");
                    setCategory("All");
                    setSort("recommended");
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Clear all filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <StaggerGrid>
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </StaggerGrid>
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
