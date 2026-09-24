"""Pydantic schemas for request validation and responses."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

CATEGORIES = [
    "Design",
    "Development",
    "Video Editing",
    "Tutoring",
    "Music",
    "Content",
]
Category = Literal[
    "Design", "Development", "Video Editing", "Tutoring", "Music", "Content"
]
BookingStatus = Literal["pending", "accepted", "declined"]


# ---- requests ----

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class GigCreate(BaseModel):
    creator_id: int
    title: str = Field(min_length=1, max_length=120)
    category: Category
    rate: int = Field(ge=0)
    description: str = Field(default="", max_length=4000)


class BookingCreate(BaseModel):
    gig_id: int
    client_id: int
    client_name: str = Field(min_length=1, max_length=80)
    deadline: str = Field(min_length=8, max_length=20)
    requirements: str = Field(default="", max_length=2000)


class BookingStatusUpdate(BaseModel):
    status: Literal["accepted", "declined"]
    actor_id: int = Field(description="user performing the action; must be the gig's creator")


# ---- responses ----

class UserOut(BaseModel):
    id: int
    name: str
    bio: str = ""
    skills: list[str] = []
    created_at: datetime


class CreatorOut(BaseModel):
    id: int
    name: str
    bio: str = ""
    skills: list[str] = []


class GigOut(BaseModel):
    id: int
    title: str
    category: str
    rate: int
    description: str
    created_at: datetime
    creator: CreatorOut
    has_accepted_booking: bool = False
    rating_avg: Optional[float] = None
    rating_count: int = 0


class ReviewOut(BaseModel):
    id: int
    gig_id: int
    client_name: str
    rating: int
    comment: str
    created_at: datetime


class CreatorProfileOut(BaseModel):
    creator: CreatorOut
    gigs: list[GigOut]
    total_gigs: int
    rating_avg: Optional[float] = None
    rating_count: int = 0
    reviews: list[ReviewOut]


class SuggestGig(BaseModel):
    """AI Gig Assistant output: prefills for the Post Gig form."""
    title: str = Field(max_length=120)
    category: Category
    description: str = Field(default="", max_length=4000)
    rate_estimate: Optional[int] = None


class SuggestRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=600)


class ReviewCreate(BaseModel):
    """A review can only be left by a client with a booking on that gig."""
    client_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=600)


class BriefRequest(BaseModel):
    requirement: str = Field(min_length=10, max_length=1200)
    gig_title: str = Field(default="", max_length=120)
    category: Optional[Category] = None


class ProjectBrief(BaseModel):
    objective: str
    deliverables: list[str]
    milestones: list[str]
    estimated_timeline: str = ""


class BookingOut(BaseModel):
    id: int
    gig_id: int
    gig_title: str
    gig_category: str
    gig_rate: int
    creator_name: str
    client_id: int
    client_name: str
    deadline: str
    requirements: str = ""
    status: BookingStatus
    decided_reason: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime
