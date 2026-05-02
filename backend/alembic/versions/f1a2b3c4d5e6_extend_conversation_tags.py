"""Extend conversation_tag enum with billing, feedback, spam.

Revision ID: f1a2b3c4d5e6
Revises: e8f4a2c6d9b1
Create Date: 2026-04-29
"""
from alembic import op

revision = 'f1a2b3c4d5e6'
down_revision = 'e8f4a2c6d9b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL requires ALTER TYPE to add enum values
    op.execute("ALTER TYPE conversationtag ADD VALUE IF NOT EXISTS 'billing'")
    op.execute("ALTER TYPE conversationtag ADD VALUE IF NOT EXISTS 'feedback'")
    op.execute("ALTER TYPE conversationtag ADD VALUE IF NOT EXISTS 'spam'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating the type.
    # Downgrade is a no-op — the extra values remain but are unused.
    pass
