import random
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.clothing import ClothingItem
from app.models.look import Look, LookItem, LookFeedback
from app.schemas.look import GenerateLookRequest, LookFeedbackCreate, EvaluateLookRequest
from app.core.config import get_settings
from app.services import gemini as gemini_service


TOP_CATEGORIES = {"camiseta", "camisa", "blusa", "regata", "moletom", "sueter", "suéter", "casaco", "jaqueta"}
BOTTOM_CATEGORIES = {"calca", "calça", "shorts", "saia", "bermuda"}
SHOE_CATEGORIES = {"tenis", "tênis", "sapato", "sandalia", "sandália", "bota", "chinelo"}
OUTER_CATEGORIES = {"jaqueta", "casaco", "blazer", "sobretudo"}


def _item_to_dict(item: ClothingItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "subcategory": item.subcategory,
        "dominant_color": item.dominant_color,
        "fabric": item.fabric,
        "pattern": item.pattern,
        "styles": item.styles,
        "seasons": item.seasons,
    }


def _is_suitable_for_temp(item: ClothingItem, temperature: float | None) -> bool:
    if temperature is None:
        return True
    if item.min_temp is not None and temperature < item.min_temp:
        return False
    if item.max_temp is not None and temperature > item.max_temp:
        return False
    cat = (item.category or "").lower()
    if temperature < 15 and cat in {"shorts", "regata", "sandalia", "sandália", "chinelo"}:
        return False
    if temperature > 28 and cat in {"casaco", "sobretudo", "moletom", "bota"}:
        return False
    return True


async def _reload_looks(db: AsyncSession, look_ids: list[int]) -> List[Look]:
    result = await db.execute(
        select(Look)
        .where(Look.id.in_(look_ids))
        .options(selectinload(Look.items).selectinload(LookItem.clothing_item))
    )
    return list(result.scalars().all())


async def _generate_rule_based(
    db: AsyncSession,
    owner_id: int,
    request: GenerateLookRequest,
    all_items: list[ClothingItem],
) -> List[Look]:
    temperature = request.temperature
    suitable = [i for i in all_items if _is_suitable_for_temp(i, temperature)]
    if len(suitable) < 2:
        suitable = all_items

    tops = [i for i in suitable if (i.category or "").lower() in TOP_CATEGORIES]
    bottoms = [i for i in suitable if (i.category or "").lower() in BOTTOM_CATEGORIES]
    shoes = [i for i in suitable if (i.category or "").lower() in SHOE_CATEGORIES]
    outers = [i for i in suitable if (i.category or "").lower() in OUTER_CATEGORIES]

    generated: List[Look] = []
    for _ in range(request.count):
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

        unique_items = list({i.id: i for i in selected}.values())
        title = f"Look {request.occasion}"
        if temperature is not None:
            title += f" · {temperature:.0f}°C"

        look = Look(
            owner_id=owner_id,
            title=title,
            occasion=request.occasion,
            temperature=temperature,
            rationale=(
                f"Montado para a ocasiao {request.occasion} por regras basicas. "
                "Configure GEMINI_API_KEY para julgamento de estilo com IA."
            ),
            meta={"generator": "rule_based_v1"},
        )
        db.add(look)
        await db.flush()
        for pos, item in enumerate(unique_items):
            db.add(LookItem(look_id=look.id, clothing_item_id=item.id, position=pos))
        generated.append(look)

    await db.commit()
    return await _reload_looks(db, [l.id for l in generated])


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
            detail="Adicione pelo menos duas pecas ao guarda-roupa para gerar looks.",
        )

    settings = get_settings()
    if not (settings.GEMINI_API_KEY or "").strip():
        return await _generate_rule_based(db, owner_id, request, all_items)

    wardrobe = [_item_to_dict(i) for i in all_items if _is_suitable_for_temp(i, request.temperature)]
    if len(wardrobe) < 2:
        wardrobe = [_item_to_dict(i) for i in all_items]

    by_id = {i.id: i for i in all_items}

    try:
        ai_looks = await gemini_service.generate_looks_with_ai(
            wardrobe=wardrobe,
            occasion=request.occasion,
            temperature=request.temperature,
            count=request.count,
        )
    except Exception:
        return await _generate_rule_based(db, owner_id, request, all_items)

    generated: List[Look] = []
    for entry in ai_looks[: request.count]:
        raw_ids = entry.get("item_ids") or []
        ids = []
        seen = set()
        for x in raw_ids:
            try:
                i = int(x)
            except (TypeError, ValueError):
                continue
            if i in by_id and i not in seen:
                seen.add(i)
                ids.append(i)
        if len(ids) < 2:
            continue

        look = Look(
            owner_id=owner_id,
            title=entry.get("title") or f"Look {request.occasion}",
            occasion=request.occasion,
            temperature=request.temperature,
            rationale=entry.get("rationale") or "",
            meta={"generator": "gemini"},
        )
        db.add(look)
        await db.flush()
        for pos, cid in enumerate(ids):
            db.add(LookItem(look_id=look.id, clothing_item_id=cid, position=pos))
        generated.append(look)

    if not generated:
        return await _generate_rule_based(db, owner_id, request, all_items)

    await db.commit()
    return await _reload_looks(db, [l.id for l in generated])


async def evaluate_look(
    db: AsyncSession,
    owner_id: int,
    data: EvaluateLookRequest,
) -> dict:
    settings = get_settings()
    if not (settings.GEMINI_API_KEY or "").strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure GEMINI_API_KEY no Render para avaliar looks com IA.",
        )

    result = await db.execute(
        select(ClothingItem).where(
            ClothingItem.owner_id == owner_id,
            ClothingItem.id.in_(data.clothing_item_ids),
            ClothingItem.is_active == True,
        )
    )
    items = list(result.scalars().all())
    if not items:
        raise HTTPException(status_code=404, detail="Nenhuma peca encontrada.")

    try:
        return await gemini_service.evaluate_look_with_ai(
            items=[_item_to_dict(i) for i in items],
            occasion=data.occasion,
            temperature=data.temperature,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao consultar Gemini: {e}",
        )


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Look nao encontrado")

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
