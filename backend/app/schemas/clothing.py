from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ClothingBase(BaseModel):
    name: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    dominant_color: Optional[str] = None
    secondary_colors: Optional[List[str]] = None
    fabric: Optional[str] = None
    pattern: Optional[str] = None
    styles: Optional[List[str]] = None
    seasons: Optional[List[str]] = None
    min_temp: Optional[float] = None
    max_temp: Optional[float] = None
    notes: Optional[str] = None


class ClothingCreate(ClothingBase):
    image_front: Optional[str] = None
    image_back: Optional[str] = None
    image_label: Optional[str] = None


class ClothingUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    dominant_color: Optional[str] = None
    secondary_colors: Optional[List[str]] = None
    fabric: Optional[str] = None
    pattern: Optional[str] = None
    styles: Optional[List[str]] = None
    seasons: Optional[List[str]] = None
    min_temp: Optional[float] = None
    max_temp: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ClothingOut(ClothingBase):
    id: int
    owner_id: int
    image_front: Optional[str] = None
    image_back: Optional[str] = None
    image_label: Optional[str] = None
    image_clean: Optional[str] = None
    ai_tags: Optional[dict] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
