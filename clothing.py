from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.clothing import ClothingItem
from app.schemas.clothing import ClothingCreate, ClothingUpdate


async def create_clothing_item(
    db: AsyncSession, owner_id: int, data: ClothingCreate
) -> ClothingItem:
    item = ClothingItem(
        owner_id=owner_id,
        **data.model_dump(exclude_unset=True),
    )
    # Placeholder: tags básicas baseadas na categoria
    item.ai_tags = {
        "source": "manual",
        "confidence": 0.0,
    }
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def get_user_clothing(
    db: AsyncSession, owner_id: int, active_only: bool = True
) -> list[ClothingItem]:
    query = select(ClothingItem).where(ClothingItem.owner_id == owner_id)
    if active_only:
        query = query.where(ClothingItem.is_active == True)
    result = await db.execute(query.order_by(ClothingItem.created_at.desc()))
    return list(result.scalars().all())


async def get_clothing_by_id(
    db: AsyncSession, item_id: int, owner_id: int
) -> ClothingItem:
    result = await db.execute(
        select(ClothingItem).where(
            ClothingItem.id == item_id,
            ClothingItem.owner_id == owner_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peça não encontrada")
    return item


async def update_clothing_item(
    db: AsyncSession, item_id: int, owner_id: int, data: ClothingUpdate
) -> ClothingItem:
    item = await get_clothing_by_id(db, item_id, owner_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


async def delete_clothing_item(db: AsyncSession, item_id: int, owner_id: int) -> None:
    item = await get_clothing_by_id(db, item_id, owner_id)
    item.is_active = False
    await db.commit()
