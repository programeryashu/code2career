import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import GigCard from "../components/GigCard";
import { ErrorNote, Spinner, btnPrimary } from "../components/ui";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import type { GigWithCreator, User } from "../lib/types";

export default function CreatorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUsers();
  const [creator, setCreator] = useState<User | null>(null);
  const [gigs, setGigs] = useState<GigWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getUser(Number(id)), api.listGigsByCreator(Number(id))])
      .then(([u, gs]) => {
        if (!cancelled) {
          setCreator(u);
          setGigs(gs);
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
  }, [id]);

  async function messageCreator() {
    if (!currentUser || !creator || messaging) return;
    setMessaging(true);
    try {
      const thread = await api.openDmThread(currentUser.id, creator.id);
      navigate(`/dm/${thread.id}`);
    } catch (e) {
      setError((e as Error).message);
      setMessaging(false);
    }
  }

  if (loading) return <Spinner label="Loading creator profile…" />;
  if (error || !creator) {
    return (
      <div className="space-y-4">
        <ErrorNote message={error || "Creator profile not found."} />
        <Link to="/marketplace" className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const isMe = currentUser?.id === creator.id;
  const openCount = gigs.filter((g) => g.is_open).length;

  // Aggregate rating across this creator's gigs (live API supplies the fields).
  const rated = gigs.filter((g) => g.rating_avg != null && (g.rating_count ?? 0) > 0);
  const ratingAvg =
    rated.length > 0
      ? rated.reduce((sum, g) => sum + (g.rating_avg ?? 0) * (g.rating_count ?? 1), 0) /
        rated.reduce((sum, g) => sum + (g.rating_count ?? 1), 0)
      : null;
  const ratingCount = rated.reduce((sum, g) => sum + (g.rating_count ?? 0), 0);

  // Extract unique categories as skills
  const skills = Array.from(new Set(gigs.map((g) => g.category)));

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link to="/marketplace" className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400">
        ← Back to marketplace
      </Link>

      {/* Creator Header Profile Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-2xl font-bold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              {creator.name[0]}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">{creator.name}</h1>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Creator
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Joined{" "}
                {new Date(creator.created_at).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {gigs.length} service{gigs.length === 1 ? "" : "s"} published ({openCount} available)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              <span className="text-amber-500 dark:text-amber-400">★</span>
              <span>{ratingAvg != null ? ratingAvg.toFixed(1) : "New"}</span>
              {ratingCount > 0 ? (
                <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">({ratingCount})</span>
              ) : (
                <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">No reviews yet</span>
              )}
            </div>

            {!isMe && (
              <button onClick={messageCreator} disabled={messaging} className={btnPrimary}>
                {messaging ? "Opening…" : "💬 Message creator"}
              </button>
            )}
          </div>
        </div>

        {/* Skills Row */}
        {skills.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6 dark:border-zinc-800">
            <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Expertise:
            </span>
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Published Gigs */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
            Published Services ({gigs.length})
          </h2>
        </div>

        {gigs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
            This creator has not published any services yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
