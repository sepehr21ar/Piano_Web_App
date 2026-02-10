from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models so Alembic can discover them
from app.models import user, lesson, lesson_page, page_audio, page_progress, event  # noqa: E402,F401
