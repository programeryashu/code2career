"""SQLAlchemy models: users, gigs, bookings."""
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(80), nullable=False)
    bio = Column(Text, nullable=False, default="")
    # JSON-encoded list of skill names (SQLite-friendly)
    skills = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=utcnow, nullable=False)

    gigs = relationship("Gig", back_populates="creator")


class Gig(Base):
    __tablename__ = "gigs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(120), nullable=False)
    category = Column(String(40), nullable=False)
    rate = Column(Integer, nullable=False)
    description = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=utcnow, nullable=False)

    creator = relationship("User", back_populates="gigs")
    bookings = relationship(
        "Booking", back_populates="gig", order_by="Booking.created_at"
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    gig_id = Column(Integer, ForeignKey("gigs.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_name = Column(String(80), nullable=False)
    deadline = Column(String(20), nullable=False)  # ISO date string yyyy-mm-dd
    requirements = Column(Text, nullable=False, default="")  # client project brief
    # pending | accepted | declined
    status = Column(String(10), nullable=False, default="pending")
    # why it reached its current state: "Creator declined this booking",
    # "Gig no longer available" (DP2 cascade), "Accepted by creator"
    decided_reason = Column(String(120), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    gig = relationship("Gig", back_populates="bookings")


class Review(Base):
    """A client's rating of a completed booking (1-5 stars)."""

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    gig_id = Column(Integer, ForeignKey("gigs.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_name = Column(String(80), nullable=False)
    rating = Column(Integer, nullable=False)  # 1..5
    comment = Column(Text, nullable=False, default="")
    created_at = Column(DateTime, default=utcnow, nullable=False)

    gig = relationship("Gig")


def make_engine(db_url: str):
    return create_engine(db_url, connect_args={"check_same_thread": False})
