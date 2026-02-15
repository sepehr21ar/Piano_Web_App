from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PageProgress(Base):
    __tablename__ = "page_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_page_id", name="uix_user_page"),
        CheckConstraint(
            "status IN ('not_seen', 'in_practice', 'done')",
            name="ck_page_progress_status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lesson_page_id: Mapped[int] = mapped_column(ForeignKey("lesson_pages.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="not_seen", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="progress")
    page = relationship("LessonPage", back_populates="progress")
