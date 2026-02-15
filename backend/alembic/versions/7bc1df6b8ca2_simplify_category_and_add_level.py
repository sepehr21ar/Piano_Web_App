"""simplify category and add level

Revision ID: 7bc1df6b8ca2
Revises: c4722dfe5f22
Create Date: 2026-02-15 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "7bc1df6b8ca2"
down_revision = "c4722dfe5f22"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE lessons
        SET category = CASE
            WHEN category = 'lesson' THEN 'lesson'
            ELSE 'track'
        END
        """
    )
    op.drop_constraint("ck_lessons_category", "lessons", type_="check")
    op.create_check_constraint(
        "ck_lessons_category",
        "lessons",
        "category IN ('lesson', 'track')",
    )

    op.add_column(
        "lessons",
        sa.Column("level", sa.String(length=20), nullable=False, server_default="beginners"),
    )
    op.create_check_constraint(
        "ck_lessons_level",
        "lessons",
        "level IN ('beginners', 'intermediate', 'professional')",
    )
    op.alter_column("lessons", "level", server_default=None)


def downgrade() -> None:
    op.drop_constraint("ck_lessons_level", "lessons", type_="check")
    op.drop_column("lessons", "level")

    op.drop_constraint("ck_lessons_category", "lessons", type_="check")
    op.create_check_constraint(
        "ck_lessons_category",
        "lessons",
        "category IN ('single_track', 'book_track', 'lesson', 'book_track_and_lesson')",
    )
