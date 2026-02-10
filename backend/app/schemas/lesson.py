from datetime import datetime

from pydantic import BaseModel


class LessonCreate(BaseModel):
    title: str
    description: str | None = None


class LessonOut(BaseModel):
    id: int
    title: str
    description: str | None
    pdf_file_key: str | None
    page_count: int | None
    created_at: datetime

    class Config:
        from_attributes = True
