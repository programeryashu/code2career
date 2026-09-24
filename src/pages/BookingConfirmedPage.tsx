import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { ErrorNote, Spinner, btnGhost, btnPrimary } from "../components/ui";
import { api } from "../lib/apiClient";
import { formatDeadline, formatINR } from "../lib/format";
import type { BookingWithDetails } from "../lib/types";

export default function BookingConfirmedPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getBooking(Number(id))
      .then((b) => {
        if (!cancelled) setBooking(b);
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

  if (loading) return <Spinner label="Loading booking status…" />;
  if (error || !booking) return <ErrorNote message={error || "Booking not found."} />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Confirmation Banner */}
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-8 text-center dark:border-emerald-500/30 dark:bg-emerald-950/30">
        <div className="mx-auto flex h-12 w-12 animate-pulseOnce items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-emerald-950 dark:text-emerald-200">
          Booking submitted successfully.
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-emerald-800 dark:text-emerald-300/80">
          Your request has been sent to {booking.creator_name}. They will review your project
          requirements and accept or decline.
        </p>
      </div>

      {/* Booking Summary Card */}
      <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="border-b border-slate-100 pb-3 dark:border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Booking Details
          </span>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-zinc-100">{booking.gig_title}</h2>
        </div>

        <dl className="space-y-2.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-zinc-400">Client</dt>
            <dd className="font-semibold text-slate-800 dark:text-zinc-200">{booking.client_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-zinc-400">Target Deadline</dt>
            <dd className="font-semibold text-slate-800 dark:text-zinc-200">{formatDeadline(booking.deadline)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-zinc-400">Price Rate</dt>
            <dd className="font-semibold text-slate-800 dark:text-zinc-200">{formatINR(booking.rate)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500 dark:text-zinc-400">Status</dt>
            <dd>
              <StatusBadge status={booking.status} />
            </dd>
          </div>
        </dl>

        {booking.offer_price != null && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300">
            💬 You proposed a starting offer of {formatINR(booking.offer_price)} (Listed: {formatINR(booking.rate)}).
          </div>
        )}

        {booking.initial_message && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">Project requirements: </span>
            <span>{booking.initial_message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4 dark:border-zinc-800">
          <Link to={`/bookings/${booking.id}`} className={btnPrimary}>
            Open Conversation & Brief →
          </Link>
          <Link to="/my-bookings" className={btnGhost}>
            View My Bookings
          </Link>
          <Link to="/marketplace" className={btnGhost}>
            Explore more services
          </Link>
        </div>
      </div>
    </div>
  );
}
