from pydantic import BaseModel


class LessonStatsOut(BaseModel):
    total_pages: int
    done_pages: int
    in_practice_pages: int
    not_seen_pages: int
