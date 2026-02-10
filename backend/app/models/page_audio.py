from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PageAudio(Base):
    __tablename__ = "page_audio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_page_id: Mapped[int] = mapped_column(ForeignKey("lesson_pages.id", ondelete="CASCADE"), nullable=False)
    file_key: Mapped[str] = mapped_column(String(512), nullable=False)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    page = relationship("LessonPage", back_populates="audio")
