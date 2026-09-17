from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.clothing import ClothingCreate, ClothingUpdate, ClothingOut
from app.services import clothing as clothing_service

router = APIRouter(prefix="/clothing", tags=["clothing"])


@router.post("", response_model=ClothingOut, status_code=status.HTTP_201_CREATED)
async def create_item(
    data: ClothingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await clothing_service.create_clothing_item(db, current_user.id, data)


@router.get("", response_model=List[ClothingOut])
async def list_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await clothing_service.get_user_clothing(db, current_user.id)


@router.get("/{item_id}", response_model=ClothingOut)
async def get_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await clothing_service.get_clothing_by_id(db, item_id, current_user.id)


@router.patch("/{item_id}", response_model=ClothingOut)
async def update_item(
    item_id: int,
    data: ClothingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await clothing_service.update_clothing_item(db, item_id, current_user.id, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await clothing_service.delete_clothing_item(db, item_id, current_user.id)
