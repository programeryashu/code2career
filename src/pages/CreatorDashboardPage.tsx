import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState, ErrorNote, PageHeading, Spinner } from "../components/ui";
import { useFeedback } from "../components/Feedback";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { formatDeadline, formatINR } from "../lib/format";
import { unreadCount } from "../lib/seen";
import type { BookingWithGig, GigWithCreator } from "../lib/types";

export default function CreatorDashboardPage() {
  const { currentUser } = useUsers();
  const { toast } = useFeedback();
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
      // Reload to reflect the DP2 cascade, then report what happened.
      const wasCascade = status === "accepted";
      const siblings = wasCascade
        ? (rows ?? []).filter(
            (b) =>
              b.id !== bookingId &&
              b.gig_id === (rows ?? []).find((r) => r.id === bookingId)?.gig_id &&
              b.status === "pending",
          ).length
        : 0;
      load();
      if (status === "accepted") {
        toast(
          siblings > 0
            ? `Booking accepted — gig locked and ${siblings} other request${siblings === 1 ? "" : "s"} auto-declined`
            : "Booking accepted — this gig is now locked",
          "success",
        );
      } else {
        toast("Booking declined", "info");
      }
    } catch (e) {
      setError((e as Error).message);
      toast((e as Error).message, "error");
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
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-violet-700"
          >
            <span>+</span>
            <span>Post New Gig</span>
          </Link>
        }
      />

      {error && <ErrorNote message={error} />}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Published Services
          </span>
          <div className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-zinc-100">{myGigs.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Pending Requests
          </span>
          <div className="mt-1.5 text-2xl font-bold text-amber-600 dark:text-amber-400">{pending.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Accepted Bookings
          </span>
          <div className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{accepted.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Contracted Value
          </span>
          <div className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-zinc-100">{formatINR(totalEarnings)}</div>
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                Pending Requests ({pending.length})
              </h2>
              {pending.length > 0 && (
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  Accepting a request automatically locks the gig and declines competing pending requests (DP2).
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                No pending requests right now.
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200/80 bg-white p-5 shadow-xs transition sm:flex-row sm:items-center dark:border-amber-500/25 dark:bg-zinc-900/60"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">{b.gig_title}</span>
                        <StatusBadge status={b.status} />
                        {unread[b.id] > 0 && (
                          <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-violet-500">
                            {unread[b.id]} new
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Client: <span className="font-semibold text-slate-700 dark:text-zinc-300">{b.client_name}</span> · Deadline:{" "}
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">{formatDeadline(b.deadline)}</span> · Price:{" "}
                        <span className="font-bold text-slate-900 dark:text-zinc-100">{formatINR(b.agreed_price ?? b.offer_price ?? b.gig_rate)}</span>
                      </p>
                      {b.initial_message && (
                        <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs italic text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                          "{b.initial_message}"
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        to={`/bookings/${b.id}`}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        💬 Chat & Details
                      </Link>
                      <button
                        onClick={() => decide(b.id, "accepted")}
                        disabled={actingId === b.id}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                      >
                        {actingId === b.id ? "…" : "Accept"}
                      </button>
                      <button
                        onClick={() => decide(b.id, "declined")}
                        disabled={actingId === b.id}
                        className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95 disabled:opacity-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-950/40"
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
              Booking History ({accepted.length + (rows.length - pending.length - accepted.length)})
            </h2>

            {rows.length - pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                No past decided bookings yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {rows
                    .filter((b) => b.status !== "pending")
                    .map((b) => (
                      <li
                        key={b.id}
                        className="flex flex-col justify-between gap-3 p-4 transition-colors sm:flex-row sm:items-center hover:bg-slate-50/50 dark:hover:bg-zinc-800/40"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">{b.gig_title}</span>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                            Client: {b.client_name} · Due {formatDeadline(b.deadline)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                            {formatINR(b.agreed_price ?? b.gig_rate)}
                          </span>
                          <Link
                            to={`/bookings/${b.id}`}
                            className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
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
