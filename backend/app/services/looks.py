import colorsys
import random
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.clothing import ClothingItem
from app.models.look import Look, LookItem, LookFeedback
from app.schemas.look import GenerateLookRequest, LookFeedbackCreate, EvaluateLookRequest
from app.services import ai_style
from app.services.climate import resolve_climate


TOP_CATEGORIES = {
    "camiseta", "camisa", "blusa", "regata", "moletom", "sueter", "suéter",
}
BOTTOM_CATEGORIES = {"calca", "calça", "shorts", "saia", "bermuda"}
SHOE_CATEGORIES = {"tenis", "tênis", "sapato", "sandalia", "sandália", "bota", "chinelo"}
OUTER_CATEGORIES = {"jaqueta", "casaco", "blazer", "sobretudo"}
DRESS_CATEGORIES = {"vestido", "macacao", "macacão"}

TITLE_TEMPLATES = [
    "{occasion} · linha limpa",
    "{occasion} · contraste suave",
    "{occasion} · textura em jogo",
    "{occasion} · peça âncora",
    "{occasion} · silhueta clara",
    "{occasion} · camada leve",
    "{occasion} · néutros com ponto",
    "{occasion} · proporção",
]


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


def _hex_to_hsv(hex_color: str | None) -> tuple[float, float, float] | None:
    if not hex_color or not hex_color.startswith("#") or len(hex_color) < 7:
        return None
    try:
        r = int(hex_color[1:3], 16) / 255
        g = int(hex_color[3:5], 16) / 255
        b = int(hex_color[5:7], 16) / 255
        return colorsys.rgb_to_hsv(r, g, b)
    except ValueError:
        return None


def _color_score(a: ClothingItem, b: ClothingItem) -> float:
    ha = _hex_to_hsv(a.dominant_color)
    hb = _hex_to_hsv(b.dominant_color)
    if not ha or not hb:
        return 0.5
    h1, s1, v1 = ha
    h2, s2, v2 = hb
    dh = min(abs(h1 - h2), 1 - abs(h1 - h2))
    if dh < 0.08:
        return 0.85 + 0.1 * (1 - abs(v1 - v2))
    if 0.4 < dh < 0.6:
        return 0.9
    if s1 < 0.15 or s2 < 0.15:
        return 0.8
    if 0.28 < dh < 0.4:
        return 0.75
    return 0.35 + random.random() * 0.15


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


def _is_suitable_for_climate(item: ClothingItem, climate: str | None) -> bool:
    if not climate:
        return True
    cat = (item.category or "").lower()
    c = climate.lower()
    if c == "calor" and cat in {"casaco", "sobretudo", "moletom", "bota"}:
        return False
    if c == "frio" and cat in {"shorts", "regata", "sandalia", "sandália", "chinelo"}:
        return False
    if c == "chuva" and cat in {"chinelo", "sandalia", "sandália"}:
        return False
    return True


def _pick_best_partner(anchor: ClothingItem, candidates: list[ClothingItem]) -> ClothingItem | None:
    if not candidates:
        return None
    scored = [(c, _color_score(anchor, c) + random.random() * 0.2) for c in candidates]
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[: min(3, len(scored))]
    return random.choices([c for c, _ in top], weights=[s for _, s in top], k=1)[0]


def _creative_rationale(
    items: list[ClothingItem],
    occasion: str,
    temperature: float | None,
    condition: str | None,
) -> str:
    cats = [(i.category or "").lower() for i in items]
    colors = [i.dominant_color for i in items if i.dominant_color]
    fabrics = [i.fabric for i in items if i.fabric]
    patterns = [i.pattern for i in items if i.pattern and i.pattern != "lisa"]

    bits = []
    if len({c for c in colors if c}) >= 2:
        bits.append("As cores foram cruzadas para não ficar tudo no mesmo tom.")
    if patterns:
        bits.append(f"A estampa ({patterns[0]}) ganha respiro com peças mais lisas.")
    if any(c in OUTER_CATEGORIES for c in cats):
        bits.append("Camada externa fecha o look e resolve o clima.")
    if any(c in DRESS_CATEGORIES for c in cats):
        bits.append("O vestido/macacão é a peça âncora; o resto só apoia.")
    if fabrics:
        bits.append(f"Textura em jogo com {fabrics[0]}.")
    if not bits:
        bits.append("Proporção cima/baixo pensada para a ocasião, sem forçar tendência.")

    head = f"Para “{occasion}”."
    if condition and temperature is not None:
        head += f" Clima {condition} (~{temperature:.0f}°C)."
    elif condition:
        head += f" Clima: {condition}."
    elif temperature is not None:
        head += f" Temperatura {temperature:.0f}°C."

    return head + " " + " ".join(bits[:3])


async def _reload_looks(db: AsyncSession, look_ids: list[int]) -> List[Look]:
    result = await db.execute(
        select(Look)
        .where(Look.id.in_(look_ids))
        .options(selectinload(Look.items).selectinload(LookItem.clothing_item))
    )
    return list(result.scalars().all())


