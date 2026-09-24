import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import {
  ErrorNote,
  Spinner,
  btnGhost,
  btnPrimary,
  inputClass,
} from "../components/ui";
import { useFeedback } from "../components/Feedback";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { formatDeadline, formatINR } from "../lib/format";
import type {
  BookingWithDetails,
  Message,
  OfferHolder,
} from "../lib/types";

interface GeneratedBrief {
  objective: string;
  deliverables: string[];
  milestones: string[];
  notes: string;
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const { currentUser } = useUsers();
  const { toast } = useFeedback();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // Bargain inputs
  const [counterPrice, setCounterPrice] = useState("");
  const [newOffer, setNewOffer] = useState("");
  const [bargainBusy, setBargainBusy] = useState(false);

  // AI Project Brief state
  const [brief, setBrief] = useState<GeneratedBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    if (!id) return;
    api
      .getBooking(Number(id))
      .then((b) => {
        setBooking(b);
        return api.getGig(b.gig_id);
      })
      .then((g) => setCreatorId(g.creator_id))
      .catch((e: Error) => setError(e.message));
    api
      .listMessages(Number(id))
      .then(setMessages)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (loading) return <Spinner label="Loading booking thread…" />;
  if (error || !booking)
    return (
      <div className="space-y-4">
        <ErrorNote message={error || "Booking not found."} />
        <Link to="/marketplace" className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400">
          ← Back to marketplace
        </Link>
      </div>
    );

  if (!currentUser) {
    return (
      <EmptyStateBlocking
        gigTitle={booking.gig_title}
        creatorName={booking.creator_name}
        clientName={booking.client_name}
        deadline={formatDeadline(booking.deadline)}
        rate={booking.agreed_price ?? booking.rate}
        agreed={booking.agreed_price != null}
        status={booking.status}
      />
    );
  }

