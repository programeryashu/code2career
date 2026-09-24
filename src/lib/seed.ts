// Demo dataset. The backend seeds the same rows on first boot, so mock and
// live modes tell the same story (two "React" gigs for DP3, a pair of
// pending bookings for the DP2 accept-cascade demo, one declined booking
// for the DP1 view).

import type { Booking, Gig, User } from "./types";

export const seedUsers: User[] = [
  { id: 1, name: "Priya Sharma", created_at: "2026-09-18T09:00:00Z" },
  { id: 2, name: "Arjun Mehta", created_at: "2026-09-18T09:05:00Z" },
  { id: 3, name: "Sara Khan", created_at: "2026-09-19T10:00:00Z" },
  { id: 4, name: "Rahul Verma", created_at: "2026-09-19T11:00:00Z" },
];

export const seedGigs: Gig[] = [
  {
    id: 1,
    creator_id: 1,
    title: "React Dashboard Development",
    category: "Development",
    rate: 2500,
    description:
      "I will build a responsive admin dashboard in React with charts, tables and dark mode.",
    created_at: "2026-09-20T08:00:00Z",
  },
  {
    id: 2,
    creator_id: 2,
    title: "YouTube Video Editing",
    category: "Video Editing",
    rate: 999,
    description:
      "Fast turnaround edits for talking-head and gaming videos — cuts, captions, sound cleanup.",
    created_at: "2026-09-20T09:30:00Z",
  },
  {
    id: 3,
    creator_id: 3,
    title: "Logo Design",
    category: "Design",
    rate: 500,
    description:
      "A clean, memorable logo with two revision rounds and final files in SVG and PNG.",
    created_at: "2026-09-21T10:15:00Z",
  },
  {
    id: 4,
    creator_id: 1,
    title: "React Landing Page",
    category: "Development",
    rate: 2000,
    description:
      "I will build a responsive React landing page with smooth animations and mobile-first layout.",
    created_at: "2026-09-21T12:00:00Z",
  },
  {
    id: 5,
    creator_id: 4,
    title: "Math Tutoring (Class 9–12)",
    category: "Tutoring",
    rate: 400,
    description:
      "One-hour online sessions covering algebra, calculus and board-exam problem solving.",
    created_at: "2026-09-22T07:45:00Z",
  },
  {
    id: 6,
    creator_id: 2,
    title: "Instagram Reels Editing",
    category: "Video Editing",
    rate: 300,
    description:
      "Snappy vertical edits with trending audio sync, subtitles and hook-first pacing.",
    created_at: "2026-09-22T14:20:00Z",
  },
  {
    id: 7,
    creator_id: 3,
    title: "Full Stack Website (MERN)",
    category: "Development",
    rate: 4000,
    description:
      "End-to-end website with React frontend, Express API and MongoDB — deployment included.",
    created_at: "2026-09-22T16:00:00Z",
  },
  {
    id: 8,
    creator_id: 4,
    title: "Acoustic Guitar Track",
    category: "Music",
    rate: 1500,
    description:
      "A custom-recorded acoustic bed for your video — up to 2 minutes, delivered as WAV + MP3.",
    created_at: "2026-09-23T09:10:00Z",
  },
  {
    id: 9,
    creator_id: 1,
    title: "Blog Writing & SEO",
    category: "Content",
    rate: 700,
    description:
      "A researched 1,000-word article with keywords, headings and a meta description.",
    created_at: "2026-09-23T11:30:00Z",
  },
  {
    id: 10,
    creator_id: 3,
    title: "Pitch Deck Design",
    category: "Design",
    rate: 1200,
    description:
      "A 10-slide investor-ready deck — clean layout, icons and consistent typography.",
    created_at: "2026-09-23T15:45:00Z",
  },
];

