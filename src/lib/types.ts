// Shared domain types — identical shapes to the FastAPI backend responses.

export type Category =
  | "Design"
  | "Development"
  | "Video Editing"
  | "Tutoring"
  | "Music"
  | "Content";

export const CATEGORIES: Category[] = [
  "Design",
  "Development",
  "Video Editing",
  "Tutoring",
  "Music",
  "Content",
];

export const CATEGORY_EMOJI: Record<Category, string> = {
  Design: "🎨",
  Development: "💻",
  "Video Editing": "🎬",
  Tutoring: "📚",
  Music: "🎵",
  Content: "✍️",
};

export type BookingStatus = "pending" | "accepted" | "declined";

export interface User {
  id: number;
  name: string;
  created_at: string;
}

export interface Gig {
  id: number;
  creator_id: number;
  title: string;
  category: Category;
  rate: number; // INR
  description: string;
  created_at: string;
}

/** GET /gigs rows include the creator's name for the marketplace cards. */
export interface GigWithCreator extends Gig {
  creator_name: string;
  /** DP2 surfacing: once a gig has an accepted booking, it is closed. */
  is_open: boolean;
  /** Aggregate rating across the creator's gigs (live API only). */
  rating_avg?: number | null;
  rating_count?: number;
}

export interface GigCreate {
  creator_id: number;
  title: string;
  category: Category;
  rate: number;
  description: string;
}

export type SortOption = "recommended" | "newest" | "price_asc" | "price_desc";

export type OfferHolder = "client" | "creator";

export interface Booking {
  id: number;
  gig_id: number;
  client_id: number;
  client_name: string;
  deadline: string; // YYYY-MM-DD
  status: BookingStatus;
  created_at: string;
  // Chat + bargain state
  initial_message: string | null;
  offer_price: number | null;
  offer_by: OfferHolder | null;
  agreed_price: number | null;
}

/** GET /bookings rows include everything the client's list needs. */
export interface BookingWithDetails extends Booking {
  gig_title: string;
  gig_category: Category;
  rate: number;
  creator_name: string;
}

/** GET /creator/bookings rows include everything the dashboard needs. */
export interface BookingWithGig extends Booking {
  gig_title: string;
  gig_rate: number;
  gig_category: Category;
}

export interface BookingCreate {
  gig_id: number;
  client_id: number;
  client_name: string;
  deadline: string; // YYYY-MM-DD
  initial_message?: string;
  offer_price?: number;
}

/** A chat message on a booking. sender_id === null → system event. */
export interface Message {
  id: number;
  booking_id: number;
  sender_id: number | null;
  sender_name: string;
  kind: "user" | "system";
  body: string;
  created_at: string;
}

export interface MessageCreate {
  sender_id: number;
  body: string;
}

export type BargainAction = "offer" | "accept" | "counter" | "decline";

export interface BargainPayload {
  actor_id: number;
  action: BargainAction;
  price?: number;
}

export interface BookingStatusUpdate {
  status: "accepted" | "declined";
  /** Required when acting on someone else's booking (the creator). */
  actor_id: number;
}

/** Raised by the API client when the backend rejects a request. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ------------------------------------------------------------ direct messages

/** A user-to-user conversation, independent of bookings. */
export interface DmThread {
  id: number;
  other_user_id: number;
  other_user_name: string;
  last_message: string | null;
  last_message_at: string;
  created_at: string;
}

export interface DmMessage {
  id: number;
  thread_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  created_at: string;
}

// ------------------------------------------------------------ gig assistant

export interface GigAssist {
  title: string;
  category: Category;
  description: string;
}
