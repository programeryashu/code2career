# ⚡ SkillSwap — Frontend

A creator gig marketplace where student creators turn their skills into opportunities.
React + TypeScript + Vite + Tailwind CSS + React Router.

> Backend (FastAPI + SQLite) lives in a separate private repo. This frontend
> talks to it through a single swappable API client.

## Run

```bash
npm install
npm run dev
```

- Default mode is **mock**: the whole app works on in-memory demo data (same
  dataset the backend seeds) — great for reviewing UI without a server.
- **Live mode:** set `VITE_API_MODE=live` in `.env.local` (see `.env.example`)
  and point `VITE_API_URL` at the FastAPI server.

## Features

- Post a gig · browse/search/filter marketplace · book with confirmation
- Creator dashboard (accept/decline) · My Bookings with status badges
- Per-booking chat, price bargaining, DMs between users, creator profiles
- AI Gig Assistant (backend-powered) · Decision Points DP1/DP2/DP3 documented
