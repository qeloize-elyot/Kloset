import random
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.clothing import ClothingItem
from app.models.look import Look, LookItem, LookFeedback
from app.schemas.look import GenerateLookRequest, LookFeedbackCreate


TOP_CATEGORIES = {"camiseta", "camisa", "blusa", "regata", "moletom", "suéter", "casaco", "jaqueta"}
BOTTOM_CATEGORIES = {"calça", "shorts", "saia", "bermuda"}
SHOE_CATEGORIES = {"tênis", "sapato", "sandália", "bota", "chinelo"}
OUTER_CATEGORIES = {"jaqueta", "casaco", "blazer", "sobretudo"}


def _is_suitable_for_temp(item: ClothingItem, temperature: float | None) -> bool:
    if temperature is None:
        return True
    if item.min_temp is not None and temperature < item.min_temp:
        return False
    if item.max_temp is not None and temperature > item.max_temp:
        return False
    if temperature < 15 and item.category in {"shorts", "regata", "sandália", "chinelo"}:
        return False
    if temperature > 28 and item.category in {"casaco", "sobretudo", "moletom", "bota"}:
        return False
    return True


async def generate_looks(
    db: AsyncSession,
    owner_id: int,
    request: GenerateLookRequest,
) -> List[Look]:
    result = await db.execute(
        select(ClothingItem).where(
            ClothingItem.owner_id == owner_id,
            ClothingItem.is_active == True,
        )
    )
    all_items = list(result.scalars().all())

    if len(all_items) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Adicione pelo menos duas peças ao guarda-roupa para gerar looks.",
        )

    temperature = request.temperature
    suitable = [i for i in all_items if _is_suitable_for_temp(i, temperature)]

    tops = [i for i in suitable if i.category.lower() in TOP_CATEGORIES]
    bottoms = [i for i in suitable if i.category.lower() in BOTTOM_CATEGORIES]
    shoes = [i for i in suitable if i.category.lower() in SHOE_CATEGORIES]
    outers = [i for i in suitable if i.category.lower() in OUTER_CATEGORIES]

    generated: List[Look] = []

    for i in range(request.count):
        selected: List[ClothingItem] = []

        if tops:
            selected.append(random.choice(tops))
        if bottoms:
            selected.append(random.choice(bottoms))
        if shoes and random.random() > 0.3:
            selected.append(random.choice(shoes))
        if temperature is not None and temperature < 18 and outers and random.random() > 0.4:
            selected.append(random.choice(outers))

        if len(selected) < 2:
            selected = random.sample(suitable, min(3, len(suitable)))

        unique_ids = set()
        unique_items = []
        for item in selected:
            if item.id not in unique_ids:
                unique_ids.add(item.id)
                unique_items.append(item)

        title = f"Look {request.occasion}"
        if temperature is not None:
            title += f" · {temperature:.0f}°C"

        rationale_parts = [
            f"Montado para a ocasião “{request.occasion}”.",
        ]
        if temperature is not None:
            rationale_parts.append(f"Considerando a temperatura de {temperature:.0f}°C.")
        rationale_parts.append(
            "As peças foram selecionadas por categoria e compatibilidade climática. "
            "Com o uso do sistema de feedback, as próximas sugestões vão se aproximar mais do seu gosto."
        )

        look = Look(
            owner_id=owner_id,
            title=title,
            occasion=request.occasion,
            temperature=temperature,
            weather_condition=None,
            rationale=" ".join(rationale_parts),
            meta={"generator": "rule_based_v1"},
        )
        db.add(look)
        await db.flush()

        for pos, item in enumerate(unique_items):
            look_item = LookItem(
                look_id=look.id,
                clothing_item_id=item.id,
                position=pos,
            )
            db.add(look_item)

        generated.append(look)

    await db.commit()

    look_ids = [l.id for l in generated]
    result = await db.execute(
        select(Look)
        .where(Look.id.in_(look_ids))
        .options(
            selectinload(Look.items).selectinload(LookItem.clothing_item)
        )
    )
    return list(result.scalars().all())


async def get_user_looks(db: AsyncSession, owner_id: int, limit: int = 20) -> List[Look]:
    result = await db.execute(
        select(Look)
        .where(Look.owner_id == owner_id)
        .options(selectinload(Look.items).selectinload(LookItem.clothing_item))
        .order_by(Look.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def add_feedback(
    db: AsyncSession,
    look_id: int,
    user_id: int,
    data: LookFeedbackCreate,
) -> LookFeedback:
    result = await db.execute(
        select(Look).where(Look.id == look_id, Look.owner_id == user_id)
    )
    look = result.scalar_one_or_none()
    if not look:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Look não encontrado")

    feedback = LookFeedback(
        look_id=look_id,
        user_id=user_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback
