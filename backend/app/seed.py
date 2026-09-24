"""Demo seed data — the same story in mock mode and live mode."""
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from .models import Booking, Gig, Review, User


def _days_ago(n: int) -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=n)


USERS = [
    {"id": 1, "name": "Ashutosh", "bio": "Final-year CS student hiring creators for startup projects.", "skills": []},
    {"id": 2, "name": "Rahul", "bio": "Full-stack developer. I ship fast, clean React.", "skills": ["React", "Tailwind CSS", "Node.js"]},
    {"id": 3, "name": "Priya", "bio": "Frontend engineer and data-viz nerd. Dashboards are my happy place.", "skills": ["React", "D3.js", "Python"]},
    {"id": 4, "name": "Zoya", "bio": "Designer who codes a little. Brands, logos, decks.", "skills": ["Figma", "Illustrator", "Brand Systems"]},
    {"id": 5, "name": "Kabir", "bio": "Video editor and writer. I make content that holds attention.", "skills": ["Premiere Pro", "SEO Writing"]},
]

# ids 1..10; two "React" gigs (1, 2) so DP3 relevance is demoable
GIGS = [
    {"id": 1, "creator_id": 2, "title": "React Website Development", "category": "Development", "rate": 2500,
     "description": "I'll build a modern, responsive website using React and Tailwind CSS. Includes component architecture, clean styling, and mobile support."},
    {"id": 2, "creator_id": 3, "title": "React Dashboard with Charts", "category": "Development", "rate": 3200,
     "description": "Data-heavy React dashboards: state management, charting libraries, and a polished admin UI built to your spec."},
    {"id": 3, "creator_id": 4, "title": "Logo & Brand Identity Design", "category": "Design", "rate": 1200,
     "description": "A distinctive logo with color palette, typography picks, and usage guidelines. Two revision rounds included."},
    {"id": 4, "creator_id": 5, "title": "YouTube Video Editing", "category": "Video Editing", "rate": 800,
     "description": "Snappy cuts, captions, sound cleanup, and thumbnail-ready pacing for YouTube or Reels. Turnaround in 48 hours."},
    {"id": 5, "creator_id": 2, "title": "Pitch Deck Design", "category": "Design", "rate": 1500,
     "description": "Investor-ready decks with strong visual hierarchy. I turn rough notes into a story investors remember."},
    {"id": 6, "creator_id": 3, "title": "Math & Physics Tutoring", "category": "Tutoring", "rate": 500,
     "description": "One-on-one sessions for high-school math and physics. Concept-first teaching with practice problem sets."},
    {"id": 7, "creator_id": 4, "title": "Acoustic Guitar Recording", "category": "Music", "rate": 1800,
     "description": "Studio-recorded acoustic guitar for your track or backing. Mixed and delivered as stems."},
    {"id": 8, "creator_id": 5, "title": "Blog & Article Writing", "category": "Content", "rate": 700,
     "description": "SEO-aware articles with genuine research and a human voice. 800-1500 words per piece."},
    {"id": 9, "creator_id": 2, "title": "Instagram Reels Editing", "category": "Video Editing", "rate": 600,
     "description": "Vertical video edits with trend-aware pacing, captions, and sound sync that hold attention."},
    {"id": 10, "creator_id": 3, "title": "Vocal Songwriting & Vocals", "category": "Music", "rate": 2200,
     "description": "Original melodies and topline vocals for your production. Demo recordings included."},
]

# status coverage: accepted (gig 1 blocked by DP2), pending mix, declined (DP1)
BOOKINGS = [
    {"id": 1, "gig_id": 1, "client_id": 1, "client_name": "Ashutosh", "deadline": "2026-10-10",
     "requirements": "Portfolio site with 5 pages, a contact form, and a blog section.",
     "status": "accepted", "decided_reason": "Accepted by creator"},
    {"id": 2, "gig_id": 2, "client_id": 1, "client_name": "Ashutosh", "deadline": "2026-10-05",
     "requirements": "Analytics dashboard for our college fest registrations.",
     "status": "pending", "decided_reason": None},
    {"id": 3, "gig_id": 4, "client_id": 1, "client_name": "Ashutosh", "deadline": "2026-09-30",
     "requirements": "Edit our 10-minute fest highlight video with captions.",
     "status": "declined", "decided_reason": "Creator declined this booking"},
    {"id": 4, "gig_id": 3, "client_id": 5, "client_name": "Kabir", "deadline": "2026-10-12",
     "requirements": "Logo for our robotics club, tech-style.",
     "status": "pending", "decided_reason": None},
    {"id": 5, "gig_id": 8, "client_id": 1, "client_name": "Ashutosh", "deadline": "2026-10-20",
     "requirements": "Two articles on student finance, about 1200 words each.",
     "status": "pending", "decided_reason": None},
    {"id": 6, "gig_id": 9, "client_id": 4, "client_name": "Zoya", "deadline": "2026-10-01",
     "requirements": "Three reels per week for a month for my design page.",
     "status": "accepted", "decided_reason": "Accepted by creator"},
    {"id": 7, "gig_id": 10, "client_id": 2, "client_name": "Rahul", "deadline": "2026-11-02",
     "requirements": "Vocals for a lo-fi track I am producing.",
     "status": "declined", "decided_reason": "Creator declined this booking"},
]

# ratings only where a real booking relationship exists
REVIEWS = [
    {"id": 1, "gig_id": 1, "client_id": 4, "client_name": "Zoya", "rating": 5,
     "comment": "Rahul rebuilt our club site in a week. Clean code, zero drama.", "created_at": _days_ago(4)},
    {"id": 2, "gig_id": 1, "client_id": 5, "client_name": "Kabir", "rating": 4,
     "comment": "Great communication and the site looks sharp. Small delays on revisions.", "created_at": _days_ago(2)},
    {"id": 3, "gig_id": 9, "client_id": 1, "client_name": "Ashutosh", "rating": 5,
     "comment": "Our reels finally have pacing. Viewership doubled.", "created_at": _days_ago(1)},
    {"id": 4, "gig_id": 2, "client_id": 2, "client_name": "Rahul", "rating": 5,
     "comment": "Priya's dashboards are on another level.", "created_at": _days_ago(3)},
]


def seed_if_empty(session: Session) -> bool:
    """Populate demo data when the DB has no users. Returns True if seeded."""
    if session.query(User).count() > 0:
        return False
    for u in USERS:
        session.add(User(id=u["id"], name=u["name"], bio=u["bio"], skills=json.dumps(u["skills"])))
    for g in GIGS:
        session.add(Gig(
            id=g["id"], creator_id=g["creator_id"], title=g["title"],
            category=g["category"], rate=g["rate"], description=g["description"],
        ))
    for b in BOOKINGS:
        session.add(Booking(
            id=b["id"], gig_id=b["gig_id"], client_id=b["client_id"],
            client_name=b["client_name"], deadline=b["deadline"],
            requirements=b["requirements"], status=b["status"], decided_reason=b["decided_reason"],
        ))
    for r in REVIEWS:
        session.add(Review(
            id=r["id"], gig_id=r["gig_id"], client_id=r["client_id"],
            client_name=r["client_name"], rating=r["rating"],
            comment=r["comment"], created_at=r["created_at"],
        ))
    session.commit()
    return True
