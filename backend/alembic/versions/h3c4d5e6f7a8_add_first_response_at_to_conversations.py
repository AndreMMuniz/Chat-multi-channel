"""Add first_response_at to conversations for SLA tracking.

Revision ID: h3c4d5e6f7a8
Revises: g2b3c4d5e6f7
Create Date: 2026-04-29
"""
import sqlalchemy as sa
from alembic import op

revision = 'h3c4d5e6f7a8'
down_revision = 'g2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('conversations', sa.Column(
        'first_response_at',
        sa.DateTime(timezone=True),
        nullable=True,
    ))
    op.create_index(
        'idx_conversations_first_response',
        'conversations',
        ['first_response_at', 'status'],
        postgresql_where=sa.text("first_response_at IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index('idx_conversations_first_response', table_name='conversations')
    op.drop_column('conversations', 'first_response_at')
