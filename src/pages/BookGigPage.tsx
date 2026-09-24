import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import {
  ErrorNote,
  Field,
  PageHeading,
  Spinner,
  btnPrimary,
  inputClass,
} from "../components/ui";
import { api } from "../lib/apiClient";
import { formatINR } from "../lib/format";
import type { GigWithCreator } from "../lib/types";

export default function BookGigPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUsers();
  const [gig, setGig] = useState<GigWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [deadline, setDeadline] = useState("");
  const [details, setDetails] = useState("");
  const [useOffer, setUseOffer] = useState(false);
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Keep the prefilled name in sync if the user switches persona.
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

  if (loading) return <Spinner label="Loading gig…" />;
  if (error || !gig) return <ErrorNote message={error || "Gig not found."} />;

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
      // Confirmation page, as required by the brief.
      navigate(`/bookings/${booking.id}/confirmed`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/gigs/${gig.id}`} className="text-sm font-semibold text-violet-700 hover:underline">
        ← Back to gig
      </Link>
      <PageHeading title="Book Gig" subtitle="Fill in your details to send a booking request." />

      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Service</p>
        <div className="mt-1 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">{gig.title}</h2>
          <span className="text-xl font-extrabold text-slate-900">{formatINR(gig.rate)}</span>
        </div>
        <p className="text-sm text-slate-500">by {gig.creator_name}</p>
      </div>

      <form
        onSubmit={submit}
        className="mt-5 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <Field label="Your Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ashutosh"
            className={inputClass}
          />
        </Field>
        <Field label="Deadline" hint="When do you need the work delivered?">
          <input
            type="date"
            value={deadline}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Project details"
          hint="Shared privately with the creator as your first message."
        >
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="Scope, links, references, anything the creator should know…"
            className={inputClass}
          />
        </Field>

        {/* Bargain: optional lower offer */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={useOffer}
              onChange={(e) => setUseOffer(e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Bargain — offer a lower price
          </label>
          {useOffer && (
            <div className="mt-3 flex items-center gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                <input
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  inputMode="numeric"
                  placeholder={String(Math.max(1, Math.round(gig.rate * 0.8)))}
                  className={`${inputClass} w-36 pl-7`}
                />
              </div>
              <p className="text-xs text-slate-500">
                listed: {formatINR(gig.rate)} — the creator can accept, counter, or decline.
              </p>
            </div>
          )}
          {useOffer && !offerValid && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              Offer must be above 0 and below {formatINR(gig.rate)}.
            </p>
          )}
        </div>

        {error && <ErrorNote message={error} />}

        <button type="submit" disabled={!valid || busy} className={btnPrimary}>
          {busy ? "Sending…" : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
