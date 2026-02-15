from datetime import datetime
from typing import Literal

from pydantic import BaseModel

LessonCategory = Literal["lesson", "track"]
LessonLevel = Literal["beginners", "intermediate", "professional"]


class LessonCreate(BaseModel):
    title: str
    description: str | None = None
    category: LessonCategory = "lesson"
    level: LessonLevel = "beginners"


class LessonOut(BaseModel):
    id: int
    title: str
    description: str | None
    category: LessonCategory
    level: LessonLevel
    pdf_file_key: str | None
    page_count: int | None
    created_at: datetime

    class Config:
        from_attributes = True
