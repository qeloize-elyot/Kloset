from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.reference import ReferenceCreate, ReferenceOut
from app.services import references as ref_service

router = APIRouter(prefix="/references", tags=["references"])


@router.post("", response_model=ReferenceOut, status_code=status.HTTP_201_CREATED)
async def create_reference(
    data: ReferenceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await ref_service.create_reference(db, current_user.id, data)
    return {
        "id": post.id,
        "author_id": post.author_id,
        "author_name": current_user.full_name or current_user.email.split("@")[0],
        "title": post.title,
        "caption": post.caption,
        "occasion": post.occasion,
        "climate": post.climate,
        "image": post.image,
        "likes_count": post.likes_count or 0,
        "created_at": post.created_at,
    }


@router.get("")
async def list_references(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ref_service.list_public_references(db)


@router.post("/{post_id}/like")
async def like_reference(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await ref_service.like_reference(db, post_id, current_user.id)
    return {"id": post.id, "likes_count": post.likes_count}


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reference(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ref_service.delete_own_reference(db, post_id, current_user.id)
