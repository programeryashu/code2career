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
        <Link to="/marketplace" className="text-xs font-semibold text-violet-700 hover:underline">
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
    } catch (err) {
      setError((err as Error).message);
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
        className="text-xs font-semibold text-violet-700 hover:underline"
      >
        ← Back to {isClient ? "My Bookings" : "Creator Dashboard"}
      </Link>

      {/* Booking summary header card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Booking #{booking.id}
              </span>
              <StatusBadge status={booking.status} />
            </div>

            <h1 className="mt-2 text-xl font-bold text-slate-900">{booking.gig_title}</h1>

            <p className="mt-1 text-xs text-slate-500">
              {isClient ? (
                <>Creator: <span className="font-semibold text-slate-700">{booking.creator_name}</span></>
              ) : (
                <>Client: <span className="font-semibold text-slate-700">{booking.client_name}</span></>
              )}{" "}
              · Target deadline: <span className="font-medium text-slate-700">{formatDeadline(booking.deadline)}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatINR(effectiveRate)}
            </div>
            {booking.agreed_price != null && (
              <p className="text-[11px] font-semibold text-emerald-600">
                Negotiated from {formatINR(booking.rate)}
              </p>
            )}
          </div>
        </div>

        {/* In-Thread Bargaining Panel */}
        {booking.status === "pending" && (
          <div className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
            {booking.agreed_price != null ? (
              <p className="text-xs font-semibold text-emerald-800">
                🤝 Agreed price: {formatINR(booking.agreed_price)} — locked in once accepted by the creator.
              </p>
            ) : offerOnTable != null ? (
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  {offerHolder === "client" ? "Client" : "Creator"} proposed rate:{" "}
                  <span className="font-bold text-sm">{formatINR(offerOnTable)}</span>{" "}
                  <span className="text-[11px] font-normal text-slate-500">(Listed: {formatINR(booking.rate)})</span>
                </p>

                {canRespond ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => bargain("accept")}
                      disabled={bargainBusy}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      🤝 Accept {formatINR(offerOnTable)}
                    </button>
                    <input
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      inputMode="numeric"
                      placeholder="Counter ₹"
                      className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none"
                    />
                    <button
                      onClick={() => bargain("counter", Number(counterPrice))}
                      disabled={bargainBusy || !Number(counterPrice) || Number(counterPrice) >= booking.rate}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    >
                      Counter
                    </button>
                    <button
                      onClick={() => bargain("decline")}
                      disabled={bargainBusy}
                      className="rounded-lg border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Decline offer
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-amber-800">
                    Waiting for response from {offerHolder === "client" ? "creator" : "client"}.
                  </p>
                )}
              </div>
            ) : canOpenOffer ? (
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Propose custom pricing? Listed standard rate is {formatINR(booking.rate)}.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    value={newOffer}
                    onChange={(e) => setNewOffer(e.target.value)}
                    inputMode="numeric"
                    placeholder={`Offer ₹ (below ${booking.rate})`}
                    className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-900 focus:outline-none"
                  />
                  <button
                    onClick={() => bargain("offer", Number(newOffer))}
                    disabled={bargainBusy || !Number(newOffer) || Number(newOffer) >= booking.rate}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
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
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Booking confirmed and locked in. Ready to structure deliverables?
            </span>
            <button
              type="button"
              onClick={generateProjectBrief}
              disabled={briefLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition disabled:opacity-50"
            >
              <span>✨</span>
              <span>{briefLoading ? "Structuring Brief…" : brief ? "View AI Project Brief" : "Generate AI Project Brief"}</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Project Brief Panel */}
      {briefOpen && brief && (
        <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">🤖</span>
              <h3 className="text-sm font-bold text-slate-900">AI Project Brief</h3>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                Auto-Generated
              </span>
            </div>
            <button
              onClick={() => setBriefOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕ Close
            </button>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Objective
            </h4>
            <p className="mt-1 text-xs text-slate-700">{brief.objective}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Deliverables Checklist
            </h4>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
              {brief.deliverables.map((d, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Suggested Milestones
            </h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {brief.milestones.map((m, i) => (
                <li key={i} className="rounded bg-slate-50 p-2">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Direct Messaging & Negotiation Chat */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900">Direct Messages & Project Chat</h2>
          <p className="text-xs text-slate-400">
            Coordinates requirements, deliverables, and updates securely between client and creator.
          </p>
        </div>

        {/* Message Stream */}
        <div className="max-h-[24rem] space-y-3 overflow-y-auto px-6 py-4">
          {messages.map((m) =>
            m.kind === "system" ? (
              <div key={m.id} className="text-center">
                <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
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
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p
                    className={`mb-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      m.sender_id === currentUser.id ? "text-violet-200" : "text-slate-400"
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
          <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400 bg-slate-50 text-center rounded-b-2xl">
            Conversation is closed on a declined booking.
          </div>
        ) : (
          <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-4">
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
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <h1 className="text-lg font-bold text-slate-900">{props.gigTitle}</h1>
        <p className="mt-1 text-xs text-slate-500">
          {props.creatorName} · {props.clientName} · Due {props.deadline}
        </p>
        <p className="mt-3 text-xl font-extrabold text-slate-900">
          {formatINR(props.rate)}
          {props.agreed && <span className="ml-1 text-xs text-emerald-600 font-medium">(Bargained)</span>}
        </p>
        <div className="mt-3 flex justify-center">
          <StatusBadge status={props.status} />
        </div>
        <p className="mt-6 text-xs text-slate-500">
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
