from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.event import Event
from app.models.lesson import Lesson
from app.models.lesson_page import LessonPage
from app.models.page_progress import PageProgress
from app.models.user import User
from app.schemas.lesson import LessonOut
from app.schemas.lesson_page import LessonPageOut
from app.schemas.page_progress import LessonPageProgressOut, PageProgressOut, PageProgressUpdate

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("", response_model=list[LessonOut])
async def list_lessons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lesson).order_by(Lesson.created_at.desc()))
    return result.scalars().all()


@router.get("/{lesson_id}", response_model=LessonOut)
async def get_lesson(lesson_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return lesson


@router.get("/{lesson_id}/pages/{page_number}", response_model=LessonPageOut)
async def get_page(lesson_id: int, page_number: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LessonPage)
        .options(selectinload(LessonPage.audio))
        .where(LessonPage.lesson_id == lesson_id, LessonPage.page_number == page_number)
    )
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    return page


@router.get("/{lesson_id}/progress", response_model=list[LessonPageProgressOut])
async def get_lesson_progress(
    lesson_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    page_result = await db.execute(
        select(LessonPage).where(LessonPage.lesson_id == lesson_id).order_by(LessonPage.page_number.asc())
    )
    pages = page_result.scalars().all()
    if not pages:
        return []

    progress_result = await db.execute(
        select(PageProgress)
        .join(LessonPage, LessonPage.id == PageProgress.lesson_page_id)
        .where(LessonPage.lesson_id == lesson_id, PageProgress.user_id == user.id)
    )
    progress_rows = progress_result.scalars().all()
    progress_by_page_id = {row.lesson_page_id: row for row in progress_rows}

    return [
        LessonPageProgressOut(
            page_number=lesson_page.page_number,
            status=progress_by_page_id[lesson_page.id].status if lesson_page.id in progress_by_page_id else "not_seen",
            updated_at=progress_by_page_id[lesson_page.id].updated_at if lesson_page.id in progress_by_page_id else None,
        )
        for lesson_page in pages
    ]


@router.get("/{lesson_id}/pages/{page_number}/progress", response_model=PageProgressOut)
async def get_progress(
    lesson_id: int,
    page_number: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LessonPage).where(LessonPage.lesson_id == lesson_id, LessonPage.page_number == page_number)
    )
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    result = await db.execute(
        select(PageProgress).where(PageProgress.lesson_page_id == page.id, PageProgress.user_id == user.id)
    )
    progress = result.scalar_one_or_none()
    if progress is None:
        return PageProgressOut(status="not_seen", updated_at=datetime.utcnow())
    return PageProgressOut(status=progress.status, updated_at=progress.updated_at)


@router.put("/{lesson_id}/pages/{page_number}/progress", response_model=PageProgressOut)
async def update_progress(
    lesson_id: int,
    page_number: int,
    payload: PageProgressUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LessonPage).where(LessonPage.lesson_id == lesson_id, LessonPage.page_number == page_number)
    )
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    result = await db.execute(
        select(PageProgress).where(PageProgress.lesson_page_id == page.id, PageProgress.user_id == user.id)
    )
    progress = result.scalar_one_or_none()
    previous_status = "not_seen"
    if progress is None:
        progress = PageProgress(user_id=user.id, lesson_page_id=page.id, status=payload.status)
        db.add(progress)
    else:
        previous_status = progress.status
        progress.status = payload.status
        progress.updated_at = datetime.utcnow()

    if previous_status != payload.status:
        db.add(
            Event(
                user_id=user.id,
                type="page_progress_changed",
                payload_json={
                    "lesson_id": lesson_id,
                    "page_number": page_number,
                    "from_status": previous_status,
                    "to_status": payload.status,
                },
            )
        )
        if payload.status == "done":
            db.add(
                Event(
                    user_id=user.id,
                    type="page_marked_done",
                    payload_json={
                        "lesson_id": lesson_id,
                        "page_number": page_number,
                    },
                )
            )
    await db.commit()
    await db.refresh(progress)
    return PageProgressOut(status=progress.status, updated_at=progress.updated_at)
