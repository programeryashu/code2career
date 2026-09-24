import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorNote, Spinner, btnPrimary, inputClass } from "../components/ui";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { markSeen } from "../lib/seen";
import type { DmMessage, DmThread } from "../lib/types";

export default function DmThreadPage() {
  const { threadId } = useParams();
  const { currentUser } = useUsers();
  const [thread, setThread] = useState<DmThread | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!currentUser || !threadId) return;
    api
      .listDmMessages(Number(threadId), currentUser.id)
      .then((msgs) => {
        setMessages(msgs);
        setError("");
        markSeen(currentUser.id, `dm-${Number(threadId)}`);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
    api
      .listDmThreads(currentUser.id)
      .then((ts) => setThread(ts.find((t) => t.id === Number(threadId)) ?? null))
      .catch(() => undefined);
  }, [currentUser, threadId]);

  useEffect(load, [load]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !draft.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.postDmMessage(Number(threadId), {
        sender_id: currentUser.id,
        body: draft.trim(),
      });
      setMessages((m) => [...m, msg]);
      setDraft("");
      markSeen(currentUser.id, `dm-${Number(threadId)}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          Pick a persona (top-right) to open this conversation.
        </p>
        <Link to="/messages" className="mt-3 inline-block text-sm font-semibold text-violet-700 hover:underline">
          ← Back to Messages
        </Link>
      </div>
    );
  }
  if (loading) return <Spinner label="Loading conversation…" />;
  if (error && messages.length === 0) {
    return (
      <div className="space-y-4">
        <ErrorNote message={error} />
        <Link to="/messages" className="text-sm font-semibold text-violet-700 hover:underline">
          ← Back to Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/messages" className="text-sm font-semibold text-violet-700 hover:underline">
        ← Back to Messages
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
            {(thread?.other_user_name ?? "?")[0]}
          </span>
          <div>
            <h1 className="font-bold text-slate-900">
              {thread?.other_user_name ?? "Conversation"}
            </h1>
            <p className="text-xs text-slate-400">Direct message · private</p>
          </div>
          {thread && (
            <Link
              to={`/creators/${thread.other_user_id}`}
              className="ml-auto text-xs font-semibold text-violet-700 hover:underline"
            >
              View profile
            </Link>
          )}
        </div>

        <div className="max-h-[26rem] space-y-3 overflow-y-auto px-6 py-4">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              Say hello 👋 — this is the start of your conversation.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  m.sender_id === currentUser.id
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p
                  className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    m.sender_id === currentUser.id ? "text-violet-200" : "text-slate-400"
                  }`}
                >
                  {m.sender_name}
                </p>
                <p className="whitespace-pre-line">{m.body}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className={inputClass}
          />
          <button type="submit" disabled={!draft.trim() || sending} className={btnPrimary}>
            {sending ? "…" : "Send"}
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorNote message={error} />
        </div>
      )}
    </div>
  );
}
