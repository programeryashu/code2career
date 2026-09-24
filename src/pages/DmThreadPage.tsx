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
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Select a persona from the top-right switcher to open this direct conversation.
        </p>
        <Link to="/messages" className="mt-3 inline-block text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400">
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
        <Link to="/messages" className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400">
          ← Back to Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/messages" className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400">
        ← Back to Messages
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              {(thread?.other_user_name ?? "?")[0]}
            </span>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {thread?.other_user_name ?? "Direct Message"}
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">Direct message conversation</p>
            </div>
          </div>

          {thread && (
            <Link
              to={`/creators/${thread.other_user_id}`}
              className="text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
            >
              View profile →
            </Link>
          )}
        </div>

        {/* Message feed */}
        <div className="max-h-[26rem] space-y-3 overflow-y-auto px-6 py-5">
          {messages.length === 0 && (
            <p className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
              Say hello 👋 — this is the start of your direct conversation.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.sender_id === currentUser.id
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                <p
                  className={`mb-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    m.sender_id === currentUser.id ? "text-violet-200" : "text-slate-400 dark:text-zinc-500"
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

        {/* Input box */}
        <form onSubmit={send} className="flex gap-2 border-t border-slate-100 bg-white p-4 dark:border-zinc-800 dark:bg-transparent">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className={`${btnPrimary} px-5`}
          >
            {sending ? "…" : "Send"}
          </button>
        </form>
      </div>

      {error && <ErrorNote message={error} />}
    </div>
  );
}
