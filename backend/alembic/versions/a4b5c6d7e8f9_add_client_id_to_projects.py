"""add client_id to projects

Revision ID: a4b5c6d7e8f9
Revises: z3a4b5c6d7e8
Create Date: 2026-05-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "a4b5c6d7e8f9"
down_revision = "z3a4b5c6d7e8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_projects_client_id",
        "projects", "clients",
        ["client_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_projects_client_id",
        "projects",
        ["client_id"],
        postgresql_where=sa.text("client_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_projects_client_id", table_name="projects")
    op.drop_constraint("fk_projects_client_id", "projects", type_="foreignkey")
    op.drop_column("projects", "client_id")
