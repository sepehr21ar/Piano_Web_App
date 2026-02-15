from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ProgressStatus = Literal["not_seen", "in_practice", "done"]


class PageProgressOut(BaseModel):
    status: ProgressStatus
    updated_at: datetime


class PageProgressUpdate(BaseModel):
    status: ProgressStatus


class LessonPageProgressOut(BaseModel):
    page_number: int
    status: ProgressStatus
    updated_at: datetime | None = None
