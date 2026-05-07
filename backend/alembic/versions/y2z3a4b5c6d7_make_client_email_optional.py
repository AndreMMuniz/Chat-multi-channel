"""make client email optional

Revision ID: y2z3a4b5c6d7
Revises: x1y2z3a4b5c6
Create Date: 2026-05-07
"""
from alembic import op

revision = "y2z3a4b5c6d7"
down_revision = "x1y2z3a4b5c6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("clients", "email", nullable=True)


def downgrade() -> None:
    # antes de reverter, garantir que não há NULLs
    op.execute("UPDATE clients SET email = 'unknown@unknown.invalid' WHERE email IS NULL")
    op.alter_column("clients", "email", nullable=False)
