import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErrorNote, Field, PageHeading, Spinner, btnGhost, btnPrimary, inputClass } from "../components/ui";
import { useFeedback } from "../components/Feedback";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { formatINR } from "../lib/format";
import type { GigWithCreator } from "../lib/types";

export default function BookGigPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUsers();
  const { toast } = useFeedback();
  const [gig, setGig] = useState<GigWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [deadline, setDeadline] = useState("");
  const [details, setDetails] = useState("");
  const [useOffer, setUseOffer] = useState(false);
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName((n) => n || currentUser?.name || "");
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;
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

  if (loading) return <Spinner label="Loading service…" />;
  if (error || !gig) return <ErrorNote message={error || "Service not found."} />;

  const offerNumber = Number(offer);
  const offerValid =
    !useOffer ||
    (Number.isFinite(offerNumber) && offerNumber > 0 && offerNumber < gig.rate);
  const valid = name.trim().length >= 2 && deadline !== "" && offerValid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !gig || !valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const booking = await api.createBooking({
        gig_id: gig.id,
        client_id: currentUser.id,
        client_name: name.trim(),
        deadline,
        ...(details.trim() ? { initial_message: details.trim() } : {}),
        ...(useOffer && offer ? { offer_price: Math.round(offerNumber) } : {}),
      });
      toast("Booking request sent — the creator will review it shortly", "success");
      navigate(`/bookings/${booking.id}/confirmed`);
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message, "error");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to={`/gigs/${gig.id}`} className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400">
        ← Back to service details
      </Link>

      <PageHeading
        title="Book service"
        subtitle="Submit your project requirements to request this booking."
      />

      {/* Selected Service Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Selected Service
        </span>
        <div className="mt-2 flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">{gig.title}</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">by {gig.creator_name}</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-slate-900 dark:text-zinc-100">
              {formatINR(gig.rate)}
            </span>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <form
        onSubmit={submit}
        className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60"
      >
        <Field label="Your Name" hint="Client identity for this booking" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            className={inputClass}
          />
        </Field>

        <Field label="Target Deadline" hint="When do you need the deliverables completed?" required>
          <input
            type="date"
            value={deadline}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Project Requirements & Scope"
          hint="Describe your goals, reference links, and key specifications"
        >
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            placeholder="Tell the creator about what you'd like built or edited..."
            className={inputClass}
          />
        </Field>

        {/* Optional Price Proposal / Negotiation */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={useOffer}
              onChange={(e) => setUseOffer(e.target.checked)}
              className="rounded text-violet-600 focus:ring-violet-500 dark:bg-zinc-800"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              Propose a custom starting offer price (optional)
            </span>
          </label>

          {useOffer && (
            <div className="mt-3">
              <input
                type="number"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder={`Less than standard rate (${gig.rate})`}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">
                The creator can accept, counter-offer, or decline your proposed rate in the chat thread.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-800">
          <Link to={`/gigs/${gig.id}`} className={btnGhost}>
            Cancel
          </Link>

          <button
            type="submit"
            disabled={!valid || busy}
            className={`${btnPrimary} px-6`}
          >
            {busy ? "Submitting request…" : "Confirm Booking Request →"}
          </button>
        </div>
      </form>
    </div>
  );
}