async def _liked_item_ids(db: AsyncSession, owner_id: int) -> set[int]:
    result = await db.execute(
        select(Look)
        .where(Look.owner_id == owner_id)
        .options(selectinload(Look.items))
        .order_by(Look.created_at.desc())
        .limit(30)
    )
    looks = list(result.scalars().all())
    fb = await db.execute(
        select(LookFeedback).where(
            LookFeedback.user_id == owner_id,
            LookFeedback.rating.in_(["like", "used"]),
        )
    )
    liked_look_ids = {f.look_id for f in fb.scalars().all()}
    ids: set[int] = set()
    for look in looks:
        if look.id in liked_look_ids:
            for li in look.items:
                ids.add(li.clothing_item_id)
    return ids


async def _generate_rule_based(
    db: AsyncSession,
    owner_id: int,
    request: GenerateLookRequest,
    all_items: list[ClothingItem],
    temperature: float | None,
    condition: str | None,
) -> List[Look]:
    suitable = [
        i
        for i in all_items
        if _is_suitable_for_temp(i, temperature) and _is_suitable_for_climate(i, condition)
    ]
    if len(suitable) < 2:
        suitable = all_items

    liked = await _liked_item_ids(db, owner_id)

    tops = [i for i in suitable if (i.category or "").lower() in TOP_CATEGORIES]
    bottoms = [i for i in suitable if (i.category or "").lower() in BOTTOM_CATEGORIES]
    shoes = [i for i in suitable if (i.category or "").lower() in SHOE_CATEGORIES]
    outers = [i for i in suitable if (i.category or "").lower() in OUTER_CATEGORIES]
    dresses = [i for i in suitable if (i.category or "").lower() in DRESS_CATEGORIES]

    def bias(pool: list[ClothingItem]) -> list[ClothingItem]:
        if not pool:
            return pool
        preferred = [i for i in pool if i.id in liked]
        if preferred and random.random() < 0.55:
            return preferred + [i for i in pool if i.id not in liked]
        return pool

    tops, bottoms, shoes, outers, dresses = map(bias, [tops, bottoms, shoes, outers, dresses])

    used_combos: set[tuple[int, ...]] = set()
    generated: List[Look] = []
    need_outer = condition in {"frio", "chuva", "vento"} or (
        temperature is not None and temperature < 18
    )

    for _ in range(request.count * 4):
        if len(generated) >= request.count:
            break
        selected: List[ClothingItem] = []

        if dresses and random.random() < 0.22:
            d = random.choice(dresses)
            selected.append(d)
            if shoes:
                partner = _pick_best_partner(d, shoes)
                if partner:
                    selected.append(partner)
            if need_outer and outers:
                o = _pick_best_partner(d, outers)
                if o:
                    selected.append(o)
        else:
            if tops:
                t = random.choice(tops)
                selected.append(t)
                if bottoms:
                    b = _pick_best_partner(t, bottoms)
                    if b:
                        selected.append(b)
                if shoes and random.random() > 0.2:
                    s = _pick_best_partner(selected[-1], shoes)
                    if s:
                        selected.append(s)
                if need_outer and outers and random.random() > 0.25:
                    o = _pick_best_partner(selected[0], outers)
                    if o:
                        selected.append(o)
            else:
                selected = random.sample(suitable, min(3, len(suitable)))

        if len(selected) < 2:
            selected = random.sample(suitable, min(3, len(suitable)))

        unique_items = list({i.id: i for i in selected}.values())
        key = tuple(sorted(i.id for i in unique_items))
        if key in used_combos:
            continue
        used_combos.add(key)

        title = random.choice(TITLE_TEMPLATES).format(occasion=request.occasion)
        if condition:
            title += f" · {condition}"

        look = Look(
            owner_id=owner_id,
            title=title,
            occasion=request.occasion,
            temperature=temperature,
            weather_condition=condition,
            rationale=_creative_rationale(
                unique_items, request.occasion, temperature, condition
            ),
            meta={"generator": "creative_rules_v4", "climate": condition},
        )
        db.add(look)
        await db.flush()
        for pos, item in enumerate(unique_items):
            db.add(LookItem(look_id=look.id, clothing_item_id=item.id, position=pos))
        generated.append(look)

    if not generated:
        sample = random.sample(suitable, min(3, len(suitable)))
        look = Look(
            owner_id=owner_id,
            title=f"{request.occasion} · essencial",
            occasion=request.occasion,
            temperature=temperature,
            weather_condition=condition,
            rationale=_creative_rationale(sample, request.occasion, temperature, condition),
            meta={"generator": "creative_rules_v4", "climate": condition},
        )
        db.add(look)
        await db.flush()
        for pos, item in enumerate(sample):
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
            detail="Adicione pelo menos duas peças ao guarda-roupa para gerar looks.",
        )

    temperature, condition = resolve_climate(request.climate, request.temperature)

    if not ai_style.has_ai_key():
        return await _generate_rule_based(
            db, owner_id, request, all_items, temperature, condition
        )

    wardrobe = [
        _item_to_dict(i)
        for i in all_items
        if _is_suitable_for_temp(i, temperature) and _is_suitable_for_climate(i, condition)
    ]
    if len(wardrobe) < 2:
        wardrobe = [_item_to_dict(i) for i in all_items]

    by_id = {i.id: i for i in all_items}

    try:
        ai_looks = await ai_style.generate_looks_with_ai(
            wardrobe=wardrobe,
            occasion=request.occasion,
            temperature=temperature,
            count=request.count,
        )
    except Exception:
        return await _generate_rule_based(
            db, owner_id, request, all_items, temperature, condition
        )

    generated: List[Look] = []
    for entry in ai_looks[: request.count]:
        raw_ids = entry.get("item_ids") or []
        ids: list[int] = []
        seen: set[int] = set()
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

        rationale = entry.get("rationale") or ""
        if condition:
            rationale = f"Clima {condition}. " + rationale

        look = Look(
            owner_id=owner_id,
            title=entry.get("title") or f"{request.occasion} · proposta",
            occasion=request.occasion,
            temperature=temperature,
            weather_condition=condition,
            rationale=rationale,
            meta={"generator": "ai", "climate": condition},
        )
        db.add(look)
        await db.flush()
        for pos, cid in enumerate(ids):
            db.add(LookItem(look_id=look.id, clothing_item_id=cid, position=pos))
        generated.append(look)

    if not generated:
        return await _generate_rule_based(
            db, owner_id, request, all_items, temperature, condition
        )

    await db.commit()
    return await _reload_looks(db, [l.id for l in generated])


