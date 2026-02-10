from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LessonPage(Base):
    __tablename__ = "lesson_pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)

    lesson = relationship("Lesson", back_populates="pages")
    audio = relationship("PageAudio", back_populates="page", cascade="all, delete")
    progress = relationship("PageProgress", back_populates="page", cascade="all, delete")
