"""add_api_credentials_to_settings

Revision ID: c9f2e1d3a8b5
Revises: bf57d943ecd0
Create Date: 2026-04-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c9f2e1d3a8b5'
down_revision: Union[str, Sequence[str], None] = 'bf57d943ecd0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # WhatsApp (Meta Cloud API)
    op.add_column('general_settings', sa.Column('whatsapp_phone_id',     sa.String(), nullable=True))
    op.add_column('general_settings', sa.Column('whatsapp_account_id',   sa.String(), nullable=True))
    op.add_column('general_settings', sa.Column('whatsapp_access_token', sa.String(), nullable=True))
    op.add_column('general_settings', sa.Column('whatsapp_webhook_token',sa.String(), nullable=True))

    # Email (IMAP/SMTP)
    op.add_column('general_settings', sa.Column('email_imap_host', sa.String(),  nullable=True))
    op.add_column('general_settings', sa.Column('email_imap_port', sa.Integer(), nullable=True))
    op.add_column('general_settings', sa.Column('email_smtp_host', sa.String(),  nullable=True))
    op.add_column('general_settings', sa.Column('email_smtp_port', sa.Integer(), nullable=True))
    op.add_column('general_settings', sa.Column('email_address',   sa.String(),  nullable=True))
    op.add_column('general_settings', sa.Column('email_password',  sa.String(),  nullable=True))

    # SMS (Twilio)
    op.add_column('general_settings', sa.Column('twilio_account_sid',  sa.String(), nullable=True))
    op.add_column('general_settings', sa.Column('twilio_auth_token',   sa.String(), nullable=True))
    op.add_column('general_settings', sa.Column('twilio_phone_number', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('general_settings', 'twilio_phone_number')
    op.drop_column('general_settings', 'twilio_auth_token')
    op.drop_column('general_settings', 'twilio_account_sid')
    op.drop_column('general_settings', 'email_password')
    op.drop_column('general_settings', 'email_address')
    op.drop_column('general_settings', 'email_smtp_port')
    op.drop_column('general_settings', 'email_smtp_host')
    op.drop_column('general_settings', 'email_imap_port')
    op.drop_column('general_settings', 'email_imap_host')
    op.drop_column('general_settings', 'whatsapp_webhook_token')
    op.drop_column('general_settings', 'whatsapp_access_token')
    op.drop_column('general_settings', 'whatsapp_account_id')
    op.drop_column('general_settings', 'whatsapp_phone_id')
