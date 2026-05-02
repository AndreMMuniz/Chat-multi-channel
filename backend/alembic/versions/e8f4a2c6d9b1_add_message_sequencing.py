"""add_message_sequencing

Revision ID: e8f4a2c6d9b1
Revises: d7e3f9a1b2c4
Create Date: 2026-04-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e8f4a2c6d9b1'
down_revision: Union[str, Sequence[str], None] = 'd7e3f9a1b2c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('messages', sa.Column('conversation_sequence', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('messages', sa.Column('idempotency_key', sa.String(255), nullable=True))
    op.create_unique_constraint('uq_messages_idempotency_key', 'messages', ['idempotency_key'])
    op.create_index('idx_messages_conversation_sequence', 'messages', ['conversation_id', 'conversation_sequence'])


def downgrade() -> None:
    op.drop_index('idx_messages_conversation_sequence', table_name='messages')
    op.drop_constraint('uq_messages_idempotency_key', 'messages', type_='unique')
    op.drop_column('messages', 'idempotency_key')
    op.drop_column('messages', 'conversation_sequence')
