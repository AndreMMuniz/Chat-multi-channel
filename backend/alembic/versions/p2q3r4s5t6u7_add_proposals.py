"""add proposals

Revision ID: p2q3r4s5t6u7
Revises: o1p2q3r4s5t6
Create Date: 2026-05-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "p2q3r4s5t6u7"
down_revision = "o1p2q3r4s5t6"
branch_labels = None
depends_on = None


proposal_status_enum = postgresql.ENUM(
    "draft",
    "sent",
    "approved",
    "rejected",
    "archived",
    name="proposalstatus",
    create_type=False,
)


def upgrade():
    bind = op.get_bind()
    proposal_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "proposals",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("reference_code", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("customer_name", sa.String(length=255), nullable=True),
        sa.Column("status", proposal_status_enum, nullable=False, server_default="draft"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("subtotal_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("discount_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_by_user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference_code"),
    )

    op.create_table(
        "proposal_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("proposal_id", sa.UUID(), nullable=False),
        sa.Column("catalog_item_id", sa.UUID(), nullable=True),
        sa.Column("catalog_reference_code", sa.String(length=32), nullable=True),
        sa.Column("name_snapshot", sa.String(length=255), nullable=False),
        sa.Column("commercial_name_snapshot", sa.String(length=255), nullable=False),
        sa.Column("type_snapshot", sa.String(length=32), nullable=False),
        sa.Column("sku_snapshot", sa.String(length=120), nullable=True),
        sa.Column("category_snapshot", sa.String(length=120), nullable=False),
        sa.Column("commercial_description_snapshot", sa.Text(), nullable=False),
        sa.Column("base_price_snapshot", sa.Integer(), nullable=False),
        sa.Column("unit_snapshot", sa.String(length=120), nullable=False),
        sa.Column("sla_or_delivery_time_snapshot", sa.String(length=255), nullable=True),
        sa.Column("allows_discount_snapshot", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("unit_price", sa.Integer(), nullable=False),
        sa.Column("discount_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"]),
        sa.ForeignKeyConstraint(["proposal_id"], ["proposals.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_proposals_status"), "proposals", ["status"], unique=False)
    op.create_index(op.f("ix_proposal_items_proposal_id"), "proposal_items", ["proposal_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_proposal_items_proposal_id"), table_name="proposal_items")
    op.drop_index(op.f("ix_proposals_status"), table_name="proposals")
    op.drop_table("proposal_items")
    op.drop_table("proposals")

    bind = op.get_bind()
    proposal_status_enum.drop(bind, checkfirst=True)
