import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GigCard from "../components/GigCard";
import { EmptyState, ErrorNote, PageHeading, SkeletonGrid } from "../components/ui";
import { useSavedGigs } from "../context/SavedGigsContext";
import { api } from "../lib/apiClient";
import type { GigWithCreator } from "../lib/types";

export default function SavedGigsPage() {
  const { savedIds } = useSavedGigs();
  const [gigs, setGigs] = useState<GigWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listGigs()
      .then((all) => {
        if (active) {
          const filtered = all.filter((g) => savedIds.includes(g.id));
          setGigs(filtered);
          setError("");
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [savedIds]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Saved Services"
        subtitle="Services you have bookmarked for future projects."
      />

      {error && <ErrorNote message={error} />}

      {loading ? (
        <SkeletonGrid count={3} />
      ) : gigs.length === 0 ? (
        <EmptyState
          emoji="☆"
          title="You haven't saved any services yet"
          body="Browse the marketplace and click the star icon on any service to save it here for quick access."
          action={
            <Link
              to="/marketplace"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Explore services →
            </Link>
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
  );
}
