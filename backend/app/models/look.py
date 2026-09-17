from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class Look(Base):
    __tablename__ = "looks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    occasion: Mapped[str | None] = mapped_column(String(80), nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    weather_condition: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    owner = relationship("User", back_populates="looks")
    items = relationship("LookItem", back_populates="look", cascade="all, delete-orphan")
    feedbacks = relationship("LookFeedback", back_populates="look", cascade="all, delete-orphan")


class LookItem(Base):
    __tablename__ = "look_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    look_id: Mapped[int] = mapped_column(ForeignKey("looks.id", ondelete="CASCADE"), index=True)
    clothing_item_id: Mapped[int] = mapped_column(ForeignKey("clothing_items.id", ondelete="CASCADE"), index=True)
    
    position: Mapped[int] = mapped_column(Integer, default=0)

    look = relationship("Look", back_populates="items")
    clothing_item = relationship("ClothingItem", back_populates="look_items")


class LookFeedback(Base):
    __tablename__ = "look_feedbacks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    look_id: Mapped[int] = mapped_column(ForeignKey("looks.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    rating: Mapped[str] = mapped_column(String(20), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    look = relationship("Look", back_populates="feedbacks")
    user = relationship("User", back_populates="feedbacks")
