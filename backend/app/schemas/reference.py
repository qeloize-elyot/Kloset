from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ReferenceCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    caption: Optional[str] = Field(None, max_length=500)
    occasion: Optional[str] = Field(None, max_length=80)
    climate: Optional[str] = Field(None, max_length=40)
    image: str = Field(..., min_length=20)


class ReferenceOut(BaseModel):
    id: int
    author_id: int
    author_name: Optional[str] = None
    title: str
    caption: Optional[str] = None
    occasion: Optional[str] = None
    climate: Optional[str] = None
    image: str
    likes_count: int
    created_at: datetime

    class Config:
        from_attributes = True
