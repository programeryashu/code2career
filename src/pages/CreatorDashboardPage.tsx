import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, PageHeading, Spinner, ErrorNote } from "../components/ui";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { formatDeadline, formatINR } from "../lib/format";
import { unreadCount } from "../lib/seen";
import type { BookingWithGig } from "../lib/types";
import { StatusBadge } from "../components/StatusBadge";

export default function CreatorDashboardPage() {
  const { currentUser } = useUsers();
  const [rows, setRows] = useState<BookingWithGig[] | null>(null);
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!currentUser) return;
    api
      .listCreatorBookings(currentUser.id)
      .then(async (r) => {
        setRows(r);
        setError("");
        // Unread counts per booking chat (best-effort).
        const entries = await Promise.all(
          r.map(async (b) => {
            const msgs = await api.listMessages(b.id).catch(() => []);
            return [b.id, unreadCount(currentUser.id, `booking-${b.id}`, msgs, currentUser.id)] as const;
          }),
        );
        setUnread(Object.fromEntries(entries));
      })
      .catch((e: Error) => setError(e.message));
  }, [currentUser]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  async function decide(bookingId: number, status: "accepted" | "declined") {
    if (!currentUser) return;
    setActingId(bookingId);
    try {
      await api.updateBookingStatus(bookingId, {
        status,
        actor_id: currentUser.id,
      });
      load(); // re-render with new statuses (incl. the DP2 cascade)
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  if (!currentUser) {
    return (
      <EmptyState
        emoji="🙋"
        title="Who is creating today?"
        body="Pick a persona (top-right) to see bookings on the gigs they created."
      />
    );
  }

  const pending = rows?.filter((b) => b.status === "pending") ?? [];
  const decided = rows?.filter((b) => b.status !== "pending") ?? [];

  return (
    <div>
      <PageHeading
        title="Creator Dashboard"
        subtitle={`Incoming bookings for gigs created by ${currentUser.name}.`}
      />

      {error && <ErrorNote message={error} />}
      {rows === null ? (
        <Spinner label="Loading incoming bookings…" />
      ) : rows.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No incoming bookings"
          body={
            <>
              Bookings for your gigs will appear here.{" "}
              <Link to="/gigs/new" className="font-semibold text-violet-700 hover:underline">
                Post a gig
              </Link>{" "}
              to start getting requests.
            </>
          }
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Incoming ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                Nothing waiting — you've responded to everything. 🎉
              </p>
            ) : (
              <ul className="space-y-3">
                {pending.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm"
                  >
                    <BookingRow booking={b} unread={unread[b.id] ?? 0} />
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => decide(b.id, "accepted")}
                        disabled={actingId === b.id}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => decide(b.id, "declined")}
                        disabled={actingId === b.id}
                        className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        ✖ Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {decided.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Responded ({decided.length})
              </h2>
              <ul className="space-y-3">
                {decided.map((b) => (
                  <li
                    key={b.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <BookingRow booking={b} unread={unread[b.id] ?? 0} />
                      <StatusBadge status={b.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BookingRow({ booking, unread }: { booking: BookingWithGig; unread: number }) {
  const price = booking.agreed_price ?? booking.gig_rate;
  return (
    <div className="flex-1">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold text-slate-900">
          {booking.gig_title}
          {unread > 0 && (
            <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {unread} new
            </span>
          )}
        </h3>
        <span className="font-extrabold text-slate-900">
          {formatINR(price)}
          {booking.agreed_price != null && (
            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              🤝 bargained
            </span>
          )}
          {booking.agreed_price == null && booking.offer_price != null && (
            <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              💬 offer {formatINR(booking.offer_price)}
            </span>
          )}
        </span>
      </div>
      <p className="text-sm text-slate-500">
        Client: <span className="font-medium text-slate-700">{booking.client_name}</span> ·
        due {formatDeadline(booking.deadline)}
      </p>
      {booking.initial_message && (
        <p className="mt-1 line-clamp-1 text-xs italic text-slate-400">
          “{booking.initial_message}”
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <Link
          to={`/bookings/${booking.id}`}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-violet-700"
        >
          💬 Open chat
        </Link>
      </div>
    </div>
  );
}