export const seedBookings: Booking[] = [
  {
    id: 1,
    gig_id: 2,
    client_id: 4,
    client_name: "Rahul Verma",
    deadline: "2026-09-30",
    status: "accepted",
    created_at: "2026-09-21T09:00:00Z",
    initial_message:
      "Hi Arjun! Can you edit my 12-min gaming video into a fast highlight cut? Captions in English, raw footage in Drive — link attached.",
    offer_price: null,
    offer_by: null,
    agreed_price: null,
  },
  {
    id: 2,
    gig_id: 4,
    client_id: 4,
    client_name: "Rahul Verma",
    deadline: "2026-10-05",
    status: "pending",
    created_at: "2026-09-23T10:00:00Z",
    initial_message:
      "I need a landing page for my study app — 4 sections, mobile-first. Brand colors: indigo/white.",
    offer_price: 1600,
    offer_by: "client",
    agreed_price: null,
  },
  {
    id: 3,
    gig_id: 3,
    client_id: 4,
    client_name: "Rahul Verma",
    deadline: "2026-09-28",
    status: "declined",
    created_at: "2026-09-22T12:30:00Z",
    initial_message: null,
    offer_price: null,
    offer_by: null,
    agreed_price: null,
  },
  // DP2 demo pair: two pendings on the same gig, so accepting one
  // auto-declines the other on the creator dashboard.
  {
    id: 4,
    gig_id: 5,
    client_id: 2,
    client_name: "Arjun Mehta",
    deadline: "2026-10-02",
    status: "pending",
    created_at: "2026-09-23T13:00:00Z",
    initial_message: "Board-exam crash course for my brother, Class 10 — algebra focus.",
    offer_price: 350,
    offer_by: "client",
    agreed_price: null,
  },
  {
    id: 5,
    gig_id: 5,
    client_id: 3,
    client_name: "Sara Khan",
    deadline: "2026-10-04",
    status: "pending",
    created_at: "2026-09-23T14:00:00Z",
    initial_message: null,
    offer_price: null,
    offer_by: null,
    agreed_price: null,
  },
];

export const seedMessages: import("./types").Message[] = [
  { id: 1, booking_id: 1, sender_id: 4, sender_name: "Rahul Verma", kind: "user",
    body: "Hi Arjun! Can you edit my 12-min gaming video into a fast highlight cut? Captions in English, raw footage in Drive — link attached.",
    created_at: "2026-09-21T09:00:05Z" },
  { id: 2, booking_id: 1, sender_id: 2, sender_name: "Arjun Mehta", kind: "user",
    body: "Hey Rahul — on it. Send the Drive link whenever, I'll have a first cut by the 28th.",
    created_at: "2026-09-21T10:00:00Z" },
  { id: 3, booking_id: 2, sender_id: 4, sender_name: "Rahul Verma", kind: "user",
    body: "I need a landing page for my study app — 4 sections, mobile-first. Brand colors: indigo/white.",
    created_at: "2026-09-23T10:00:05Z" },
  { id: 4, booking_id: 2, sender_id: null, sender_name: "SkillSwap", kind: "system",
    body: "💬 Rahul Verma offered ₹1,600 (listed: ₹2,000).",
    created_at: "2026-09-23T10:01:00Z" },
  { id: 5, booking_id: 4, sender_id: 2, sender_name: "Arjun Mehta", kind: "user",
    body: "Board-exam crash course for my brother, Class 10 — algebra focus.",
    created_at: "2026-09-23T13:00:05Z" },
  { id: 6, booking_id: 4, sender_id: null, sender_name: "SkillSwap", kind: "system",
    body: "💬 Arjun Mehta offered ₹350 (listed: ₹400).",
    created_at: "2026-09-23T13:01:00Z" },
];

/** What the API client stores locally to remember "who" is using the app. */
export type ClientUserView = {
  users: User[];
  bookings: Booking[];
  nextUserId: number;
  /** Gigs created while in mock mode (beyond the seed rows). */
  createdGigs?: Gig[];
  nextGigId?: number;
  /** Chat threads per booking (mock mode persistence). */
  messages: import("./types").Message[];
  nextMessageId: number;
  /** Direct user-to-user conversations (mock mode persistence). */
  dmThreads: { id: number; user_a_id: number; user_b_id: number; created_at: string }[];
  dmMessages: import("./types").DmMessage[];
  nextDmThreadId: number;
  nextDmMessageId: number;
};

export const initialClientState: ClientUserView = {
  users: seedUsers,
  bookings: seedBookings,
  nextUserId: seedUsers.length + 1,
  messages: seedMessages,
  nextMessageId: seedMessages.length + 1,
  dmThreads: [
    { id: 1, user_a_id: 1, user_b_id: 4, created_at: "2026-09-22T09:00:00Z" },
  ],
  dmMessages: [
    { id: 1, thread_id: 1, sender_id: 4, sender_name: "Rahul Verma",
      body: "Hey Priya! Loved your React dashboard work — do you also take MERN apps?",
      created_at: "2026-09-22T09:00:00Z" },
    { id: 2, thread_id: 1, sender_id: 1, sender_name: "Priya Sharma",
      body: "Thanks Rahul! Yes — MERN is my main stack. What are you building?",
      created_at: "2026-09-22T09:05:00Z" },
    { id: 3, thread_id: 1, sender_id: 4, sender_name: "Rahul Verma",
      body: "A study-planner web app for our college. I'll book the MERN gig once the feature list is final.",
      created_at: "2026-09-22T09:08:00Z" },
  ],
  nextDmThreadId: 2,
  nextDmMessageId: 4,
};
