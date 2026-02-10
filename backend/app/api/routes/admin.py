from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.lesson import Lesson
from app.models.lesson_page import LessonPage
from app.models.page_audio import PageAudio
from app.models.page_progress import PageProgress
from app.schemas.lesson import LessonCreate, LessonOut
from app.schemas.stats import LessonStatsOut
from app.utils.storage import storage
from PyPDF2 import PdfReader

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/lessons", response_model=LessonOut)
async def create_lesson(
    payload: LessonCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    lesson = Lesson(title=payload.title, description=payload.description)
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.post("/lessons/{lesson_id}/pdf", response_model=LessonOut)
async def upload_pdf(
    lesson_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    file_key = await storage.save_upload(file, f"lessons/{lesson_id}/pdf")
    pdf_path = storage.get_path(file_key)
    reader = PdfReader(str(pdf_path))
    page_count = len(reader.pages)

    lesson.pdf_file_key = file_key
    lesson.page_count = page_count

    await db.execute(delete(LessonPage).where(LessonPage.lesson_id == lesson_id))

    for page_number in range(1, page_count + 1):
        db.add(LessonPage(lesson_id=lesson_id, page_number=page_number))

    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.post("/lessons/{lesson_id}/pages/{page_number}/audio")
async def upload_audio(
    lesson_id: int,
    page_number: int,
    file: UploadFile = File(...),
    title: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    result = await db.execute(
        select(LessonPage)
        .where(LessonPage.lesson_id == lesson_id, LessonPage.page_number == page_number)
    )
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    file_key = await storage.save_upload(file, f"lessons/{lesson_id}/audio")
    audio = PageAudio(lesson_page_id=page.id, file_key=file_key, title=title)
    db.add(audio)
    await db.commit()
    await db.refresh(audio)
    return {"id": audio.id, "file_key": audio.file_key, "title": audio.title}


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    await db.delete(lesson)
    await db.commit()
    return {"ok": True}


@router.delete("/audio/{audio_id}")
async def delete_audio(
    audio_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    result = await db.execute(select(PageAudio).where(PageAudio.id == audio_id))
    audio = result.scalar_one_or_none()
    if audio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio not found")
    await db.delete(audio)
    await db.commit()
    return {"ok": True}


@router.get("/lessons/{lesson_id}/stats", response_model=LessonStatsOut)
async def lesson_stats(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    result = await db.execute(select(func.count(LessonPage.id)).where(LessonPage.lesson_id == lesson_id))
    total_pages = result.scalar_one() or 0

    result = await db.execute(
        select(PageProgress.status, func.count(PageProgress.id))
        .join(LessonPage, LessonPage.id == PageProgress.lesson_page_id)
        .where(LessonPage.lesson_id == lesson_id)
        .group_by(PageProgress.status)
    )
    counts = {status: count for status, count in result.all()}

    done_pages = counts.get("done", 0)
    in_practice_pages = counts.get("in_practice", 0)
    not_seen_pages = total_pages - done_pages - in_practice_pages

    return LessonStatsOut(
        total_pages=total_pages,
        done_pages=done_pages,
        in_practice_pages=in_practice_pages,
        not_seen_pages=not_seen_pages,
    )
