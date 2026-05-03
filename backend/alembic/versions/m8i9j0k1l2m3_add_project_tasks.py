"""add project tasks

Revision ID: m8i9j0k1l2m3
Revises: l7h8i9j0k1l2
Create Date: 2026-05-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "m8i9j0k1l2m3"
down_revision = "l7h8i9j0k1l2"
branch_labels = None
depends_on = None


project_task_status_enum = postgresql.ENUM(
    "open",
    "in_progress",
    "done",
    "cancelled",
    name="projecttaskstatus",
    create_type=False,
)
project_priority_enum = postgresql.ENUM("low", "medium", "high", name="projectpriority", create_type=False)


def upgrade():
    bind = op.get_bind()
    project_task_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "project_tasks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", project_task_status_enum, nullable=False, server_default="open"),
        sa.Column("priority", project_priority_enum, nullable=False, server_default="medium"),
        sa.Column("owner_user_id", sa.UUID(), nullable=True),
        sa.Column("source_message_id", sa.UUID(), nullable=True),
        sa.Column("source_conversation_id", sa.UUID(), nullable=True),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_conversation_id"], ["conversations.id"]),
        sa.ForeignKeyConstraint(["source_message_id"], ["messages.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_project_tasks_project_id"), "project_tasks", ["project_id"], unique=False)
    op.create_index(op.f("ix_project_tasks_owner_user_id"), "project_tasks", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_project_tasks_due_date"), "project_tasks", ["due_date"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_project_tasks_due_date"), table_name="project_tasks")
    op.drop_index(op.f("ix_project_tasks_owner_user_id"), table_name="project_tasks")
    op.drop_index(op.f("ix_project_tasks_project_id"), table_name="project_tasks")
    op.drop_table("project_tasks")

    bind = op.get_bind()
    project_task_status_enum.drop(bind, checkfirst=True)
