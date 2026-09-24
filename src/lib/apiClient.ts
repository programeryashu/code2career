// One API interface, two implementations: `mock` (in-memory demo data, the
// same rows the backend seeds) and `live` (fetch against the FastAPI API).
// Pages only ever import `api`, so the swap is a single env var.

import { initialClientState, seedGigs } from "./seed";
import {
  ApiError,
  type BargainPayload,
  type BookingCreate,
  type BookingStatusUpdate,
  type BookingWithDetails,
  type BookingWithGig,
  type Category,
  type DmMessage,
  type DmThread,
  type Gig,
  type GigAssist,
  type GigCreate,
  type GigWithCreator,
  type Message,
  type MessageCreate,
  type SortOption,
  type User,
} from "./types";
import type { ClientUserView } from "./seed";

export interface ISkillswapApi {
  listUsers(): Promise<User[]>;
  createUser(name: string): Promise<User>;

  listGigs(params?: {
    q?: string;
    category?: Category | "All";
    sort?: SortOption;
  }): Promise<GigWithCreator[]>;
  getGig(id: number): Promise<GigWithCreator>;
  createGig(payload: GigCreate): Promise<Gig>;

  createBooking(payload: BookingCreate): Promise<BookingWithDetails>;
  getBooking(id: number): Promise<BookingWithDetails>;
  listMyBookings(clientId: number): Promise<BookingWithDetails[]>;
  listCreatorBookings(creatorId: number): Promise<BookingWithGig[]>;
  updateBookingStatus(
    bookingId: number,
    payload: BookingStatusUpdate,
  ): Promise<{ ok: true }>;

  // Chat + bargain
  listMessages(bookingId: number): Promise<Message[]>;
  postMessage(bookingId: number, payload: MessageCreate): Promise<Message>;
  bargain(bookingId: number, payload: BargainPayload): Promise<BookingWithDetails>;

  // Direct messages + profiles + AI assist
  getUser(id: number): Promise<User>;
  listGigsByCreator(creatorId: number): Promise<GigWithCreator[]>;
  assistGig(text: string): Promise<GigAssist>;
  listDmThreads(userId: number): Promise<DmThread[]>;
  openDmThread(meId: number, otherUserId: number): Promise<DmThread>;
  listDmMessages(threadId: number, viewerId: number): Promise<DmMessage[]>;
  postDmMessage(threadId: number, payload: { sender_id: number; body: string }): Promise<DmMessage>;
}

const MODE: "mock" | "live" =
  import.meta.env.VITE_API_MODE === "live" ? "live" : "mock";
export const API_MODE = MODE;

// ---------------------------------------------------------------------------
// Mock implementation — in-memory state with identical response shapes.
// Persistence: users/bookings kept in localStorage (per browser, mock only).
// ---------------------------------------------------------------------------

const STORAGE_KEY = "skillswap_mock_state_v3";

function loadMockState(): ClientUserView {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ClientUserView;
  } catch {
    // corrupted state → fall through to a fresh seed
  }
  return initialClientState;
}

function saveMockState(state: ClientUserView): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // private-mode browsers etc. — mock still works for this session
  }
}

let mockState: ClientUserView = loadMockState();

/** Reset mock state to the seed dataset (handy for demos). */
export function resetMockData(): void {
  mockState = initialClientState;
  saveMockState(mockState);
}

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function gigRows(): GigWithCreator[] {
  // Static seed gigs + user-created gigs this session, merged by id.
  const byId = new Map<number, GigWithCreator>();
  for (const g of [...mockState.createdGigs ?? [], ...seedGigs]) {
    byId.set(g.id, {
      ...g,
      creator_name:
        mockState.users.find((u) => u.id === g.creator_id)?.name ?? "Unknown",
      is_open: !mockState.bookings.some(
        (b) => b.gig_id === g.id && b.status === "accepted",
      ),
    });
  }
  return [...byId.values()];
}

