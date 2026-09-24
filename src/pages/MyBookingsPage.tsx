import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState, ErrorNote, PageHeading, Spinner } from "../components/ui";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { formatDeadline, formatINR } from "../lib/format";
import { unreadCount } from "../lib/seen";
import type { BookingWithDetails, Category } from "../lib/types";

function BargainChip({ booking }: { booking: BookingWithDetails }) {
  if (booking.agreed_price != null) {
    return (
      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
        🤝 {formatINR(booking.agreed_price)} agreed
      </span>
    );
  }
  if (booking.offer_price != null) {
    return (
      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        💬 offer {formatINR(booking.offer_price)}
      </span>
    );
  }
  return null;
}

export default function MyBookingsPage() {
  const { currentUser } = useUsers();
  const [rows, setRows] = useState<BookingWithDetails[] | null>(null);
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    api
      .listMyBookings(currentUser.id)
      .then(async (r) => {
        if (cancelled) return;
        setRows(r);
        setError("");
        const entries = await Promise.all(
          r.map(async (b) => {
            const msgs = await api.listMessages(b.id).catch(() => []);
            return [b.id, unreadCount(currentUser.id, `booking-${b.id}`, msgs, currentUser.id)] as const;
          }),
        );
        if (!cancelled) setUnread(Object.fromEntries(entries));
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setRows((prev) => prev ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  if (!currentUser) {
    return (
      <EmptyState
        emoji="🙋"
        title="Who are you booking as?"
        body="Pick a persona (top-right) to see the bookings you made as a client."
      />
    );
  }

  return (
    <div>
      <PageHeading
        title="My Bookings"
        subtitle={`Requests you've made as ${currentUser.name}, with live status.`}
      />

      {error && <ErrorNote message={error} />}
      {rows === null ? (
        <Spinner label="Loading your bookings…" />
      ) : rows.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No bookings yet"
          body="Find a creator you like and book their gig — your requests will show up here."
          action={
            <Link
              to="/"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Browse the Marketplace
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li
              key={b.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    to={`/gigs/${b.gig_id}`}
                    className="font-semibold text-slate-900 hover:text-violet-700"
                  >
                    {b.gig_title}
                  </Link>
                  {unread[b.id] > 0 && (
                    <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unread[b.id]} new
                    </span>
                  )}
                  <p className="text-sm text-slate-500">
                    by {b.creator_name} · due {formatDeadline(b.deadline)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900">
                    {formatINR(b.agreed_price ?? b.rate)}
                    <BargainChip booking={b} />
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/bookings/${b.id}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-700"
                >
                  💬 Chat &amp; details
                </Link>
                {b.status === "pending" && b.offer_price == null && b.agreed_price == null && (
                  <Link
                    to={`/bookings/${b.id}`}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    🏷️ Bargain
                  </Link>
                )}
              </div>
              {b.status === "declined" && <DeclinedNote category={b.gig_category} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** DP1 — after a decline the client sees why, and a way forward. */
function DeclinedNote({ category }: { category: Category }) {
  return (
    <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
      <p className="text-sm font-medium text-rose-700">
        Creator declined this booking. The booking is closed — no further actions.
      </p>
      <Link
        to={`/?category=${encodeURIComponent(category)}`}
        className="mt-2 inline-block rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
      >
        Find Another Creator
      </Link>
    </div>
  );
}
