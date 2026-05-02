"""add telegram_bot_token to general_settings

Revision ID: j5e6f7a8b9c0
Revises: i4d5e6f7a8b9
Create Date: 2026-05-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'j5e6f7a8b9c0'
down_revision = 'i4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'general_settings',
        sa.Column('telegram_bot_token', sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column('general_settings', 'telegram_bot_token')
