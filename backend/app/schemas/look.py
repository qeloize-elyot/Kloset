from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.schemas.clothing import ClothingOut


class LookItemOut(BaseModel):
    id: int
    clothing_item: ClothingOut
    position: int

    class Config:
        from_attributes = True


class LookCreate(BaseModel):
    title: Optional[str] = None
    occasion: Optional[str] = None
    temperature: Optional[float] = None
    weather_condition: Optional[str] = None
    clothing_item_ids: List[int]
    rationale: Optional[str] = None


class LookOut(BaseModel):
    id: int
    title: Optional[str] = None
    occasion: Optional[str] = None
    temperature: Optional[float] = None
    weather_condition: Optional[str] = None
    rationale: Optional[str] = None
    items: List[LookItemOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


class LookFeedbackCreate(BaseModel):
    rating: str = Field(..., pattern="^(like|dislike|used)$")
    comment: Optional[str] = None


class GenerateLookRequest(BaseModel):
    occasion: str = Field(..., min_length=2, max_length=80)
    temperature: Optional[float] = None
    city: Optional[str] = None
    count: int = Field(default=3, ge=1, le=5)
