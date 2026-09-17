from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from app.core.database import Base


class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    # Dados básicos
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    category: Mapped[str] = mapped_column(String(50), index=True)  # camiseta, calça, jaqueta...
    subcategory: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Cores e materiais
    dominant_color: Mapped[str | None] = mapped_column(String(7), nullable=True)  # hex
    secondary_colors: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)
    fabric: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pattern: Mapped[str | None] = mapped_column(String(50), nullable=True)  # lisa, listrada, floral...
    
    # Estilo e estação
    styles: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)  # casual, formal, esportivo
    seasons: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)  # verão, inverno...
    
    # Clima
    min_temp: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_temp: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # Imagens
    image_front: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_back: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_label: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_clean: Mapped[str | None] = mapped_column(Text, nullable=True)  # sem fundo
    
    # Tags geradas por IA (JSON livre)
    ai_tags: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    
    # Controle
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner = relationship("User", back_populates="clothing_items")
    look_items = relationship("LookItem", back_populates="clothing_item")
