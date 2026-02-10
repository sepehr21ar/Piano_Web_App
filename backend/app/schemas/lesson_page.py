from pydantic import BaseModel


class PageAudioOut(BaseModel):
    id: int
    file_key: str
    duration_ms: int | None
    title: str | None

    class Config:
        from_attributes = True


class LessonPageOut(BaseModel):
    id: int
    page_number: int
    audio: list[PageAudioOut]

    class Config:
        from_attributes = True
