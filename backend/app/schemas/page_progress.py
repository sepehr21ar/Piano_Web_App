from datetime import datetime

from pydantic import BaseModel


class PageProgressOut(BaseModel):
    status: str
    updated_at: datetime


class PageProgressUpdate(BaseModel):
    status: str
