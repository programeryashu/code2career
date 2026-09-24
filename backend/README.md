# SkillSwap — Backend

FastAPI + SQLAlchemy backend for **SkillSwap**, a student gig marketplace where creators post services (websites, design, video editing, tutoring…) and clients book them.

The repo root holds the React frontend; this folder is the complete, self-contained API service. It runs on SQLite with zero external services — AI endpoints call OpenAI **only if** `OPENAI_API_KEY` is set, and otherwise fall back to deterministic on-device heuristics.

---

## Features

### Core marketplace
- **Users** — creators and clients in one identity space, with bios and skill chips.
- **Gigs** — post, browse, keyword-search, filter by category, and sort (recommended / newest / price low→high / price high→low).
- **Bookings** — clients request a gig with a deadline and free-text requirements.

### Business rules (the interesting part)
- **Single-active-booking rule (DP1)** — a gig holds at most one `accepted` booking at a time; booking an unavailable gig is rejected with a clear `decided_reason`.
- **Booking state machine (DP2)** — `PENDING → ACCEPTED / DECLINED`, decisions recorded with timestamp + reason. When a creator accepts a request, **all other pending requests on that gig are auto-declined** ("Gig no longer available") in the same transaction.
- **Creator-only decisions** — only the gig's creator can accept/decline a booking (`403` otherwise); decided bookings are immutable (`409`).
- **Review integrity** — only clients with an accepted booking may review a gig (`403`), and only once per client per gig (`409`). Aggregate ratings are served on gigs and creator profiles.

### Discovery (DP3)
- **Smart search** — natural-language queries like `"React developer under 3000"` are parsed server-side for a **category hint** and a **budget cap**; keyword search still works as usual when no hints match.
- **Creator profiles** — bio, skills, service count, aggregate rating, gigs, and recent reviews in one payload.

### AI endpoints (with zero-setup fallback)
- **`POST /gigs/assist`** — the AI Gig Builder: a plain sentence like *"I can make websites using React and Tailwind"* becomes suggested title, category, description, and rate.
- **`POST /ai/project-brief`** — turns a client's booking requirement into a structured draft brief (objective, deliverables, milestones, estimated timeline) for accepted work.

Both use `gpt-4o-mini` when a key is configured; the heuristic fallback keeps them fully functional offline.

---

## Tech stack

| Layer      | Choice |
|------------|--------|
| Framework  | FastAPI 0.115 (Python 3.11+) |
| ORM        | SQLAlchemy 2.0 (declarative) |
| Database   | SQLite (file-based, auto-created + seeded) |
| Validation | Pydantic v2 schemas |
| Tests      | pytest + httpx (TestClient) — **18 tests** |
| AI         | OpenAI Chat Completions (optional), stdlib `urllib` — no extra dependency |

---

## Project structure

```
backend/
├── app/
│   ├── main.py      # all routes, business rules, AI integration
│   ├── models.py    # User, Gig, Booking, Review tables
│   ├── schemas.py   # Pydantic request/response models
│   └── seed.py      # demo data (5 users, 10 gigs, bookings, reviews)
├── tests/
│   ├── conftest.py  # temp-DB fixture, isolated per test session
│   └── test_api.py  # 18 tests: CRUD, DP1/DP2 rules, reviews, AI, sorting
└── requirements.txt
```

---

## Quickstart

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

- API: http://127.0.0.1:8000
- Interactive docs: http://127.0.0.1:8000/docs
- On first start the SQLite DB is created and seeded automatically (users, gigs, bookings, reviews).

### Environment variables (all optional)

| Variable          | Default                              | Purpose |
|-------------------|--------------------------------------|---------|
| `SKILLSWAP_DB`    | `skillswap.db`                       | SQLite file path |
| `CORS_ORIGINS`    | `http://localhost:5173` + 127.0.0.1  | Comma-separated allowed origins (Vite dev server) |
| `OPENAI_API_KEY`  | —                                    | Enables real LLM calls; omit for the built-in heuristics |

---

## API reference

| Method  | Endpoint                        | Description |
|---------|---------------------------------|-------------|
| `GET`   | `/health`                       | Liveness probe |
| `GET`   | `/users`                        | List users |
| `POST`  | `/users`                        | Create user (name, bio, skills) |
| `GET`   | `/gigs`                         | List gigs — `q`, `category`, `sort=recommended\|newest\|price_asc\|price_desc` |
| `GET`   | `/gigs/{gig_id}`                | Gig detail incl. aggregate rating |
| `POST`  | `/gigs`                         | Create gig (creator_id, title, category, rate, description) |
| `GET`   | `/gigs/{gig_id}/reviews`        | Reviews for a gig |
| `POST`  | `/gigs/{gig_id}/reviews`        | Add review — requires an accepted booking (403) and no prior review (409) |
| `GET`   | `/creators/{creator_id}`        | Creator profile: bio, skills, stats, gigs, reviews |
| `GET`   | `/bookings`                     | Bookings by `client_id` |
| `GET`   | `/bookings/{booking_id}`        | Booking detail |
| `POST`  | `/bookings`                     | Request a booking (enforces single-active-booking rule) |
| `PATCH` | `/bookings/{booking_id}/status` | Creator accepts/declines — triggers the DP2 auto-decline cascade |
| `GET`   | `/creator/bookings`             | All incoming requests across a creator's gigs |
| `POST`  | `/gigs/assist`                  | AI Gig Builder → suggested gig draft |
| `POST`  | `/ai/project-brief`             | Requirement → structured project brief |

Identity is passed explicitly (e.g. `client_id` in the booking body, `actor_id` on decisions) — this is a demo/hackathon API and intentionally has no auth layer.

### Example

```bash
# Smart search: category + budget parsed from plain text
curl "http://127.0.0.1:8000/gigs?q=video%20editing%20under%20700"

# Book a gig (with client requirements used later by the brief generator)
curl -X POST http://127.0.0.1:8000/bookings \
  -H "Content-Type: application/json" \
  -d '{"gig_id": 1, "client_id": 1, "deadline": "2026-10-10", "requirement": "5-page portfolio site with a contact form"}'

# Creator accepts → sibling pending requests auto-decline
curl -X PATCH http://127.0.0.1:8000/bookings/2/status \
  -H "Content-Type: application/json" \
  -d '{"actor_id": 2, "status": "accepted"}'
```

---

## Testing

```bash
cd backend
pytest -v
```

18 tests cover the full API surface, including the business rules: single-active-booking, the accept-cascade, review eligibility (403/409), smart-search hint parsing, all four sort modes, and the AI endpoints' fallback behavior.

---

## Seeded demo data

Five personas tell the demo story end-to-end:

| ID | Name     | Role in the story |
|----|----------|-------------------|
| 1  | Ashutosh | Client hiring for startup projects |
| 2  | Rahul    | Full-stack developer (React gigs) |
| 3  | Priya    | Frontend / dashboards |
| 4  | Zoya     | Designer (logo, decks) |
| 5  | Kabir    | Video editor & writer |

Ten gigs across six categories (Development, Design, Video Editing, Tutoring, Music, Content), plus a mix of pending/accepted/declined bookings and reviews — so every UI state (badges, cascades, ratings, notifications) is demoable immediately.
