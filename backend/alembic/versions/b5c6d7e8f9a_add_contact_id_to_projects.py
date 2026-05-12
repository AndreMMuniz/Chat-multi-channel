"""add contact_id to projects

Revision ID: b5c6d7e8f9a
Revises: a4b5c6d7e8f9
Create Date: 2026-05-12 18:20:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "b5c6d7e8f9a"
down_revision = "a4b5c6d7e8f9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("contact_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("ix_projects_contact_id", "projects", ["contact_id"], unique=False)
    op.create_foreign_key(
        "fk_projects_contact_id_contacts",
        "projects",
        "contacts",
        ["contact_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_projects_contact_id_contacts", "projects", type_="foreignkey")
    op.drop_index("ix_projects_contact_id", table_name="projects")
    op.drop_column("projects", "contact_id")
