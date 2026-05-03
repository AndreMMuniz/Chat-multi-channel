"""add project context links

Revision ID: l7h8i9j0k1l2
Revises: k6f7g8h9i0j1
Create Date: 2026-05-03
"""
from alembic import op
import sqlalchemy as sa

revision = "l7h8i9j0k1l2"
down_revision = "k6f7g8h9i0j1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("conversations", sa.Column("project_context_id", sa.UUID(), nullable=True))
    op.add_column("projects", sa.Column("project_context_id", sa.UUID(), nullable=True))

    op.create_foreign_key(
        "fk_conversations_project_context_id_projects",
        "conversations",
        "projects",
        ["project_context_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_projects_project_context_id_projects",
        "projects",
        "projects",
        ["project_context_id"],
        ["id"],
    )

    op.create_index(op.f("ix_conversations_project_context_id"), "conversations", ["project_context_id"], unique=False)
    op.create_index(op.f("ix_projects_project_context_id"), "projects", ["project_context_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_projects_project_context_id"), table_name="projects")
    op.drop_index(op.f("ix_conversations_project_context_id"), table_name="conversations")
    op.drop_constraint("fk_projects_project_context_id_projects", "projects", type_="foreignkey")
    op.drop_constraint("fk_conversations_project_context_id_projects", "conversations", type_="foreignkey")
    op.drop_column("projects", "project_context_id")
    op.drop_column("conversations", "project_context_id")
