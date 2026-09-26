from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException, status

from app.models.reference import ReferencePost
from app.models.user import User
from app.schemas.reference import ReferenceCreate


async def create_reference(
    db: AsyncSession, author_id: int, data: ReferenceCreate
) -> ReferencePost:
    post = ReferencePost(
        author_id=author_id,
        title=data.title.strip(),
        caption=(data.caption or "").strip() or None,
        occasion=(data.occasion or "").strip() or None,
        climate=(data.climate or "").strip() or None,
        image=data.image,
        likes_count=0,
        is_public=True,
        is_active=True,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def list_public_references(
    db: AsyncSession, limit: int = 40, exclude_author: int | None = None
) -> list[dict]:
    q = (
        select(ReferencePost, User)
        .join(User, User.id == ReferencePost.author_id)
        .where(ReferencePost.is_active == True, ReferencePost.is_public == True)
        .order_by(desc(ReferencePost.created_at))
        .limit(limit)
    )
    result = await db.execute(q)
    rows = result.all()
    out = []
    for post, user in rows:
        out.append(
            {
                "id": post.id,
                "author_id": post.author_id,
                "author_name": user.full_name or user.email.split("@")[0],
                "title": post.title,
                "caption": post.caption,
                "occasion": post.occasion,
                "climate": post.climate,
                "image": post.image,
                "likes_count": post.likes_count or 0,
                "created_at": post.created_at,
            }
        )
    return out


async def like_reference(db: AsyncSession, post_id: int, user_id: int) -> ReferencePost:
    result = await db.execute(
        select(ReferencePost).where(
            ReferencePost.id == post_id,
            ReferencePost.is_active == True,
        )
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post nao encontrado")
    post.likes_count = (post.likes_count or 0) + 1
    await db.commit()
    await db.refresh(post)
    return post


async def delete_own_reference(db: AsyncSession, post_id: int, author_id: int) -> None:
    result = await db.execute(
        select(ReferencePost).where(
            ReferencePost.id == post_id,
            ReferencePost.author_id == author_id,
        )
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post nao encontrado")
    post.is_active = False
    await db.commit()
