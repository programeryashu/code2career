# ⚡ SkillSwap — Student Gig Marketplace

Hackathon ID: AZIS-XA4ZYC

A full-stack marketplace where student creators post services (websites, design, video editing, tutoring…) and clients book them — with real booking rules, smart discovery, and AI assist features.

React + TypeScript + Vite + Tailwind · FastAPI + SQLAlchemy + SQLite

![CI](https://github.com/programeryashu/code2career/actions/workflows/ci.yml/badge.svg)

## Repository map

```
code2career/
├── src/            # Frontend — React SPA (pages, components, mock + live API client)
├── backend/        # Backend — FastAPI service (routes, models, seed data, 18 tests)
│   └── README.md   # Full API reference & backend docs
├── render.yaml     # Render blueprint for one-click backend deploy
└── .github/        # CI: backend pytest + frontend typecheck/build
```

The frontend ships with a **swappable API client**: the entire app runs on in-memory mock data by default, and flips to the real FastAPI backend by changing one env var. Both modes share the same seed story (5 personas, 10 gigs, bookings, reviews), so the demo looks identical either way.

## Features

**Marketplace core**
- Post a gig · browse, keyword-search, filter by category, sort by price/recency
- Book a gig with deadline + free-text requirements
- Creator dashboard to accept/decline requests · My Bookings with status timeline
- Creator profiles with bios, skill chips, and aggregate ratings
- Reviews & ratings (only accepted clients can review, once per gig)
- Saved gigs · notification bell for pending requests

**Booking rules (backend-enforced)**
- **DP1 — single active booking:** a gig holds at most one accepted booking; booking an unavailable gig is rejected with a clear reason
- **DP2 — state machine:** `PENDING → ACCEPTED / DECLINED` with timestamped decisions; accepting one request **auto-declines all sibling pending requests** in the same transaction
- **Creator-only decisions** (`403`) and immutable decided bookings (`409`)

**Discovery & AI**
- **DP3 — smart search:** `"React developer under 3000"` is parsed server-side for category + budget hints; plain keyword search still works
- **AI Gig Builder:** a sentence like *"I can make websites using React and Tailwind"* becomes a prefilled gig draft
- **AI Project Brief:** accepted bookings generate a structured brief (objective, deliverables, milestones, timeline)
- AI endpoints use OpenAI when `OPENAI_API_KEY` is set, with a deterministic offline fallback — zero setup required

## Quickstart

### Option A — frontend only (mock mode, no backend needed)

```bash
npm install
npm run dev
```

### Option B — full stack (live mode)

```bash
# Terminal 1 — backend on :8000
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend on :5173
npm install
cp .env.example .env.local         # Windows: copy .env.example .env.local
# edit .env.local:  VITE_API_MODE=live   (leave VITE_API_URL empty —
#                    the Vite dev proxy forwards /api to 127.0.0.1:8000)
npm run dev
```

- Frontend: http://localhost:5173
- API docs (Swagger): http://127.0.0.1:8000/docs

### Seeded demo personas

| ID | Name | Role |
|----|------|------|
| 1  | Ashutosh | Client hiring for startup projects |
| 2  | Rahul | Full-stack developer (React gigs) |
| 3  | Priya | Frontend / dashboards |
| 4  | Zoya | Designer (logo, decks) |
| 5  | Kabir | Video editor & writer |

## Deployment

### Backend → Render

The repo includes a **blueprint** (`render.yaml`) — in Render: *New → Blueprint →* pick this repo, and the service is configured automatically.

Manual setup (if not using the blueprint):

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/health` |

Environment variables:

| Variable | Required | Purpose |
|---|---|---|
| `CORS_ORIGINS` | ✅ | Your deployed frontend URL, e.g. `https://skillswap.vercel.app` — comma-separate multiple origins, or `*` to allow any origin (handy for demos and Vercel preview deploys) |
| `OPENAI_API_KEY` | optional | Enables real LLM calls; without it the AI endpoints use the built-in fallback |
| `SKILLSWAP_DB` | optional | SQLite path. On the free tier the disk is ephemeral — the DB auto-reseeds on every restart, which is fine for demos. To persist, attach a Render disk and set this to `/var/data/skillswap.db` |

### Frontend → Vercel (or any static host)

Vercel auto-detects Vite. Set:

| Variable | Value |
|---|---|
| `VITE_API_MODE` | `live` |
| `VITE_API_URL` | Your Render URL, e.g. `https://skillswap-api.onrender.com` (no trailing slash) |

Then add the deployed frontend URL to the backend's `CORS_ORIGINS` — requests will pass with the standard `fetch` from the browser.

## Testing & CI

```bash
cd backend && pytest -v   # 18 tests: CRUD, DP1/DP2 rules, reviews, smart search, AI fallback
npm run typecheck         # frontend types
npm run build             # frontend production build
```

CI runs on every push/PR: **backend** installs pinned deps and runs `pytest`; **frontend** runs `tsc --noEmit` and the production build.

## Documentation

- [`backend/README.md`](backend/README.md) — architecture, business rules, full API reference, env vars, seed data
