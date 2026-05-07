"""remove email and phone from clients — contact data lives in contacts

Revision ID: z3a4b5c6d7e8
Revises: y2z3a4b5c6d7
Create Date: 2026-05-07
"""
from alembic import op

revision = "z3a4b5c6d7e8"
down_revision = "y2z3a4b5c6d7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_clients_email")
    op.execute("DROP INDEX IF EXISTS ix_clients_phone")
    op.drop_column("clients", "email")
    op.drop_column("clients", "phone")


def downgrade() -> None:
    import sqlalchemy as sa
    op.add_column("clients", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("clients", sa.Column("phone", sa.String(50), nullable=True))
