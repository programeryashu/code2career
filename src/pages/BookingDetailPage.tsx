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

  if (loading) return <Spinner label="Loading conversation…" />;
  if (error || !booking)
    return (
      <div className="space-y-4">
        <ErrorNote message={error || "Booking not found."} />
        <Link to="/" className="text-sm font-semibold text-violet-700 hover:underline">
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

  const effectiveRate = booking.agreed_price ?? booking.rate;
  const offerOnTable = booking.offer_price;
  const offerHolder: OfferHolder | null = booking.offer_by;
  const iHoldOffer = (offerHolder === "client" && isClient) || (offerHolder === "creator" && isCreator);
  const canOpenOffer = isClient && offerOnTable == null && booking.status === "pending" && booking.agreed_price == null;
  const canRespond = offerOnTable != null && !iHoldOffer && booking.status === "pending" && booking.agreed_price == null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to={isClient ? "/my-bookings" : "/dashboard"}
        className="text-sm font-semibold text-violet-700 hover:underline"
      >
        ← Back to {isClient ? "My Bookings" : "Creator Dashboard"}
      </Link>

      {/* Booking summary */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Booking #{booking.id}
            </p>
            <h1 className="mt-1 text-xl font-extrabold text-slate-900">{booking.gig_title}</h1>
            <p className="text-sm text-slate-500">
              {isClient ? (
                <>Creator: <span className="font-semibold text-slate-700">{booking.creator_name}</span></>
              ) : (
                <>Client: <span className="font-semibold text-slate-700">{booking.client_name}</span></>
              )}{" "}
              · due {formatDeadline(booking.deadline)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-slate-900">{formatINR(effectiveRate)}</div>
            {booking.agreed_price != null && (
              <p className="text-xs text-emerald-600">
                bargained from {formatINR(booking.rate)}
              </p>
            )}
            <div className="mt-1">
              <StatusBadge status={booking.status} />
            </div>
          </div>
        </div>

        {/* Bargain panel */}
        {booking.status === "pending" && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            {booking.agreed_price != null ? (
              <p className="text-sm font-semibold text-emerald-700">
                🤝 Price agreed at {formatINR(booking.agreed_price)} — locked in when the creator accepts.
              </p>
            ) : offerOnTable != null ? (
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {offerHolder === "client" ? "Client" : "Creator"} offer on the table:{" "}
                  <span className="text-lg">{formatINR(offerOnTable)}</span>{" "}
                  <span className="font-normal text-slate-500">(listed: {formatINR(booking.rate)})</span>
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
                      placeholder="counter ₹"
                      className={`${inputClass} w-28 py-1.5 text-sm`}
                    />
                    <button
                      onClick={() => bargain("counter", Number(counterPrice))}
                      disabled={bargainBusy || !Number(counterPrice) || Number(counterPrice) >= booking.rate}
                      className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                    >
                      🔁 Counter
                    </button>
                    <button
                      onClick={() => bargain("decline")}
                      disabled={bargainBusy}
                      className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      ✖ Decline offer
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-amber-700">
                    Waiting for the {offerHolder === "client" ? "creator" : "client"} to respond.
                  </p>
                )}
              </div>
            ) : canOpenOffer ? (
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Want to bargain? Listed rate is {formatINR(booking.rate)}.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={newOffer}
                    onChange={(e) => setNewOffer(e.target.value)}
                    inputMode="numeric"
                    placeholder={`offer ₹ (below ${booking.rate})`}
                    className={`${inputClass} w-44 py-1.5 text-sm`}
                  />
                  <button
                    onClick={() => bargain("offer", Number(newOffer))}
                    disabled={bargainBusy || !Number(newOffer) || Number(newOffer) >= booking.rate}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    💬 Send offer
                  </button>
                </div>
              </div>
            ) : (
              offerHolder != null &&
              offerOnTable != null && (
                <p className="text-xs text-amber-700">
                  You sent {formatINR(offerOnTable)} — waiting for the{" "}
                  {offerHolder === "client" ? "creator" : "client"} to respond.
                </p>
              )
            )}
          </div>
        )}
        {booking.status !== "pending" && (
          <p className="mt-4 text-xs text-slate-400">
            {booking.agreed_price != null
              ? `Agreed price: ${formatINR(booking.agreed_price)}.`
              : null}{" "}
            Price is locked once a booking is decided.
          </p>
        )}
      </div>

      {/* Chat thread */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-bold text-slate-900">💬 Direct messages</h2>
          <p className="text-xs text-slate-400">
            Project details, links and info — visible only to you two.
          </p>
        </div>
        <div className="max-h-[26rem] space-y-3 overflow-y-auto px-6 py-4">
          {messages.map((m) =>
            m.kind === "system" ? (
              <div key={m.id} className="text-center">
                <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  {m.body}
                </span>
              </div>
            ) : (
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
            ),
          )}
          <div ref={bottomRef} />
        </div>

        {booking.status === "declined" ? (
          <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-400">
            Chat is closed on a declined booking.
          </div>
        ) : (
          <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-4">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={isClient ? "Message the creator…" : "Message the client…"}
              className={inputClass}
            />
            <button type="submit" disabled={!draft.trim() || sending} className={btnPrimary}>
              {sending ? "…" : "Send"}
            </button>
          </form>
        )}
      </div>

      {error && <div className="mt-4"><ErrorNote message={error} /></div>}
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
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900">{props.gigTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {props.creatorName} · {props.clientName} · due {props.deadline}
        </p>
        <p className="mt-3 text-2xl font-extrabold text-slate-900">
          {formatINR(props.rate)}
          {props.agreed && <span className="ml-2 text-xs text-emerald-600">bargained</span>}
        </p>
        <div className="mt-2 flex justify-center">
          <StatusBadge status={props.status} />
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Pick a persona (top-right) to open the chat and bargain panel.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link to="/" className={btnPrimary}>
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
