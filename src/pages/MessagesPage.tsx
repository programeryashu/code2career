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
      const [dms, myBookings, created] = await Promise.all([
        api.listDmThreads(currentUser.id),
        api.listMyBookings(currentUser.id),
        currentUser ? api.listGigsByCreator(currentUser.id) : Promise.resolve([]),
      ]);
      const creatorGigIds = new Set(created.map((g) => g.id));
      // Bookings where I'm the client OR the creator (their chat is mine).
      const allMine = new Map<number, BookingWithDetails | BookingWithGig>();
      for (const b of myBookings) allMine.set(b.id, b);
      try {
        const incoming = await api.listCreatorBookings(currentUser.id);
        for (const b of incoming) if (!allMine.has(b.id)) allMine.set(b.id, b);
      } catch {
        // creator list is optional here
      }
      void creatorGigIds;

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
          title: `Booking #${b.id} — ${withGig.gig_title ?? "gig"}`,
          preview:
            b.initial_message ??
            msgs[msgs.length - 1]?.body ??
            "Project details & negotiation",
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
        body="Pick a persona (top-right) to open your inbox."
      />
    );
  }

  const others = users.filter((u) => u.id !== currentUser.id);

  return (
    <div>
      <PageHeading
        title="Messages"
        subtitle="Direct conversations — with creators, clients, and per-booking chats."
      />

      {error && <ErrorNote message={error} />}

      {/* New conversation picker */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Start a new conversation
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {others.map((u) => (
            <button
              key={u.id}
              onClick={() => startConversation(u.id)}
              disabled={starting != null}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"
            >
              {starting === u.id ? "Opening…" : `💬 ${u.name}`}
            </button>
          ))}
        </div>
      </div>

      {rows === null ? (
        <Spinner label="Loading your inbox…" />
      ) : rows.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No conversations yet"
          body="Message a creator from any gig page, or pick someone above."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key}>
              <Link
                to={r.to}
                onClick={() => currentUser && markSeen(currentUser.id, r.key)}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-lg">
                  {r.kind === "dm" ? "💬" : "📦"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-900">{r.title}</span>
                    {r.unread > 0 && (
                      <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {r.unread} new
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-slate-500">
                    {r.preview}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(r.when).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