async function mockListGigs(params?: {
  q?: string;
  category?: Category | "All";
  sort?: SortOption;
}): Promise<GigWithCreator[]> {
  await wait();
  const q = params?.q?.trim().toLowerCase() ?? "";
  const category = params?.category ?? "All";
  const sort = params?.sort ?? "recommended";

  let rows = gigRows();
  if (category !== "All") rows = rows.filter((g) => g.category === category);
  if (q) {
    rows = rows.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q),
    );
  }

  if (sort === "price_asc") {
    rows.sort((a, b) => a.rate - b.rate);
  } else if (sort === "newest") {
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else {
    // DP3 — Recommended: relevance first (title match > description match),
    // newest as tiebreak. Without a query this is simply newest-first.
    rows.sort((a, b) => score(b, q) - score(a, q) || b.created_at.localeCompare(a.created_at));
  }
  return rows;
}

function score(gig: GigWithCreator, q: string): number {
  if (!q) return 1;
  if (gig.title.toLowerCase().includes(q)) return 3;
  if (gig.description.toLowerCase().includes(q)) return 2;
  return 1;
}

const mockApi: ISkillswapApi = {
  async listUsers() {
    await wait(60);
    return [...mockState.users];
  },

  async createUser(name) {
    await wait(60);
    const user: User = {
      id: mockState.nextUserId,
      name: name.trim(),
      created_at: new Date().toISOString(),
    };
    mockState = { ...mockState, users: [...mockState.users, user], nextUserId: user.id + 1 };
    saveMockState(mockState);
    return user;
  },

  async listGigs(params) {
    return mockListGigs(params);
  },

  async getGig(id) {
    await wait(80);
    const gig = gigRows().find((g) => g.id === id);
    if (!gig) throw new ApiError(404, "Gig not found");
    return gig;
  },

  async createGig(payload) {
    await wait(200);
    const nextGigId = mockState.nextGigId ?? seedGigs.length + 1;
    const gig = {
      id: nextGigId,
      ...payload,
      created_at: new Date().toISOString(),
    };
    mockState = {
      ...mockState,
      createdGigs: [...(mockState.createdGigs ?? []), gig],
      nextGigId: nextGigId + 1,
    };
    saveMockState(mockState);
    return gig;
  },

  async createBooking(payload) {
    await wait(200);
    const gig = gigRows().find((g) => g.id === payload.gig_id);
    if (!gig) throw new ApiError(404, "Gig not found");
    // DP2 — a gig with an accepted booking is exclusive and closed.
    if (!gig.is_open) {
      throw new ApiError(409, "This gig is no longer accepting bookings.");
    }
    if (payload.offer_price !== undefined && payload.offer_price >= gig.rate) {
      throw new ApiError(422, "Offer must be below the listed rate — book at the full rate by leaving the offer empty.");
    }
    const booking = {
      id: Math.max(...mockState.bookings.map((b) => b.id)) + 1,
      gig_id: payload.gig_id,
      client_id: payload.client_id,
      client_name: payload.client_name,
      deadline: payload.deadline,
      status: "pending" as const,
      created_at: new Date().toISOString(),
      initial_message: payload.initial_message ?? null,
      offer_price: payload.offer_price ?? null,
      offer_by: payload.offer_price != null ? ("client" as const) : null,
      agreed_price: null,
    };
    mockState = { ...mockState, bookings: [...mockState.bookings, booking] };
    if (payload.initial_message) {
      pushMessage(booking.id, payload.client_id, payload.initial_message);
    }
    if (payload.offer_price != null) {
      pushSystemMessage(
        booking.id,
        `💬 ${payload.client_name} offered ₹${payload.offer_price.toLocaleString("en-IN")} (listed: ₹${gig.rate.toLocaleString("en-IN")}).`,
      );
    }
    saveMockState(mockState);
    return toBookingWithDetails(booking);
  },

  async getBooking(id) {
    await wait(80);
    const booking = mockState.bookings.find((b) => b.id === id);
    if (!booking) throw new ApiError(404, "Booking not found");
    return toBookingWithDetails(booking);
  },

  async listMyBookings(clientId) {
    await wait(120);
    return mockState.bookings
      .filter((b) => b.client_id === clientId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(toBookingWithDetails);
  },

  async listCreatorBookings(creatorId) {
    await wait(120);
    const myGigIds = new Set(
      [...(mockState.createdGigs ?? []), ...seedGigs]
        .filter((g) => g.creator_id === creatorId)
        .map((g) => g.id),
    );
    return mockState.bookings
      .filter((b) => myGigIds.has(b.gig_id))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(toBookingWithGig);
  },

  async updateBookingStatus(bookingId, payload) {
    await wait(150);
    const booking = mockState.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new ApiError(404, "Booking not found");
    // DP1 — a decision is final; declined bookings cannot change again.
    if (booking.status !== "pending") {
      throw new ApiError(409, `This booking was already ${booking.status}.`);
    }
    const gig = [...(mockState.createdGigs ?? []), ...seedGigs].find(
      (g) => g.id === booking.gig_id,
    );
    if (!gig || gig.creator_id !== payload.actor_id) {
      throw new ApiError(403, "Only the gig's creator can decide this booking.");
    }
    let bookings = mockState.bookings.map((b) =>
      b.id === bookingId ? { ...b, status: payload.status } : b,
    );
    // DP2 — accepting one booking auto-declines the other pending ones.
    if (payload.status === "accepted") {
      bookings = bookings.map((b) =>
        b.gig_id === booking.gig_id && b.id !== bookingId && b.status === "pending"
          ? { ...b, status: "declined" as const }
          : b,
      );
      // Bonus: a plain accept at the listed rate closes any open offer.
      if (booking.offer_price != null && booking.agreed_price == null) {
        bookings = bookings.map((b) =>
          b.id === bookingId ? { ...b, offer_price: null, offer_by: null } : b,
        );
        pushSystemMessage(bookingId, "✅ Creator accepted this booking at the listed rate.");
      }
    }
    mockState = { ...mockState, bookings };
    saveMockState(mockState);
    return { ok: true };
  },

  async listMessages(bookingId) {
    await wait(100);
    requirePartyMock(bookingId, currentActorHint);
    return mockState.messages
      .filter((m) => m.booking_id === bookingId)
      .sort((a, b) => a.id - b.id)
      .map(cloneMsg);
  },

  async postMessage(bookingId, payload) {
    await wait(120);
    requirePartyMock(bookingId, payload.sender_id);
    const booking = mockState.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new ApiError(404, "Booking not found");
    if (booking.status === "declined") {
      throw new ApiError(409, "Chat is closed on a declined booking.");
    }
    return pushMessage(bookingId, payload.sender_id, payload.body.trim());
  },

  async getUser(id) {
    await wait(60);
    const user = mockState.users.find((u) => u.id === id);
    if (!user) throw new ApiError(404, "User not found");
    return { ...user };
  },

  async listGigsByCreator(creatorId) {
    await wait(100);
    return gigRows()
      .filter((g) => g.creator_id === creatorId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async assistGig(text) {
    await wait(600);
    const t = text.toLowerCase();
    const rules: [Category, string[]][] = [
      ["Video Editing", ["video", "edit", "reels", "youtube", "premiere", "capcut"]],
      ["Tutoring", ["tutor", "teach", "math", "physics", "chemistry", "exam"]],
      ["Music", ["music", "guitar", "song", "beat", "sing", "track", "audio"]],
      ["Content", ["write", "blog", "article", "copy", "script", "seo", "newsletter"]],
      ["Design", ["logo", "design", "deck", "brand", "poster", "thumbnail", "figma"]],
      ["Development", ["react", "website", "web", "app", "code", "python", "dashboard", "landing", "mern", "html", "css"]],
    ];
    let category: Category = "Development";
    for (const [cat, kws] of rules) {
      if (kws.some((k) => new RegExp(`\\\\b${k}`).test(t))) {
        category = cat;
        break;
      }
    }
    let clean = text.trim().replace(/[.!?\s]+$/, "");
    const lowered = clean.toLowerCase();
    for (const filler of ["i can ", "i will ", "i am ", "i'm ", "i "]) {
      if (lowered.startsWith(filler)) {
        clean = clean.slice(filler.length);
        break;
      }
    }
    const core = clean.charAt(0).toLowerCase() + clean.slice(1);
    const short = core.length > 60 ? core.slice(0, 57) + "…" : core;
    const title = short.charAt(0).toUpperCase() + short.slice(1);
    const description =
      `I will ${core}. ` +
      "Delivered on time with clear communication and up to two revision rounds.";
    return { title, category, description };
  },

  async listDmThreads(userId) {
    await wait(100);
    const mine = mockState.dmThreads.filter(
      (t) => t.user_a_id === userId || t.user_b_id === userId,
    );
    const outs = mine.map((t) => {
      const otherId = t.user_a_id === userId ? t.user_b_id : t.user_a_id;
      const other = mockState.users.find((u) => u.id === otherId);
      const msgs = mockState.dmMessages
        .filter((m) => m.thread_id === t.id)
        .sort((a, b) => a.id - b.id);
      const last = msgs[msgs.length - 1];
      return {
        id: t.id,
        other_user_id: otherId,
        other_user_name: other?.name ?? "Unknown",
        last_message: last?.body ?? null,
        last_message_at: last?.created_at ?? t.created_at,
        created_at: t.created_at,
      };
    });
    outs.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
    return outs;
  },

  async openDmThread(meId, otherUserId) {
    await wait(120);
    const me = mockState.users.find((u) => u.id === meId);
    if (!me) throw new ApiError(404, "Pick who you are first.");
    const other = mockState.users.find((u) => u.id === otherUserId);
    if (!other) throw new ApiError(404, "That user does not exist.");
    if (other.id === me.id) throw new ApiError(400, "You cannot message yourself.");
    const lo = Math.min(me.id, other.id);
    const hi = Math.max(me.id, other.id);
    let thread = mockState.dmThreads.find(
      (t) => t.user_a_id === lo && t.user_b_id === hi,
    );
    if (!thread) {
      thread = {
        id: mockState.nextDmThreadId,
        user_a_id: lo,
        user_b_id: hi,
        created_at: new Date().toISOString(),
      };
      mockState = {
        ...mockState,
        dmThreads: [...mockState.dmThreads, thread],
        nextDmThreadId: thread.id + 1,
      };
      saveMockState(mockState);
    }
    const otherName = other.name;
    const msgs = mockState.dmMessages.filter((m) => m.thread_id === thread!.id);
    const last = [...msgs].sort((a, b) => a.id - b.id).pop();
    return {
      id: thread.id,
      other_user_id: other.id,
      other_user_name: otherName,
      last_message: last?.body ?? null,
      last_message_at: last?.created_at ?? thread.created_at,
      created_at: thread.created_at,
    };
  },

  async listDmMessages(threadId, viewerId) {
    await wait(90);
    const thread = mockState.dmThreads.find((t) => t.id === threadId);
    if (!thread) throw new ApiError(404, "Conversation not found");
    if (viewerId !== thread.user_a_id && viewerId !== thread.user_b_id) {
      throw new ApiError(403, "This conversation is private.");
    }
    return mockState.dmMessages
      .filter((m) => m.thread_id === threadId)
      .sort((a, b) => a.id - b.id)
      .map((m) => ({ ...m }));
  },

  async postDmMessage(threadId, payload) {
    await wait(110);
    const thread = mockState.dmThreads.find((t) => t.id === threadId);
    if (!thread) throw new ApiError(404, "Conversation not found");
    if (payload.sender_id !== thread.user_a_id && payload.sender_id !== thread.user_b_id) {
      throw new ApiError(403, "This conversation is private.");
    }
    const body = payload.body.trim();
    if (!body) throw new ApiError(422, "Message cannot be empty.");
    const sender = mockState.users.find((u) => u.id === payload.sender_id);
    const msg: DmMessage = {
      id: mockState.nextDmMessageId,
      thread_id: threadId,
      sender_id: payload.sender_id,
      sender_name: sender?.name ?? "Unknown",
      body,
      created_at: new Date().toISOString(),
    };
    mockState = {
      ...mockState,
      dmMessages: [...mockState.dmMessages, msg],
      nextDmMessageId: msg.id + 1,
    };
    saveMockState(mockState);
    return { ...msg };
  },

  async bargain(bookingId, payload) {
    await wait(150);
    const booking = mockState.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new ApiError(404, "Booking not found");
    const gig = [...(mockState.createdGigs ?? []), ...seedGigs].find((g) => g.id === booking.gig_id);
    if (!gig) throw new ApiError(404, "Gig not found");
    requirePartyMock(bookingId, payload.actor_id);
    if (booking.status !== "pending") {
      throw new ApiError(409, "Price is locked once the booking is decided.");
    }
    const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    const isClient = payload.actor_id === booking.client_id;
    const isCreator = gig.creator_id === payload.actor_id;

    if (payload.action === "offer") {
      if (!isClient) throw new ApiError(403, "Only the client can make an opening offer.");
      if (booking.offer_price != null) throw new ApiError(409, "There is already an offer on the table.");
      if (payload.price == null || payload.price >= gig.rate) {
        throw new ApiError(422, `Offer must be below the listed rate (${fmt(gig.rate)}).`);
      }
      const updated = { ...booking, offer_price: payload.price, offer_by: "client" as const };
      mockState = { ...mockState, bookings: mockState.bookings.map((b) => (b.id === bookingId ? updated : b)) };
      pushSystemMessage(bookingId, `💬 ${booking.client_name} offered ${fmt(payload.price)} (listed: ${fmt(gig.rate)}).`);
      saveMockState(mockState);
      return toBookingWithDetails(updated);
    }

    if (booking.offer_price == null) throw new ApiError(409, "No offer on the table to respond to.");
    const holderIsClient = booking.offer_by === "client";
    if ((holderIsClient && !isCreator) || (!holderIsClient && !isClient)) {
      throw new ApiError(403, "Wait for the other side to respond to your offer.");
    }

    if (payload.action === "accept") {
      const agreed = booking.offer_price;
      const updated = { ...booking, agreed_price: agreed, offer_price: null, offer_by: null };
      mockState = { ...mockState, bookings: mockState.bookings.map((b) => (b.id === bookingId ? updated : b)) };
      pushSystemMessage(bookingId, `🤝 Price agreed at ${fmt(agreed)} (listed: ${fmt(gig.rate)}).`);
      saveMockState(mockState);
      return toBookingWithDetails(updated);
    }

    if (payload.action === "counter") {
      if (payload.price == null) throw new ApiError(422, "Counter-offer needs a price.");
      if (payload.price >= gig.rate) {
        throw new ApiError(422, `Counter must stay below the listed rate (${fmt(gig.rate)}).`);
      }
      const updated = { ...booking, offer_price: payload.price, offer_by: holderIsClient ? ("creator" as const) : ("client" as const) };
      mockState = { ...mockState, bookings: mockState.bookings.map((b) => (b.id === bookingId ? updated : b)) };
      pushSystemMessage(bookingId, `🔁 Counter-offer: ${fmt(payload.price)} (listed: ${fmt(gig.rate)}).`);
      saveMockState(mockState);
      return toBookingWithDetails(updated);
    }

    // decline
    const updated = { ...booking, offer_price: null, offer_by: null };
    mockState = { ...mockState, bookings: mockState.bookings.map((b) => (b.id === bookingId ? updated : b)) };
    pushSystemMessage(bookingId, "❌ Bargain declined — the listed rate stands.");
    saveMockState(mockState);
    return toBookingWithDetails(updated);
  },
};

// ---- mock chat/bargain helpers -------------------------------------------

/** Mock only: last actor seen, used to check read access to a thread. */
let currentActorHint: number | null = null;
export function setMockActorHint(userId: number | null): void {
  currentActorHint = userId;
}

function requirePartyMock(bookingId: number, actorId: number | null): void {
  const booking = mockState.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  const gig = [...(mockState.createdGigs ?? []), ...seedGigs].find((g) => g.id === booking.gig_id);
  const creatorId = gig?.creator_id;
  if (actorId == null || ![booking.client_id, creatorId].includes(actorId)) {
    throw new ApiError(403, "Only the client or the gig's creator can do this.");
  }
}

function nextMsgId(): number {
  const id = mockState.nextMessageId;
  mockState = { ...mockState, nextMessageId: id + 1 };
  return id;
}

function cloneMsg(m: Message): Message {
  return { ...m };
}

function pushMessage(bookingId: number, senderId: number, body: string): Message {
  const senderName =
    mockState.users.find((u) => u.id === senderId)?.name ?? "Unknown";
  const msg: Message = {
    id: nextMsgId(),
    booking_id: bookingId,
    sender_id: senderId,
    sender_name: senderName,
    kind: "user",
    body,
    created_at: new Date().toISOString(),
  };
  mockState = { ...mockState, messages: [...mockState.messages, msg] };
  saveMockState(mockState);
  return cloneMsg(msg);
}

function pushSystemMessage(bookingId: number, body: string): void {
  const msg: Message = {
    id: nextMsgId(),
    booking_id: bookingId,
    sender_id: null,
    sender_name: "SkillSwap",
    kind: "system",
    body,
    created_at: new Date().toISOString(),
  };
  mockState = { ...mockState, messages: [...mockState.messages, msg] };
  saveMockState(mockState);
}

function toBookingWithDetails(b: (typeof mockState)["bookings"][number]): BookingWithDetails {
  const gig = [...(mockState.createdGigs ?? []), ...seedGigs].find((g) => g.id === b.gig_id);
  return {
    ...b,
    gig_title: gig?.title ?? "Unknown gig",
    gig_category: gig?.category ?? "Design",
    rate: gig?.rate ?? 0,
    creator_name:
      mockState.users.find((u) => u.id === gig?.creator_id)?.name ?? "Unknown",
  };
}

function toBookingWithGig(b: (typeof mockState)["bookings"][number]): BookingWithGig {
  const gig = [...(mockState.createdGigs ?? []), ...seedGigs].find((g) => g.id === b.gig_id);
  return {
    ...b,
    gig_title: gig?.title ?? "Unknown gig",
    gig_rate: gig?.rate ?? 0,
    gig_category: gig?.category ?? "Design",
  };
}

// ---------------------------------------------------------------------------
// Live implementation — fetch against the FastAPI backend.
// ---------------------------------------------------------------------------

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function liveFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the SkillSwap API. Is the backend running?");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) detail = "Please check the form fields.";
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const liveApi: ISkillswapApi = {
  listUsers: () => liveFetch<User[]>("/users"),
  createUser: (name) =>
    liveFetch<User>("/users", { method: "POST", body: JSON.stringify({ name }) }),

  listGigs: (params) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.category && params.category !== "All")
      search.set("category", params.category);
    if (params?.sort) search.set("sort", params.sort);
    const qs = search.toString();
    return liveFetch<GigWithCreator[]>(`/gigs${qs ? `?${qs}` : ""}`);
  },
  getGig: (id) => liveFetch<GigWithCreator>(`/gigs/${id}`),
  createGig: (payload) =>
    liveFetch<Gig>("/gigs", { method: "POST", body: JSON.stringify(payload) }),

  createBooking: (payload) =>
    liveFetch<BookingWithDetails>("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getBooking: (id) => liveFetch<BookingWithDetails>(`/bookings/${id}`),
  listMyBookings: (clientId) =>
    liveFetch<BookingWithDetails[]>(`/bookings?client_id=${clientId}`),
  listCreatorBookings: (creatorId) =>
    liveFetch<BookingWithGig[]>(`/creator/bookings?creator_id=${creatorId}`),
  updateBookingStatus: (bookingId, payload) =>
    liveFetch<{ ok: true }>(`/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  listMessages: (bookingId) => liveFetch<Message[]>(`/bookings/${bookingId}/messages`),
  postMessage: (bookingId, payload) =>
    liveFetch<Message>(`/bookings/${bookingId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  bargain: (bookingId, payload) =>
    liveFetch<BookingWithDetails>(`/bookings/${bookingId}/bargain`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getUser: (id) => liveFetch<User>(`/users/${id}`),
  listGigsByCreator: (creatorId) =>
    liveFetch<GigWithCreator[]>(`/gigs?creator_id=${creatorId}`),
  assistGig: (text) =>
    liveFetch<GigAssist>("/gigs/assist", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  listDmThreads: (userId) =>
    liveFetch<DmThread[]>(`/dm/threads?user_id=${userId}`),
  openDmThread: (meId, otherUserId) =>
    liveFetch<DmThread>("/dm/threads", {
      method: "POST",
      body: JSON.stringify({ me_id: meId, other_user_id: otherUserId }),
    }),
  listDmMessages: (threadId, viewerId) =>
    liveFetch<DmMessage[]>(`/dm/threads/${threadId}/messages?viewer_id=${viewerId}`),
  postDmMessage: (threadId, payload) =>
    liveFetch<DmMessage>(`/dm/threads/${threadId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ---------------------------------------------------------------------------

export const api: ISkillswapApi = MODE === "live" ? liveApi : mockApi;
