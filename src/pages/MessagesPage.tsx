import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState, ErrorNote, PageHeading, Spinner } from "../components/ui";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { markSeen, unreadCount } from "../lib/seen";
import type { BookingWithDetails, BookingWithGig } from "../lib/types";

interface InboxRow {
  key: string;
  to: string;
  title: string;
  preview: string;
  when: string;
  unread: number;
  kind: "dm" | "booking";
}

export default function MessagesPage() {
  const { currentUser, users } = useUsers();
  const navigate = useNavigate();
  const [rows, setRows] = useState<InboxRow[] | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [dms, myBookings] = await Promise.all([
        api.listDmThreads(currentUser.id),
        api.listMyBookings(currentUser.id),
      ]);

      const allMine = new Map<number, BookingWithDetails | BookingWithGig>();
      for (const b of myBookings) allMine.set(b.id, b);
      try {
        const incoming = await api.listCreatorBookings(currentUser.id);
        for (const b of incoming) if (!allMine.has(b.id)) allMine.set(b.id, b);
      } catch {
        // creator list optional
      }

      const dmRows: InboxRow[] = [];
      for (const t of dms) {
        const msgs = await api
          .listDmMessages(t.id, currentUser.id)
          .catch(() => []);
        dmRows.push({
          key: `dm-${t.id}`,
          to: `/dm/${t.id}`,
          title: t.other_user_name,
          preview: t.last_message ?? "No messages yet",
          when: t.last_message_at,
          unread: unreadCount(currentUser.id, `dm-${t.id}`, msgs, currentUser.id),
          kind: "dm",
        });
      }

      const bookingRows: InboxRow[] = [];
      for (const b of allMine.values()) {
        const msgs = await api.listMessages(b.id).catch(() => []);
        const withGig = b as BookingWithDetails;
        bookingRows.push({
          key: `booking-${b.id}`,
          to: `/bookings/${b.id}`,
          title: `Booking #${b.id} — ${withGig.gig_title ?? "service"}`,
          preview:
            b.initial_message ??
            msgs[msgs.length - 1]?.body ??
            "Project details and negotiation thread",
          when: b.created_at,
          unread: unreadCount(currentUser.id, `booking-${b.id}`, msgs, currentUser.id),
          kind: "booking",
        });
      }

      const all = [...dmRows, ...bookingRows].sort((a, b) =>
        b.when.localeCompare(a.when),
      );
      setRows(all);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setRows([]);
    }
  }, [currentUser]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  async function startConversation(otherUserId: number) {
    if (!currentUser || starting != null) return;
    setStarting(otherUserId);
    try {
      const thread = await api.openDmThread(currentUser.id, otherUserId);
      markSeen(currentUser.id, `dm-${thread.id}`);
      navigate(`/dm/${thread.id}`);
    } catch (e) {
      setError((e as Error).message);
      setStarting(null);
    }
  }

  if (!currentUser) {
    return (
      <EmptyState
        emoji="🙋"
        title="Who are you messaging as?"
        body="Select a persona from the top-right switcher to open your inbox and direct message threads."
      />
    );
  }

  const others = users.filter((u) => u.id !== currentUser.id);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Messages & Conversations"
        subtitle="Direct communication with clients, creators, and active booking threads."
      />

      {error && <ErrorNote message={error} />}

      {/* Start conversation quick pills */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Start a new direct message
        </span>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {others.map((u) => (
            <button
              key={u.id}
              onClick={() => startConversation(u.id)}
              disabled={starting != null}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {starting === u.id ? "Opening…" : `💬 ${u.name}`}
            </button>
          ))}
        </div>
      </div>

      {/* Message List */}
      {rows === null ? (
        <Spinner label="Loading conversations…" />
      ) : rows.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No conversations yet"
          body="Message a creator from any service page or start a conversation with the personas above."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <li key={r.key}>
                <Link
                  to={r.to}
                  onClick={() => currentUser && markSeen(currentUser.id, r.key)}
                  className="flex items-center gap-3.5 p-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm dark:bg-zinc-800">
                    {r.kind === "dm" ? "💬" : "📦"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-bold text-slate-900 dark:text-zinc-100">{r.title}</span>
                      {r.unread > 0 && (
                        <span className="rounded-full bg-violet-600 px-2 py-0.2 text-[10px] font-bold text-white dark:bg-violet-500">
                          {r.unread} new
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-zinc-400">{r.preview}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400 dark:text-zinc-500">
                    {new Date(r.when).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
