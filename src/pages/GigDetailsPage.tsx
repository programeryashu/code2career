import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorNote, Spinner, btnGhost, btnPrimary } from "../components/ui";
import { useSavedGigs } from "../context/SavedGigsContext";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { formatINR, postedLabel } from "../lib/format";
import { CATEGORY_EMOJI, type GigWithCreator } from "../lib/types";

export default function GigDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUsers();
  const { isSaved, toggleSave } = useSavedGigs();
  const [gig, setGig] = useState<GigWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messaging, setMessaging] = useState(false);

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

  if (loading) return <Spinner label="Loading service details…" />;
  if (error || !gig) {
    return (
      <div className="space-y-4">
        <ErrorNote message={error || "Service not found."} />
        <Link to="/marketplace" className="text-xs font-semibold text-violet-700 hover:underline">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const saved = isSaved(gig.id);
  const isMe = currentUser?.id === gig.creator_id;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/marketplace" className="hover:text-slate-900 transition-colors">
          Marketplace
        </Link>
        <span>/</span>
        <Link
          to={`/marketplace?category=${encodeURIComponent(gig.category)}`}
          className="hover:text-slate-900 transition-colors"
        >
          {gig.category}
        </Link>
        <span>/</span>
        <span className="truncate text-slate-800 font-medium max-w-[15rem]">
          {gig.title}
        </span>
      </nav>

      {/* Main 2-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Service Information */}
        <div className="space-y-8 lg:col-span-8">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            {/* Category tag */}
            <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <span>{CATEGORY_EMOJI[gig.category]}</span>
              <span>{gig.category}</span>
            </div>

            {/* Title */}
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {gig.title}
            </h1>

            {/* Creator Bio Snippet */}
            <div className="mt-5 flex items-center justify-between border-y border-slate-100 py-4">
              <Link
                to={`/creators/${gig.creator_id}`}
                className="group flex items-center gap-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 group-hover:bg-violet-200 transition">
                  {gig.creator_name[0]}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition">
                    {gig.creator_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Posted {postedLabel(gig.created_at)}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <span className="text-amber-500">★</span>
                <span>4.9</span>
                <span className="text-slate-400 font-normal">(Verified)</span>
              </div>
            </div>

            {/* Description Section */}
            <div className="mt-6 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                About this service
              </h2>
              <p className="whitespace-pre-line text-sm text-slate-700 leading-relaxed">
                {gig.description}
              </p>
            </div>

            {/* Service Highlights / Guarantee */}
            <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Direct in-app messaging & negotiation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Structured AI Project Brief upon acceptance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking & Action Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
            <div>
              <span className="block text-xs uppercase font-semibold tracking-wider text-slate-400">
                Service Rate
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatINR(gig.rate)}
                </span>
                <span className="text-xs text-slate-400 font-medium">Fixed rate</span>
              </div>
            </div>

            {/* Status info */}
            <div>
              {gig.is_open ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Available for booking</span>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-200/60">
                  <span>Currently in progress (1 active booking)</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {gig.is_open ? (
                <button
                  type="button"
                  onClick={() => navigate(`/gigs/${gig.id}/book`)}
                  className={`${btnPrimary} w-full py-3`}
                >
                  Book this service →
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-slate-100 py-3 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  No longer accepting bookings
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleSave(gig.id)}
                  className={`${btnGhost} border border-slate-200 text-xs w-full`}
                >
                  {saved ? "★ Saved" : "☆ Save"}
                </button>

                {!isMe && (
                  <button
                    type="button"
                    onClick={messageCreator}
                    disabled={messaging}
                    className={`${btnGhost} border border-slate-200 text-xs w-full`}
                  >
                    {messaging ? "Opening…" : "💬 Message"}
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Single-active booking protection guaranteed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
