from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (
        CheckConstraint(
            "category IN ('lesson', 'track')",
            name="ck_lessons_category",
        ),
        CheckConstraint(
            "level IN ('beginners', 'intermediate', 'professional')",
            name="ck_lessons_level",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(40), nullable=False, default="lesson")
    level: Mapped[str] = mapped_column(String(20), nullable=False, default="beginners")
    pdf_file_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    pages = relationship("LessonPage", back_populates="lesson", cascade="all, delete")