async def get_inspiration_feed(
    db: AsyncSession,
    owner_id: int,
    limit: int = 12,
) -> list[dict]:
    result = await db.execute(
        select(ClothingItem).where(
            ClothingItem.owner_id == owner_id,
            ClothingItem.is_active == True,
        )
    )
    items = list(result.scalars().all())
    if len(items) < 2:
        return []

    liked = await _liked_item_ids(db, owner_id)
    cards: list[dict] = []
    used: set[tuple[int, ...]] = set()

    for _ in range(limit * 3):
        if len(cards) >= limit:
            break
        mood = random.choice([
            "casual", "trabalho", "encontro", "fim de semana", "noite", "passeio",
        ])
        tops = [i for i in items if (i.category or "").lower() in TOP_CATEGORIES]
        bottoms = [i for i in items if (i.category or "").lower() in BOTTOM_CATEGORIES]
        shoes = [i for i in items if (i.category or "").lower() in SHOE_CATEGORIES]
        outers = [i for i in items if (i.category or "").lower() in OUTER_CATEGORIES]
        dresses = [i for i in items if (i.category or "").lower() in DRESS_CATEGORIES]

        selected: list[ClothingItem] = []
        if dresses and random.random() < 0.2:
            selected.append(random.choice(dresses))
            if shoes:
                p = _pick_best_partner(selected[0], shoes)
                if p:
                    selected.append(p)
        elif tops:
            t = random.choice(
                tops if random.random() > 0.4 or not liked else (
                    [i for i in tops if i.id in liked] or tops
                )
            )
            selected.append(t)
            if bottoms:
                b = _pick_best_partner(t, bottoms)
                if b:
                    selected.append(b)
            if shoes and random.random() > 0.25:
                s = _pick_best_partner(selected[-1], shoes)
                if s:
                    selected.append(s)
            if outers and random.random() > 0.55:
                o = _pick_best_partner(selected[0], outers)
                if o:
                    selected.append(o)

        if len(selected) < 2:
            selected = random.sample(items, min(3, len(items)))

        unique = list({i.id: i for i in selected}.values())
        key = tuple(sorted(i.id for i in unique))
        if key in used:
            continue
        used.add(key)

        score = sum(1.2 if i.id in liked else 1.0 for i in unique)
        score += sum(
            _color_score(unique[i], unique[j])
            for i in range(len(unique))
            for j in range(i + 1, len(unique))
        )

        cards.append({
            "id": f"insp-{key[0]}-{key[-1]}-{len(cards)}",
            "title": random.choice(TITLE_TEMPLATES).format(occasion=mood),
            "mood": mood,
            "score": round(score, 2),
            "rationale": _creative_rationale(unique, mood, None, None),
            "items": [
                {
                    "id": i.id,
                    "name": i.name,
                    "category": i.category,
                    "dominant_color": i.dominant_color,
                    "image": i.image_clean or i.image_front,
                    "pattern": i.pattern,
                    "fabric": i.fabric,
                }
                for i in unique
            ],
        })

    cards.sort(key=lambda c: c["score"], reverse=True)
    return cards[:limit]


async def evaluate_look(
    db: AsyncSession,
    owner_id: int,
    data: EvaluateLookRequest,
) -> dict:
    if not ai_style.has_ai_key():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Configure GROQ_API_KEY (recomendado) ou GEMINI_API_KEY no Render "
                "para avaliar looks com IA."
            ),
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
        raise HTTPException(status_code=404, detail="Nenhuma peça encontrada.")

    try:
        return await ai_style.evaluate_look_with_ai(
            items=[_item_to_dict(i) for i in items],
            occasion=data.occasion,
            temperature=data.temperature,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao consultar IA: {e}",
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
