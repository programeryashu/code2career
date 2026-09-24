import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState, ErrorNote, PageHeading, Spinner } from "../components/ui";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { formatDeadline, formatINR } from "../lib/format";
import { unreadCount } from "../lib/seen";
import type { BookingWithGig, GigWithCreator } from "../lib/types";

export default function CreatorDashboardPage() {
  const { currentUser } = useUsers();
  const [rows, setRows] = useState<BookingWithGig[] | null>(null);
  const [myGigs, setMyGigs] = useState<GigWithCreator[]>([]);
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!currentUser) return;
    Promise.all([
      api.listCreatorBookings(currentUser.id),
      api.listGigsByCreator(currentUser.id),
    ])
      .then(async ([r, gs]) => {
        setRows(r);
        setMyGigs(gs);
        setError("");
        // Unread message count per booking
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
      load(); // Reload to reflect state cascade (DP2: auto-declines other pending requests for the same gig)
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
        title="Who is accessing the dashboard?"
        body="Select a creator persona from the top-right switcher to view incoming bookings and manage your services."
      />
    );
  }

  const pending = rows?.filter((b) => b.status === "pending") ?? [];
  const accepted = rows?.filter((b) => b.status === "accepted") ?? [];
  const totalEarnings = accepted.reduce((sum, b) => sum + (b.agreed_price ?? b.gig_rate), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeading
        title={`Dashboard — ${currentUser.name}`}
        subtitle="Manage your service requests, incoming client bookings, and published Gigs."
        action={
          <Link
            to="/gigs/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-700"
          >
            <span>+</span>
            <span>Post New Gig</span>
          </Link>
        }
      />

      {error && <ErrorNote message={error} />}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Published Services
          </span>
          <div className="mt-1.5 text-2xl font-bold text-slate-900">{myGigs.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Pending Requests
          </span>
          <div className="mt-1.5 text-2xl font-bold text-amber-600">{pending.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Accepted Bookings
          </span>
          <div className="mt-1.5 text-2xl font-bold text-emerald-600">{accepted.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Contracted Value
          </span>
          <div className="mt-1.5 text-2xl font-bold text-slate-900">{formatINR(totalEarnings)}</div>
        </div>
      </div>

      {/* Pending Requests Section */}
      {rows === null ? (
        <Spinner label="Loading dashboard data…" />
      ) : (
        <div className="space-y-8">
          {/* Pending requests */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Pending Requests ({pending.length})
              </h2>
              {pending.length > 0 && (
                <span className="text-xs text-slate-400">
                  Accepting a request automatically locks the gig and declines competing pending requests (DP2).
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                No pending requests right now.
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{b.gig_title}</span>
                        <StatusBadge status={b.status} />
                        {unread[b.id] > 0 && (
                          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            {unread[b.id]} new
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Client: <span className="font-semibold text-slate-700">{b.client_name}</span> · Deadline:{" "}
                        <span className="font-semibold text-slate-700">{formatDeadline(b.deadline)}</span> · Price:{" "}
                        <span className="font-bold text-slate-900">{formatINR(b.agreed_price ?? b.offer_price ?? b.gig_rate)}</span>
                      </p>
                      {b.initial_message && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg mt-1">
                          "{b.initial_message}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/bookings/${b.id}`}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        💬 Chat & Details
                      </Link>
                      <button
                        onClick={() => decide(b.id, "accepted")}
                        disabled={actingId === b.id}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actingId === b.id ? "…" : "Accept"}
                      </button>
                      <button
                        onClick={() => decide(b.id, "declined")}
                        disabled={actingId === b.id}
                        className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Decided Bookings History */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Booking History ({accepted.length + (rows.length - pending.length - accepted.length)})
            </h2>

            {rows.length - pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                No past decided bookings yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
                <ul className="divide-y divide-slate-100">
                  {rows
                    .filter((b) => b.status !== "pending")
                    .map((b) => (
                      <li
                        key={b.id}
                        className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center hover:bg-slate-50/50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{b.gig_title}</span>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Client: {b.client_name} · Due {formatDeadline(b.deadline)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-slate-900">
                            {formatINR(b.agreed_price ?? b.gig_rate)}
                          </span>
                          <Link
                            to={`/bookings/${b.id}`}
                            className="text-xs font-semibold text-violet-600 hover:underline"
                          >
                            View thread →
                          </Link>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
