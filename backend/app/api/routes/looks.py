from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.look import LookOut, GenerateLookRequest, LookFeedbackCreate
from app.services import looks as looks_service

router = APIRouter(prefix="/looks", tags=["looks"])


@router.post("/generate", response_model=List[LookOut])
async def generate_looks(
    request: GenerateLookRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await looks_service.generate_looks(db, current_user.id, request)


@router.get("", response_model=List[LookOut])
async def list_looks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await looks_service.get_user_looks(db, current_user.id)


@router.post("/{look_id}/feedback", status_code=status.HTTP_201_CREATED)
async def add_feedback(
    look_id: int,
    data: LookFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await looks_service.add_feedback(db, look_id, current_user.id, data)
