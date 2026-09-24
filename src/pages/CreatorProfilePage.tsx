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

  if (loading) return <Spinner label="Loading profile…" />;
  if (error || !creator) {
    return (
      <div className="space-y-4">
        <ErrorNote message={error || "Creator not found."} />
        <Link to="/" className="text-sm font-semibold text-violet-700 hover:underline">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const isMe = currentUser?.id === creator.id;
  const openCount = gigs.filter((g) => g.is_open).length;

  return (
    <div>
      <Link to="/" className="text-sm font-semibold text-violet-700 hover:underline">
        ← Back to marketplace
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-5">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-violet-100 text-3xl font-extrabold text-violet-700">
            {creator.name[0]}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900">{creator.name}</h1>
            <p className="text-sm text-slate-500">
              Creator · joined{" "}
              {new Date(creator.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              · {gigs.length} gig{gigs.length === 1 ? "" : "s"} ({openCount} open)
            </p>
          </div>
          {!isMe && (
            <button onClick={messageCreator} disabled={messaging} className={btnPrimary}>
              {messaging ? "Opening…" : "💬 Message creator"}
            </button>
          )}
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Gigs by {creator.name.split(" ")[0]}
      </h2>
      {gigs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-sm text-slate-500">
          No gigs posted yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {gigs.map((g) => (
            <GigCard key={g.id} gig={g} />
          ))}
        </div>
      )}
    </div>
  );
}
