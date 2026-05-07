"""add client_id to contacts

Revision ID: x1y2z3a4b5c6
Revises: r4s5t6u7v8w9
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "x1y2z3a4b5c6"
down_revision = "r4s5t6u7v8w9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "contacts",
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_contacts_client_id",
        "contacts", "clients",
        ["client_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_contacts_client_id",
        "contacts",
        ["client_id"],
        postgresql_where=sa.text("client_id IS NOT NULL"),
    )
    # índices auxiliares em clients para a query de detecção por email/phone
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE tablename = 'clients' AND indexname = 'ix_clients_phone'
            ) THEN
                CREATE INDEX ix_clients_phone ON clients(phone) WHERE phone IS NOT NULL;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.drop_index("ix_contacts_client_id", table_name="contacts")
    op.drop_constraint("fk_contacts_client_id", "contacts", type_="foreignkey")
    op.drop_column("contacts", "client_id")