  const isClient = currentUser.id === booking.client_id;
  const isCreator = creatorId != null && currentUser.id === creatorId;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !draft.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.postMessage(Number(id), {
        sender_id: currentUser.id,
        body: draft.trim(),
      });
      setMessages((m) => [...m, msg]);
      setDraft("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function bargain(action: "offer" | "accept" | "counter" | "decline", price?: number) {
    if (!currentUser || bargainBusy) return;
    setBargainBusy(true);
    try {
      const updated = await api.bargain(Number(id), {
        actor_id: currentUser.id,
        action,
        ...(price !== undefined ? { price } : {}),
      });
      setBooking(updated);
      setCounterPrice("");
      setNewOffer("");
      const msgs = await api.listMessages(Number(id));
      setMessages(msgs);
      const label =
        action === "offer"
          ? `Offer of ${formatINR(price ?? 0)} sent`
          : action === "accept"
            ? "Offer accepted — price agreed 🤝"
            : action === "counter"
              ? `Counter-offer of ${formatINR(price ?? 0)} sent`
              : "Offer declined";
      toast(label, action === "decline" ? "info" : "success");
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message, "error");
    } finally {
      setBargainBusy(false);
    }
  }

  function generateProjectBrief() {
    setBriefLoading(true);
    setBriefOpen(true);
    setTimeout(() => {
      setBrief({
        objective: `Deliver high-quality ${booking?.gig_title} aligned with client requirements and schedule.`,
        deliverables: [
          "Initial project draft and architecture alignment",
          "Core feature implementation and visual polish",
          "Final QA check, responsive testing and asset delivery",
        ],
        milestones: [
          `Phase 1 (Day 1-2): Setup and scope sign-off`,
          `Phase 2 (Day 3-4): Draft delivery and client feedback round`,
          `Phase 3 (By ${formatDeadline(booking?.deadline || "")}): Final handover and acceptance`,
        ],
        notes: `Agreed rate: ${formatINR(booking?.agreed_price ?? booking?.rate ?? 0)}. Work begins upon creator confirmation.`,
      });
      setBriefLoading(false);
      toast("AI Project Brief generated ✨", "success");
    }, 400);
  }

  const effectiveRate = booking.agreed_price ?? booking.rate;
  const offerOnTable = booking.offer_price;
  const offerHolder: OfferHolder | null = booking.offer_by;
  const iHoldOffer = (offerHolder === "client" && isClient) || (offerHolder === "creator" && isCreator);
  const canOpenOffer = isClient && offerOnTable == null && booking.status === "pending" && booking.agreed_price == null;
  const canRespond = offerOnTable != null && !iHoldOffer && booking.status === "pending" && booking.agreed_price == null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to={isClient ? "/my-bookings" : "/dashboard"}
        className="text-xs font-semibold text-violet-700 hover:underline dark:text-violet-400"
      >
        ← Back to {isClient ? "My Bookings" : "Creator Dashboard"}
      </Link>

      {/* Booking summary header card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Booking #{booking.id}
              </span>
              <StatusBadge status={booking.status} />
            </div>

            <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-zinc-100">{booking.gig_title}</h1>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              {isClient ? (
                <>Creator: <span className="font-semibold text-slate-700 dark:text-zinc-300">{booking.creator_name}</span></>
              ) : (
                <>Client: <span className="font-semibold text-slate-700 dark:text-zinc-300">{booking.client_name}</span></>
              )}{" "}
              · Target deadline: <span className="font-medium text-slate-700 dark:text-zinc-300">{formatDeadline(booking.deadline)}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">
              {formatINR(effectiveRate)}
            </div>
            {booking.agreed_price != null && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Negotiated from {formatINR(booking.rate)}
              </p>
            )}
          </div>
        </div>

        {/* In-Thread Bargaining Panel */}
        {booking.status === "pending" && (
          <div className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-500/25 dark:bg-amber-950/25">
            {booking.agreed_price != null ? (
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                🤝 Agreed price: {formatINR(booking.agreed_price)} — locked in once accepted by the creator.
              </p>
            ) : offerOnTable != null ? (
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                  {offerHolder === "client" ? "Client" : "Creator"} proposed rate:{" "}
                  <span className="text-sm font-bold">{formatINR(offerOnTable)}</span>{" "}
                  <span className="text-[11px] font-normal text-slate-500 dark:text-zinc-500">(Listed: {formatINR(booking.rate)})</span>
                </p>

                {canRespond ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => bargain("accept")}
                      disabled={bargainBusy}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                    >
                      🤝 Accept {formatINR(offerOnTable)}
                    </button>
                    <input
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      inputMode="numeric"
                      placeholder="Counter ₹"
                      className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      onClick={() => bargain("counter", Number(counterPrice))}
                      disabled={bargainBusy || !Number(counterPrice) || Number(counterPrice) >= booking.rate}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 active:scale-95 disabled:opacity-50 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-950/40"
                    >
                      Counter
                    </button>
                    <button
                      onClick={() => bargain("decline")}
                      disabled={bargainBusy}
                      className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 active:scale-95 disabled:opacity-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-950/40"
                    >
                      Decline offer
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-amber-800 dark:text-amber-300/80">
                    Waiting for response from {offerHolder === "client" ? "creator" : "client"}.
                  </p>
                )}
              </div>
            ) : canOpenOffer ? (
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                  Propose custom pricing? Listed standard rate is {formatINR(booking.rate)}.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    value={newOffer}
                    onChange={(e) => setNewOffer(e.target.value)}
                    inputMode="numeric"
                    placeholder={`Offer ₹ (below ${booking.rate})`}
                    className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={() => bargain("offer", Number(newOffer))}
                    disabled={bargainBusy || !Number(newOffer) || Number(newOffer) >= booking.rate}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                  >
                    Send offer
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* AI Project Brief Trigger for Accepted Bookings */}
        {booking.status === "accepted" && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-800">
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Booking confirmed and locked in. Ready to structure deliverables?
            </span>
            <button
              type="button"
              onClick={generateProjectBrief}
              disabled={briefLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 active:scale-95 disabled:opacity-50 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70"
            >
              <span>✨</span>
              <span>{briefLoading ? "Structuring Brief…" : brief ? "View AI Project Brief" : "Generate AI Project Brief"}</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Project Brief Panel */}
      {briefOpen && brief && (
        <div className="animate-fadeIn space-y-4 rounded-2xl border border-violet-200 bg-white p-6 shadow-sm dark:border-violet-500/30 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-sm">🤖</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">AI Project Brief</h3>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                Auto-Generated
              </span>
            </div>
            <button
              onClick={() => setBriefOpen(false)}
              className="text-xs text-slate-400 transition hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              ✕ Close
            </button>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Objective
            </h4>
            <p className="mt-1 text-xs text-slate-700 dark:text-zinc-300">{brief.objective}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Deliverables Checklist
            </h4>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-zinc-300">
              {brief.deliverables.map((d, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Suggested Milestones
            </h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-zinc-400">
              {brief.milestones.map((m, i) => (
                <li key={i} className="rounded bg-slate-50 p-2 dark:bg-zinc-900">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Direct Messaging & Negotiation Chat */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Direct Messages & Project Chat</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Coordinates requirements, deliverables, and updates securely between client and creator.
          </p>
        </div>

        {/* Message Stream */}
        <div className="max-h-[24rem] space-y-3 overflow-y-auto px-6 py-4">
          {messages.map((m) =>
            m.kind === "system" ? (
              <div key={m.id} className="text-center">
                <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {m.body}
                </span>
              </div>
            ) : (
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
            ),
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input box */}
        {booking.status === "declined" ? (
          <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-3 text-center text-xs text-slate-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
            Conversation is closed on a declined booking.
          </div>
        ) : (
          <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-4 dark:border-zinc-800">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={isClient ? "Message the creator…" : "Message the client…"}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className={`${btnPrimary} shrink-0 px-5`}
            >
              {sending ? "…" : "Send"}
            </button>
          </form>
        )}
      </div>

      {error && <ErrorNote message={error} />}
    </div>
  );
}

function EmptyStateBlocking(props: {
  gigTitle: string;
  creatorName: string;
  clientName: string;
  deadline: string;
  rate: number;
  agreed: boolean;
  status: BookingWithDetails["status"];
}) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100">{props.gigTitle}</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          {props.creatorName} · {props.clientName} · Due {props.deadline}
        </p>
        <p className="mt-3 text-xl font-extrabold text-slate-900 dark:text-zinc-100">
          {formatINR(props.rate)}
          {props.agreed && <span className="ml-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">(Bargained)</span>}
        </p>
        <div className="mt-3 flex justify-center">
          <StatusBadge status={props.status} />
        </div>
        <p className="mt-6 text-xs text-slate-500 dark:text-zinc-400">
          Select a persona from the top-right switcher to open the conversation and negotiation thread.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link to="/marketplace" className={btnPrimary}>
            Marketplace
          </Link>
          <Link to="/my-bookings" className={btnGhost}>
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
