import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { Spinner, btnGhost, btnPrimary } from "../components/ui";
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

  if (loading) return <Spinner label="Loading booking…" />;
  if (error || !booking) return <p className="text-sm text-rose-600">{error}</p>;

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-3 text-2xl font-extrabold text-emerald-800">
          Booking submitted successfully.
        </h1>
        <p className="mt-2 text-sm text-emerald-700">
          {booking.creator_name} has received your request and will accept or
          decline it — track it under <strong>My Bookings</strong>.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-900">{booking.gig_title}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Client</dt>
            <dd className="font-semibold text-slate-800">{booking.client_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Deadline</dt>
            <dd className="font-semibold text-slate-800">{formatDeadline(booking.deadline)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Rate</dt>
            <dd className="font-semibold text-slate-800">{formatINR(booking.rate)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Status</dt>
            <dd>
              <StatusBadge status={booking.status} />
            </dd>
          </div>
        </dl>
        {booking.offer_price != null && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            💬 You offered {formatINR(booking.offer_price)} (listed: {formatINR(booking.rate)}) —
            the creator can accept, counter, or decline your price.
          </p>
        )}
        {booking.initial_message && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold">Project details sent:</span> {booking.initial_message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/bookings/${booking.id}`} className={btnPrimary}>
            💬 Open chat
          </Link>
          <Link to="/my-bookings" className={btnGhost}>
            View My Bookings
          </Link>
          <Link to="/" className={btnGhost}>
            Keep browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
