"""add projects foundation

Revision ID: k6f7g8h9i0j1
Revises: j5e6f7a8b9c0
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime, timezone

revision = "k6f7g8h9i0j1"
down_revision = "j5e6f7a8b9c0"
branch_labels = None
depends_on = None


project_status_enum = postgresql.ENUM("open", "done", "archived", name="projectstatus", create_type=False)
project_priority_enum = postgresql.ENUM("low", "medium", "high", name="projectpriority", create_type=False)
project_source_type_enum = postgresql.ENUM("manual", "message", name="projectsourcetype", create_type=False)
project_channel_enum = postgresql.ENUM(
    "whatsapp",
    "telegram",
    "email",
    "sms",
    "web",
    name="projectchanneltype",
    create_type=False,
)


def upgrade():
    bind = op.get_bind()
    project_status_enum.create(bind, checkfirst=True)
    project_priority_enum.create(bind, checkfirst=True)
    project_source_type_enum.create(bind, checkfirst=True)
    project_channel_enum.create(bind, checkfirst=True)

    op.create_table(
        "project_stages",
        sa.Column("key", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("key"),
    )

    op.create_table(
        "projects",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("reference_code", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("stage", sa.String(length=50), nullable=False),
        sa.Column("status", project_status_enum, nullable=False, server_default="open"),
        sa.Column("priority", project_priority_enum, nullable=False, server_default="medium"),
        sa.Column("source_type", project_source_type_enum, nullable=False, server_default="manual"),
        sa.Column("source_message_id", sa.UUID(), nullable=True),
        sa.Column("source_conversation_id", sa.UUID(), nullable=True),
        sa.Column("contact_name", sa.String(length=255), nullable=True),
        sa.Column("channel", project_channel_enum, nullable=True),
        sa.Column("tag", sa.String(length=100), nullable=True),
        sa.Column("owner_user_id", sa.UUID(), nullable=True),
        sa.Column("created_by_user_id", sa.UUID(), nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("value", sa.Integer(), nullable=True),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["source_conversation_id"], ["conversations.id"]),
        sa.ForeignKeyConstraint(["source_message_id"], ["messages.id"]),
        sa.ForeignKeyConstraint(["stage"], ["project_stages.key"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference_code"),
    )

    op.create_index(op.f("ix_projects_stage"), "projects", ["stage"], unique=False)
    op.create_index(op.f("ix_projects_owner_user_id"), "projects", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_projects_source_conversation_id"), "projects", ["source_conversation_id"], unique=False)
    op.create_index(op.f("ix_projects_source_message_id"), "projects", ["source_message_id"], unique=False)

    project_stages = sa.table(
        "project_stages",
        sa.column("key", sa.String(length=50)),
        sa.column("label", sa.String(length=100)),
        sa.column("position", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    now = datetime.now(timezone.utc)
    op.bulk_insert(
        project_stages,
        [
            {"key": "lead", "label": "Lead", "position": 1, "is_active": True, "created_at": now, "updated_at": now},
            {"key": "qualification", "label": "Qualification", "position": 2, "is_active": True, "created_at": now, "updated_at": now},
            {"key": "proposal", "label": "Proposal", "position": 3, "is_active": True, "created_at": now, "updated_at": now},
            {"key": "negotiation", "label": "Negotiation", "position": 4, "is_active": True, "created_at": now, "updated_at": now},
            {"key": "closed", "label": "Closed", "position": 5, "is_active": True, "created_at": now, "updated_at": now},
        ],
    )


def downgrade():
    op.drop_index(op.f("ix_projects_source_message_id"), table_name="projects")
    op.drop_index(op.f("ix_projects_source_conversation_id"), table_name="projects")
    op.drop_index(op.f("ix_projects_owner_user_id"), table_name="projects")
    op.drop_index(op.f("ix_projects_stage"), table_name="projects")
    op.drop_table("projects")
    op.drop_table("project_stages")

    bind = op.get_bind()
    project_channel_enum.drop(bind, checkfirst=True)
    project_source_type_enum.drop(bind, checkfirst=True)
    project_priority_enum.drop(bind, checkfirst=True)
    project_status_enum.drop(bind, checkfirst=True)
