"""SkillSwap API — FastAPI + SQLite.

Routes, CORS (env-var origin), DP2 double-booking rules, DP3 relevance ranking.
"""
import os
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from .models import Base, Booking, Gig, Review, User, make_engine
from .schemas import (
    BookingCreate,
    BookingOut,
    BookingStatusUpdate,
    BriefRequest,
    CreatorProfileOut,
    GigCreate,
    GigOut,
    ProjectBrief,
    ReviewCreate,
    ReviewOut,
    SuggestGig,
    SuggestRequest,
    UserCreate,
    UserOut,
)
from .seed import seed_if_empty

DB_PATH = os.environ.get("SKILLSWAP_DB", "skillswap.db")
ENGINE = make_engine(f"sqlite:///{DB_PATH}")
SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, expire_on_commit=False)

Base.metadata.create_all(ENGINE)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    with SessionLocal() as db:
        seed_if_empty(db)
    yield


DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
_raw_origins = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", DEFAULT_ORIGINS).split(",") if o.strip()
]
# "*" allows any origin (handy for demo deploys; no credentials are sent,
# so the wildcard is safe here)
_origins = ["*"] if "*" in _raw_origins else _raw_origins

app = FastAPI(title="SkillSwap API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_CATEGORIES = {"Design", "Development", "Video Editing", "Tutoring", "Music", "Content"}
VALID_SORTS = {"recommended", "newest", "price_asc", "price_desc"}


def user_out(u: User) -> UserOut:
    try:
        skills = _json.loads(u.skills or "[]")
        if not isinstance(skills, list):
            skills = []
    except Exception:
        skills = []
    return UserOut(id=u.id, name=u.name, bio=u.bio or "", skills=[str(s) for s in skills], created_at=u.created_at)


def _rating_for(db: Session, gig_ids: list[int]) -> tuple[float | None, int]:
    """Average rating + review count across the given gigs."""
    if not gig_ids:
        return None, 0
    rows = db.execute(
        select(Review.gig_id, Review.rating).where(Review.gig_id.in_(gig_ids))
    ).all()
    if not rows:
        return None, 0
    ratings = [r for _, r in rows]
    return round(sum(ratings) / len(ratings), 1), len(ratings)


def gig_out(db: Session, gig: Gig) -> GigOut:
    has_accepted = any(b.status == "accepted" for b in gig.bookings)
    rating_avg, rating_count = _rating_for(db, [gig.id])
    return GigOut(
        id=gig.id,
        title=gig.title,
        category=gig.category,
        rate=gig.rate,
        description=gig.description,
        created_at=gig.created_at,
        creator={"id": gig.creator.id, "name": gig.creator.name},
        has_accepted_booking=has_accepted,
        rating_avg=rating_avg,
        rating_count=rating_count,
    )


def booking_out(db: Session, booking: Booking) -> BookingOut:
    gig = db.get(Gig, booking.gig_id)
    creator = db.get(User, gig.creator_id)
    return BookingOut(
        id=booking.id,
        gig_id=gig.id,
        gig_title=gig.title,
        gig_category=gig.category,
        gig_rate=gig.rate,
        creator_name=creator.name,
        client_id=booking.client_id,
        client_name=booking.client_name,
        deadline=booking.deadline,
        requirements=booking.requirements or "",
        status=booking.status,
        decided_reason=booking.decided_reason,
        decided_at=booking.decided_at,
        created_at=booking.created_at,
    )


def _terms(q: str) -> list[str]:
    return [t for t in re.split(r"\s+", q.strip().lower()) if t]


def _relevance_rank(gig: Gig, terms: list[str]) -> tuple[int, float]:
    """DP3: title matches beat description matches; newest breaks ties."""
    title = gig.title.lower()
    description = gig.description.lower()
    title_hits = sum(1 for t in terms if t in title)
    desc_hits = sum(1 for t in terms if t in description)
    # newer gigs get a tiny edge as a final deterministic tiebreak
    # (SQLite returns naive datetimes, so compare against naive UTC now)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    age_days = (now - gig.created_at).total_seconds() / 86400
    return title_hits, desc_hits - age_days * 0.001


# ---------- health ----------

@app.get("/health")
def health():
    return {"status": "ok", "service": "skillswap-api"}


# ---------- users ----------

@app.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return [user_out(u) for u in db.scalars(select(User).order_by(User.id)).all()]


@app.post("/users", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(name=payload.name.strip())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_out(user)


# ---------- gigs ----------

@app.get("/gigs", response_model=list[GigOut])
def list_gigs(
    q: str = "",
    category: str = "",
    sort: str = "recommended",
    db: Session = Depends(get_db),
):
    if sort not in VALID_SORTS:
        raise HTTPException(status_code=422, detail="sort must be one of: recommended, newest, price_asc, price_desc")

    # Smart search (deterministic, explainable): pull category and budget
    # hints out of natural-language queries like
    #   "React developer for a landing page under 3000"
    # Keyword search still works exactly as before when no hints match.
    budget_max: int | None = None
    q_category: str | None = None
    if q:
        m = re.search(r"(?:under|below|less than|max(?:imum)?)\s*(?:rs\.?|inr|₹)?\s*(\d{2,6})", q, re.IGNORECASE)
        if m:
            budget_max = int(m.group(1))
        else:
            m2 = re.search(r"₹\s?(\d{2,6})\s*(?:or less|budget)", q, re.IGNORECASE)
            if m2:
                budget_max = int(m2.group(1))
        q_category = next(
            (c for c in VALID_CATEGORIES if c.lower() in q.lower()), None
        )
    query = select(Gig)
    if category and category != "All":
        if category not in VALID_CATEGORIES:
            raise HTTPException(status_code=422, detail=f"unknown category: {category}")
        query = query.where(Gig.category == category)
    elif q_category:
        # hint only applies when the caller did not pin a category filter
        query = query.where(Gig.category == q_category)
    if budget_max is not None:
        query = query.where(Gig.rate <= budget_max)
    gigs = list(db.scalars(query.order_by(Gig.created_at.desc(), Gig.id.desc())))

    terms = _terms(q)
    if terms:
        if sort == "recommended":
            # DP3: relevance ranking — title match > description match, newest tiebreak
            gigs.sort(key=lambda g: _relevance_rank(g, terms), reverse=True)
            gigs = [g for g in gigs if _relevance_rank(g, terms)[0] > 0 or _relevance_rank(g, terms)[1] > 0]
        else:
            gigs = [
                g for g in gigs
                if all(t in g.title.lower() or t in g.description.lower() for t in terms)
            ]

    if sort == "price_asc":
        gigs.sort(key=lambda g: (g.rate, g.id))
    elif sort == "price_desc":
        gigs.sort(key=lambda g: (-g.rate, g.id))
    return [gig_out(db, g) for g in gigs]


@app.get("/gigs/{gig_id}", response_model=GigOut)
def get_gig(gig_id: int, db: Session = Depends(get_db)):
    gig = db.get(Gig, gig_id)
    if not gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    return gig_out(db, gig)


@app.post("/gigs", response_model=GigOut, status_code=201)
def create_gig(payload: GigCreate, db: Session = Depends(get_db)):
    creator = db.get(User, payload.creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    gig = Gig(
        creator_id=payload.creator_id,
        title=payload.title.strip(),
        category=payload.category,
        rate=payload.rate,
        description=payload.description.strip(),
    )
    db.add(gig)
    db.commit()
    db.refresh(gig)
    return gig_out(db, gig)


# ---------- bookings (client side) ----------

@app.get("/bookings", response_model=list[BookingOut])
def list_bookings(client_id: int | None = None, db: Session = Depends(get_db)):
    query = select(Booking).order_by(Booking.created_at.desc(), Booking.id.desc())
    if client_id is not None:
        query = query.where(Booking.client_id == client_id)
    return [booking_out(db, b) for b in db.scalars(query).all()]


@app.get("/bookings/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking_out(db, booking)


@app.post("/bookings", response_model=BookingOut, status_code=201)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)):
    gig = db.get(Gig, payload.gig_id)
    if not gig:
        raise HTTPException(status_code=404, detail="Gig not found")

    # DP2: a gig with an accepted booking is closed for new requests
    already_accepted = db.scalar(
        select(Booking).where(Booking.gig_id == gig.id, Booking.status == "accepted")
    )
    if already_accepted:
        raise HTTPException(status_code=409, detail="This gig is no longer accepting bookings")

    client = db.get(User, payload.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # DP2: multiple pending bookings on one gig are allowed
    booking = Booking(
        gig_id=gig.id,
        client_id=payload.client_id,
        client_name=payload.client_name.strip(),
        deadline=payload.deadline,
        requirements=payload.requirements.strip(),
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking_out(db, booking)



# ---------- creator profiles (v2) ----------

@app.get("/creators/{creator_id}", response_model=CreatorProfileOut)
def creator_profile(creator_id: int, db: Session = Depends(get_db)):
    """Public creator page: identity, their gigs, ratings, and reviews."""
    creator = db.get(User, creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    gigs = list(db.scalars(
        select(Gig).where(Gig.creator_id == creator_id).order_by(Gig.created_at.desc())
    ))
    gig_ids = [g.id for g in gigs]
    rating_avg, rating_count = _rating_for(db, gig_ids)
    reviews = []
    if gig_ids:
        rows = db.scalars(
            select(Review)
            .where(Review.gig_id.in_(gig_ids))
            .order_by(Review.created_at.desc(), Review.id.desc())
        ).all()
        reviews = [
            ReviewOut(
                id=r.id,
                gig_id=r.gig_id,
                client_name=r.client_name,
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at,
            )
            for r in rows
        ]
    try:
        creator_skills = _json.loads(creator.skills or "[]")
        if not isinstance(creator_skills, list):
            creator_skills = []
    except Exception:
        creator_skills = []
    return CreatorProfileOut(
        creator={"id": creator.id, "name": creator.name, "bio": creator.bio or "", "skills": [str(s) for s in creator_skills]},
        gigs=[gig_out(db, g) for g in gigs],
        total_gigs=len(gigs),
        rating_avg=rating_avg,
        rating_count=rating_count,
        reviews=reviews,
    )


# ---------- AI Gig Assistant (v2) ----------

import json as _json  # noqa: E402
import urllib.request  # noqa: E402

_OPENAI_KEY = os.environ.get("OPENAI_API_KEY")

_RATE_HINTS = {
    "Design": (800, 2000),
    "Development": (1500, 3500),
    "Video Editing": (500, 1500),
    "Tutoring": (300, 800),
    "Music": (1000, 2500),
    "Content": (400, 1200),
}


def _heuristic_suggest(prompt: str) -> SuggestGig:
    """Keyless fallback: derive title/category/description from the prompt text."""
    text = prompt.strip()
    lowered = text.lower()

    category = "Design"
    for cat in VALID_CATEGORIES:
        if cat.lower() in lowered:
            category = cat
            break
    else:
        keyword_map = {
            "react": "Development", "website": "Development", "app": "Development",
            "code": "Development", "python": "Development",
            "logo": "Design", "design": "Design", "brand": "Design", "poster": "Design",
            "video": "Video Editing", "edit": "Video Editing", "reels": "Video Editing",
            "math": "Tutoring", "physics": "Tutoring", "tutor": "Tutoring", "teach": "Tutoring",
            "guitar": "Music", "song": "Music", "music": "Music", "vocal": "Music",
            "blog": "Content", "article": "Content", "write": "Content", "content": "Content",
        }
        for kw, cat in keyword_map.items():
            if kw in lowered:
                category = cat
                break

    # title: first clause, tidied; capped for a card-friendly headline
    head = re.split(r"[.!?]|,?\s+(?:and|who|which|that)\s+", text)[0].strip().rstrip(".,")
    words = head.split()
    title = " ".join(words[:9]).strip()
    if not title:
        title = f"{category} Service"

    lo, hi = _RATE_HINTS[category]
    rate_estimate = (lo + hi) // 2

    description = (
        f"{text}\n\nWhat's included:\n"
        f"- {category.lower()} work tailored to your brief\n"
        "- One revision round\n"
        "- Delivered by the agreed deadline"
    )
    return SuggestGig(title=title, category=category, description=description, rate_estimate=rate_estimate)


@app.post("/gigs/assist", response_model=SuggestGig)
def suggest_gig(payload: SuggestRequest, db: Session = Depends(get_db)):
    """AI Gig Assistant: turn a plain sentence into gig prefills.

    Uses OpenAI when OPENAI_API_KEY is set; otherwise a transparent
    on-device heuristic so the feature works with zero setup.
    """
    if _OPENAI_KEY:
        try:
            body = _json.dumps({
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": (
                        "You prefill gig listings for a student creator marketplace. "
                        f"Categories are exactly: {sorted(VALID_CATEGORIES)}. "
                        'Reply with JSON only: {"title": str (max 70 chars), '
                        '"category": one of the categories, "description": 2-3 sentences, '
                        '"rate_estimate": integer in INR}.'
                    )},
                    {"role": "user", "content": payload.prompt},
                ],
                "temperature": 0.4,
                "response_format": {"type": "json_object"},
            }).encode()
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=body,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {_OPENAI_KEY}"},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = _json.load(resp)
            content = _json.loads(data["choices"][0]["message"]["content"])
            category = content.get("category", "Design")
            if category not in VALID_CATEGORIES:
                category = "Design"
            lo, hi = _RATE_HINTS.get(category, (500, 2000))
            rate = content.get("rate_estimate")
            rate_estimate = int(rate) if isinstance(rate, int) and 0 < rate < 100000 else (lo + hi) // 2
            return SuggestGig(
                title=str(content.get("title", ""))[:120] or f"{category} Service",
                category=category,  # type: ignore[arg-type]
                description=str(content.get("description", "")),
                rate_estimate=rate_estimate,
            )
        except Exception:
            pass  # fall back to the heuristic on any failure
    return _heuristic_suggest(payload.prompt)


# ---------- reviews (v2) ----------

@app.post("/gigs/{gig_id}/reviews", response_model=ReviewOut, status_code=201)
def create_review(gig_id: int, payload: ReviewCreate, db: Session = Depends(get_db)):
    """Leave a review. Requires a real booking relationship: the client must
    have at least one booking on this gig. One review per client per gig."""
    gig = db.get(Gig, gig_id)
    if not gig:
        raise HTTPException(status_code=404, detail="Gig not found")
    client = db.get(User, payload.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    has_booking = db.scalar(
        select(Booking).where(Booking.gig_id == gig_id, Booking.client_id == payload.client_id)
    )
    if not has_booking:
        raise HTTPException(status_code=403, detail="Only clients who booked this gig can review it")
    existing = db.scalar(
        select(Review).where(Review.gig_id == gig_id, Review.client_id == payload.client_id)
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already reviewed this gig")
    review = Review(
        gig_id=gig_id,
        client_id=payload.client_id,
        client_name=client.name,
        rating=payload.rating,
        comment=payload.comment.strip(),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ReviewOut(
        id=review.id, gig_id=review.gig_id, client_name=review.client_name,
        rating=review.rating, comment=review.comment, created_at=review.created_at,
    )


@app.get("/gigs/{gig_id}/reviews", response_model=list[ReviewOut])
def list_gig_reviews(gig_id: int, db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Review).where(Review.gig_id == gig_id).order_by(Review.created_at.desc(), Review.id.desc())
    ).all()
    return [
        ReviewOut(id=r.id, gig_id=r.gig_id, client_name=r.client_name,
                  rating=r.rating, comment=r.comment, created_at=r.created_at)
        for r in rows
    ]


# ---------- AI project brief (v2) ----------

_BRIEF_TEMPLATES = {
    "Development": {
        "deliverables": ["Responsive pages for desktop and mobile", "Contact / inquiry form", "Basic SEO setup and deployment"],
        "timeline": "1-2 weeks depending on scope",
    },
    "Design": {
        "deliverables": ["Concept directions (2 options)", "Final files with source assets", "Usage guidelines"],
        "timeline": "3-7 days with one revision round",
    },
    "Video Editing": {
        "deliverables": ["First cut for review", "Final export in target formats", "Captions and sound cleanup"],
        "timeline": "2-5 days per video",
    },
    "Tutoring": {
        "deliverables": ["Session plan", "Practice problem sets", "Progress summary after each session"],
        "timeline": "Weekly sessions, reviewed monthly",
    },
    "Music": {
        "deliverables": ["Recorded takes", "Mixed stems in WAV/MP3", "One revision round"],
        "timeline": "4-10 days depending on scope",
    },
    "Content": {
        "deliverables": ["Outline for approval", "Final draft with sources", "SEO meta suggestions"],
        "timeline": "3-6 days per piece",
    },
}


def _heuristic_brief(req: BriefRequest) -> ProjectBrief:
    cat = req.category or "Design"
    tpl = _BRIEF_TEMPLATES.get(cat, _BRIEF_TEMPLATES["Design"])
    objective = f"Deliver {req.gig_title.strip() or cat.lower()} work that fulfils the client requirement: {req.requirement.strip()}"
    if len(objective) > 400:
        objective = objective[:397] + "..."
    milestones = [
        "Kick-off: confirm scope and deadline",
        "Mid-point: share progress for feedback",
        "Final: delivery and one revision round",
    ]
    return ProjectBrief(
        objective=objective,
        deliverables=tpl["deliverables"],
        milestones=milestones,
        estimated_timeline=tpl["timeline"],
    )


@app.post("/ai/project-brief", response_model=ProjectBrief)
def project_brief(payload: BriefRequest):
    """Turn a client requirement into a structured, editable draft brief."""
    if _OPENAI_KEY:
        try:
            body = _json.dumps({
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": (
                        "You turn a client requirement into a concise project brief for a student creator marketplace. "
                        'Reply JSON only: {"objective": str, "deliverables": [str], "milestones": [str], "estimated_timeline": str}.'
                    )},
                    {"role": "user", "content": (
                        f"Gig: {payload.gig_title}. Category: {payload.category or 'unspecified'}. "
                        f"Requirement: {payload.requirement}"
                    )},
                ],
                "temperature": 0.4,
                "response_format": {"type": "json_object"},
            }).encode()
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=body,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {_OPENAI_KEY}"},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = _json.load(resp)
            c = _json.loads(data["choices"][0]["message"]["content"])
            return ProjectBrief(
                objective=str(c.get("objective", "")) or "Draft objective unavailable.",
                deliverables=[str(x) for x in c.get("deliverables", [])][:8],
                milestones=[str(x) for x in c.get("milestones", [])][:6],
                estimated_timeline=str(c.get("estimated_timeline", "")),
            )
        except Exception:
            pass
    return _heuristic_brief(payload)


# ---------- creator dashboard ----------

@app.get("/creator/bookings", response_model=list[BookingOut])
def creator_bookings(creator_id: int, db: Session = Depends(get_db)):
    """Incoming booking requests across all gigs created by this user."""
    gig_ids = list(db.scalars(select(Gig.id).where(Gig.creator_id == creator_id)))
    if not gig_ids:
        return []
    rows = db.scalars(
        select(Booking)
        .where(Booking.gig_id.in_(gig_ids))
        .order_by(Booking.created_at.desc(), Booking.id.desc())
    ).all()
    return [booking_out(db, b) for b in rows]


@app.patch("/bookings/{booking_id}/status", response_model=BookingOut)
def update_booking_status(
    booking_id: int, payload: BookingStatusUpdate, db: Session = Depends(get_db)
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    gig = db.get(Gig, booking.gig_id)

    # only the gig's creator may decide a booking
    if gig.creator_id != payload.actor_id:
        raise HTTPException(status_code=403, detail="Only the gig's creator can decide this booking")

    if booking.status != "pending":
        # DP1: declined is terminal; accepted is decided too
        raise HTTPException(status_code=409, detail=f"Booking already {booking.status}")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    booking.status = payload.status
    booking.decided_at = now
    booking.decided_reason = "Accepted by creator" if payload.status == "accepted" else "Creator declined this booking"

    # DP2 cascade: accepting one pending booking auto-declines all sibling pendings
    if payload.status == "accepted":
        siblings = db.scalars(
            select(Booking).where(
                Booking.gig_id == gig.id,
                Booking.status == "pending",
                Booking.id != booking.id,
            )
        ).all()
        for sib in siblings:
            sib.status = "declined"
            sib.decided_at = now
            sib.decided_reason = "Gig no longer available"

    db.commit()
    db.refresh(booking)
    return booking_out(db, booking)
