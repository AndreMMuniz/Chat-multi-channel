"""Add delivery_status, delivery_error, retry_count, last_retry_at to messages.

Revision ID: g2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-04-29
"""
import sqlalchemy as sa
from alembic import op

revision = 'g2b3c4d5e6f7'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "DO $$ BEGIN "
        "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deliverystatus') THEN "
        "CREATE TYPE deliverystatus AS ENUM ('pending', 'sent', 'delivered', 'failed'); "
        "END IF; "
        "END $$"
    )
    op.add_column('messages', sa.Column(
        'delivery_status',
        sa.Enum('pending', 'sent', 'delivered', 'failed', name='deliverystatus'),
        nullable=True,
    ))
    op.add_column('messages', sa.Column('delivery_error', sa.Text(), nullable=True))
    op.add_column('messages', sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('messages', sa.Column('last_retry_at', sa.DateTime(timezone=True), nullable=True))

    # Index for querying failed outbound messages efficiently
    op.create_index(
        'idx_messages_delivery_status',
        'messages',
        ['delivery_status', 'inbound'],
        postgresql_where=sa.text("inbound = false"),
    )


def downgrade() -> None:
    op.drop_index('idx_messages_delivery_status', table_name='messages')
    op.drop_column('messages', 'last_retry_at')
    op.drop_column('messages', 'retry_count')
    op.drop_column('messages', 'delivery_error')
    op.drop_column('messages', 'delivery_status')
