import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorNote, Spinner, btnGhost, btnPrimary } from "../components/ui";
import { useFeedback } from "../components/Feedback";
import Stars, { gigRating } from "../components/Stars";
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
  const { toast } = useFeedback();
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

  function onSaveToggle() {
    if (!gig) return;
    toggleSave(gig.id);
    toast(isSaved(gig.id) ? "Removed from saved services" : "Saved to your list ★", "info");
  }

  if (loading) return <Spinner label="Loading service details…" />;
  if (error || !gig) {
    return (
      <div className="space-y-4">
        <ErrorNote message={error || "Service not found."} />
        <Link to="/marketplace" className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const saved = isSaved(gig.id);
  const isMe = currentUser?.id === gig.creator_id;
  const { rating, count } = gigRating(gig);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
        <Link to="/marketplace" className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">
          Marketplace
        </Link>
        <span>/</span>
        <Link
          to={`/marketplace?category=${encodeURIComponent(gig.category)}`}
          className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100"
        >
          {gig.category}
        </Link>
        <span>/</span>
        <span className="max-w-[15rem] truncate font-medium text-slate-800 dark:text-zinc-200">
          {gig.title}
        </span>
      </nav>

      {/* Main 2-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Service Information */}
        <div className="space-y-8 lg:col-span-8">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
            {/* Category tag */}
            <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
              <span>{CATEGORY_EMOJI[gig.category]}</span>
              <span>{gig.category}</span>
            </div>

            {/* Title */}
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-zinc-100">
              {gig.title}
            </h1>

            {/* Creator Bio Snippet */}
            <div className="mt-5 flex items-center justify-between border-y border-slate-100 py-4 dark:border-zinc-800">
              <Link
                to={`/creators/${gig.creator_id}`}
                className="group flex items-center gap-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 transition group-hover:bg-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:group-hover:bg-violet-900/60">
                  {gig.creator_name[0]}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 transition group-hover:text-violet-700 dark:text-zinc-100 dark:group-hover:text-violet-400">
                    {gig.creator_name}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    Posted {postedLabel(gig.created_at)}
                  </p>
                </div>
              </Link>

              {rating != null ? (
                <Stars rating={rating} count={count} size="md" />
              ) : (
                <span className="text-xs text-slate-400 dark:text-zinc-500">No reviews yet</span>
              )}
            </div>

            {/* Description Section */}
            <div className="mt-6 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                About this service
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                {gig.description}
              </p>
            </div>

            {/* Service Highlights / Guarantee */}
            <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>Direct in-app messaging & negotiation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>Structured AI Project Brief upon acceptance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking & Action Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Service Rate
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
                  {formatINR(gig.rate)}
                </span>
                <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">Fixed rate</span>
              </div>
            </div>

            {/* Status info */}
            <div>
              {gig.is_open ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Available for booking</span>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200/60 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
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
                  className="w-full cursor-not-allowed rounded-xl bg-slate-100 py-3 text-xs font-semibold text-slate-400 dark:bg-zinc-800 dark:text-zinc-600"
                >
                  No longer accepting bookings
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onSaveToggle}
                  className={`${btnGhost} w-full border border-slate-200 text-xs dark:border-zinc-700`}
                >
                  {saved ? "★ Saved" : "☆ Save"}
                </button>

                {!isMe && (
                  <button
                    type="button"
                    onClick={messageCreator}
                    disabled={messaging}
                    className={`${btnGhost} w-full border border-slate-200 text-xs dark:border-zinc-700`}
                  >
                    {messaging ? "Opening…" : "💬 Message"}
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center dark:border-zinc-800">
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Single-active booking protection guaranteed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
