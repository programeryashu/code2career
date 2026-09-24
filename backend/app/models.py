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
    # opening message from the booking form, shown as the first chat entry
    initial_message = Column(Text, nullable=True)
    # bargain state: a standing offer and, once accepted, the agreed price
    offer_price = Column(Integer, nullable=True)
    offer_by = Column(String(10), nullable=True)  # "client" | "creator"
    agreed_price = Column(Integer, nullable=True)
    # pending | accepted | declined
    status = Column(String(10), nullable=False, default="pending")
    # why it reached its current state: "Creator declined this booking",
    # "Gig no longer available" (DP2 cascade), "Accepted by creator"
    decided_reason = Column(String(120), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    gig = relationship("Gig", back_populates="bookings")
    messages = relationship("Message", back_populates="booking", order_by="Message.id")


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


class Message(Base):
    """A chat message on a booking. sender_id is NULL for system events."""

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sender_name = Column(String(80), nullable=False)
    kind = Column(String(10), nullable=False, default="user")  # "user" | "system"
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    booking = relationship("Booking", back_populates="messages")


class DmThread(Base):
    """A direct user-to-user conversation, independent of bookings.

    user_a_id < user_b_id so a pair maps to exactly one thread.
    """

    __tablename__ = "dm_threads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_a_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user_b_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class DmMessage(Base):
    """One message inside a DmThread."""

    __tablename__ = "dm_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    thread_id = Column(Integer, ForeignKey("dm_threads.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender_name = Column(String(80), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)


def make_engine(db_url: str):
    return create_engine(db_url, connect_args={"check_same_thread": False})
