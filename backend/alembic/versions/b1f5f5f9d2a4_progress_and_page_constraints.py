"""add lesson page and progress constraints

Revision ID: b1f5f5f9d2a4
Revises: 32be7e1809df
Create Date: 2026-02-14 12:00:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "b1f5f5f9d2a4"
down_revision = "32be7e1809df"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uix_lesson_page_number",
        "lesson_pages",
        ["lesson_id", "page_number"],
    )
    op.create_check_constraint(
        "ck_page_progress_status",
        "page_progress",
        "status IN ('not_seen', 'in_practice', 'done')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_page_progress_status", "page_progress", type_="check")
    op.drop_constraint("uix_lesson_page_number", "lesson_pages", type_="unique")
