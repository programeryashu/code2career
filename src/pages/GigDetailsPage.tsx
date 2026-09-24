import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorNote, PageHeading, Spinner, btnGhost, btnPrimary } from "../components/ui";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { formatINR, postedLabel } from "../lib/format";
import { CATEGORY_EMOJI, type GigWithCreator } from "../lib/types";

export default function GigDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUsers();
  const [gig, setGig] = useState<GigWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messaging, setMessaging] = useState(false);

  async function messageCreator() {
    if (!gig) return;
    if (!currentUser) {
      navigate("/messages");
      return;
    }
    setMessaging(true);
    try {
      const thread = await api.openDmThread(currentUser.id, gig.creator_id);
      navigate(`/dm/${thread.id}`);
    } catch (e) {
      setError((e as Error).message);
      setMessaging(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getGig(Number(id))
      .then((g) => {
        if (!cancelled) setGig(g);
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

  if (loading) return <Spinner label="Loading gig…" />;
  if (error || !gig) {
    return (
      <div className="space-y-4">
        <ErrorNote message={error || "Gig not found."} />
        <Link to="/" className="text-sm font-semibold text-violet-700 hover:underline">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="text-sm font-semibold text-violet-700 hover:underline">
        ← Back to marketplace
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-3xl">
              {CATEGORY_EMOJI[gig.category]}
            </span>
            <div>
              <PageHeading title={gig.title} />
              <p className="text-sm text-slate-500">
                by{" "}
                <Link
                  to={`/creators/${gig.creator_id}`}
                  className="font-semibold text-slate-700 hover:text-violet-700 hover:underline"
                >
                  {gig.creator_name}
                </Link>{" "}
                · {postedLabel(gig.created_at)} ·{" "}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {gig.category}
                </span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-slate-900">
              {formatINR(gig.rate)}
            </div>
            <div className="mt-2 flex flex-col items-end gap-2">
              {gig.is_open && (
                <button
                  onClick={() => navigate(`/gigs/${gig.id}/book`)}
                  className={btnPrimary}
                >
                  📅 Book this Gig
                </button>
              )}
              {gig.creator_id !== currentUser?.id && (
                <button onClick={messageCreator} disabled={messaging} className={btnGhost}>
                  {messaging ? "Opening…" : "💬 Message creator"}
                </button>
              )}
              {!gig.is_open && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  No longer accepting bookings
                </span>
              )}
            </div>
          </div>
        </div>

        <hr className="my-6 border-slate-100" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Description
        </h2>
        <p className="mt-2 whitespace-pre-line text-slate-700">{gig.description}</p>
      </div>
    </div>
  );
}
