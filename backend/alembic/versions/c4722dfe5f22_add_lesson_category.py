"""add lesson category

Revision ID: c4722dfe5f22
Revises: b1f5f5f9d2a4
Create Date: 2026-02-14 12:30:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c4722dfe5f22"
down_revision = "b1f5f5f9d2a4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "lessons",
        sa.Column("category", sa.String(length=40), nullable=False, server_default="lesson"),
    )
    op.create_check_constraint(
        "ck_lessons_category",
        "lessons",
        "category IN ('single_track', 'book_track', 'lesson', 'book_track_and_lesson')",
    )
    op.alter_column("lessons", "category", server_default=None)


def downgrade() -> None:
    op.drop_constraint("ck_lessons_category", "lessons", type_="check")
    op.drop_column("lessons", "category")
