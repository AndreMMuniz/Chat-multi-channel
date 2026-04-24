"""add_is_approved_to_users

Revision ID: d7e3f9a1b2c4
Revises: c9f2e1d3a8b5
Create Date: 2026-04-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd7e3f9a1b2c4'
down_revision: Union[str, Sequence[str], None] = 'c9f2e1d3a8b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing users are considered approved by default (True)
    op.add_column('users', sa.Column('is_approved', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_column('users', 'is_approved')
