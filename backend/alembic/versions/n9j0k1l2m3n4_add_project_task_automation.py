"""add project task automation

Revision ID: n9j0k1l2m3n4
Revises: m8i9j0k1l2m3
Create Date: 2026-05-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "n9j0k1l2m3n4"
down_revision = "m8i9j0k1l2m3"
branch_labels = None
depends_on = None


project_task_automation_type_enum = postgresql.ENUM(
    "send_message",
    "scheduled_action",
    name="projecttaskautomationtype",
    create_type=False,
)
project_task_automation_status_enum = postgresql.ENUM(
    "scheduled",
    "processing",
    "completed",
    "failed",
    "cancelled",
    name="projecttaskautomationstatus",
    create_type=False,
)


def upgrade():
    bind = op.get_bind()
    project_task_automation_type_enum.create(bind, checkfirst=True)
    project_task_automation_status_enum.create(bind, checkfirst=True)

    op.add_column("project_tasks", sa.Column("automation_type", project_task_automation_type_enum, nullable=True))
    op.add_column("project_tasks", sa.Column("automation_status", project_task_automation_status_enum, nullable=True))
    op.add_column("project_tasks", sa.Column("automation_run_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("project_tasks", sa.Column("automation_message_content", sa.Text(), nullable=True))
    op.add_column("project_tasks", sa.Column("automation_action_label", sa.String(length=255), nullable=True))
    op.add_column("project_tasks", sa.Column("automation_last_error", sa.Text(), nullable=True))
    op.add_column("project_tasks", sa.Column("automation_executed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_index(op.f("ix_project_tasks_automation_run_at"), "project_tasks", ["automation_run_at"], unique=False)
    op.create_index(op.f("ix_project_tasks_automation_status"), "project_tasks", ["automation_status"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_project_tasks_automation_status"), table_name="project_tasks")
    op.drop_index(op.f("ix_project_tasks_automation_run_at"), table_name="project_tasks")
    op.drop_column("project_tasks", "automation_executed_at")
    op.drop_column("project_tasks", "automation_last_error")
    op.drop_column("project_tasks", "automation_action_label")
    op.drop_column("project_tasks", "automation_message_content")
    op.drop_column("project_tasks", "automation_run_at")
    op.drop_column("project_tasks", "automation_status")
    op.drop_column("project_tasks", "automation_type")

    bind = op.get_bind()
    project_task_automation_status_enum.drop(bind, checkfirst=True)
    project_task_automation_type_enum.drop(bind, checkfirst=True)
