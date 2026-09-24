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
        <Link to="/marketplace" className="text-xs font-semibold text-violet-700 hover:underline">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const isMe = currentUser?.id === creator.id;
  const openCount = gigs.filter((g) => g.is_open).length;

  // Extract unique categories as skills
  const skills = Array.from(new Set(gigs.map((g) => g.category)));

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link to="/marketplace" className="text-xs font-semibold text-violet-700 hover:underline">
        ← Back to marketplace
      </Link>

      {/* Creator Header Profile Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-2xl font-bold text-violet-700">
              {creator.name[0]}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{creator.name}</h1>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Creator
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
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
            <div className="flex items-center gap-1 text-sm font-bold text-slate-900 border border-slate-100 bg-slate-50 px-3 py-1.5 rounded-xl">
              <span className="text-amber-500">★</span>
              <span>4.9</span>
              <span className="text-xs text-slate-400 font-normal">(Verified)</span>
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
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">
              Expertise:
            </span>
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Published Services ({gigs.length})
          </h2>
        </div>

        {gigs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
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
