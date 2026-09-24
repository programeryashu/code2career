import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState, ErrorNote, PageHeading, Spinner } from "../components/ui";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { formatDeadline, formatINR } from "../lib/format";
import { unreadCount } from "../lib/seen";
import type { BookingStatus, BookingWithDetails } from "../lib/types";

export default function MyBookingsPage() {
  const { currentUser } = useUsers();
  const [rows, setRows] = useState<BookingWithDetails[] | null>(null);
  const [unread, setUnread] = useState<Record<number, number>>({});
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState<BookingStatus | "all">("all");

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
        body="Select a client persona from the top-right switcher to see your requested services and status."
      />
    );
  }

  const filteredRows =
    rows?.filter((b) => (selectedTab === "all" ? true : b.status === selectedTab)) ?? [];

  return (
    <div className="space-y-6">
      <PageHeading
        title="My Bookings"
        subtitle={`Service requests and active projects initiated as ${currentUser.name}.`}
        action={
          <Link
            to="/marketplace"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-violet-700"
          >
            <span>Explore Services</span>
            <span>→</span>
          </Link>
        }
      />

      {error && <ErrorNote message={error} />}

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 border-b border-slate-200/80 pb-3 dark:border-zinc-800">
        {(
          [
            { id: "all", label: "All Requests" },
            { id: "pending", label: "Pending" },
            { id: "accepted", label: "Accepted" },
            { id: "declined", label: "Declined" },
          ] as const
        ).map((tab) => {
          const count =
            tab.id === "all"
              ? (rows?.length ?? 0)
              : (rows?.filter((b) => b.status === tab.id).length ?? 0);
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                selectedTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  selectedTab === tab.id
                    ? "bg-slate-800 text-white dark:bg-zinc-800 dark:text-zinc-100"
                    : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {rows === null ? (
        <Spinner label="Loading your bookings…" />
      ) : filteredRows.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No bookings in this category"
          body={
            selectedTab === "all"
              ? "Find a creator you like and book their service — your requests will appear here."
              : `You have no ${selectedTab} bookings right now.`
          }
          action={
            <Link
              to="/marketplace"
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
            >
              Explore services
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredRows.map((b) => (
            <div
              key={b.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-slate-300 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">{b.gig_title}</span>
                  <StatusBadge status={b.status} />
                  {b.agreed_price != null && (
                    <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                      🤝 Agreed {formatINR(b.agreed_price)}
                    </span>
                  )}
                  {unread[b.id] > 0 && (
                    <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-violet-500">
                      {unread[b.id]} new messages
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Creator:{" "}
                  <Link
                    to={`/creators/${b.gig_id}`}
                    className="font-semibold text-slate-700 transition hover:text-violet-700 hover:underline dark:text-zinc-300 dark:hover:text-violet-400"
                  >
                    {b.creator_name}
                  </Link>{" "}
                  · Target deadline: <span className="font-semibold text-slate-700 dark:text-zinc-300">{formatDeadline(b.deadline)}</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right">
                  <span className="block text-[10px] font-semibold uppercase text-slate-400 dark:text-zinc-500">
                    Rate
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                    {formatINR(b.agreed_price ?? b.rate)}
                  </span>
                </div>

                <Link
                  to={`/bookings/${b.id}`}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  View Details & Chat →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
