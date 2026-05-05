"""add catalog items

Revision ID: o1p2q3r4s5t6
Revises: n9j0k1l2m3n4
Create Date: 2026-05-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "o1p2q3r4s5t6"
down_revision = "n9j0k1l2m3n4"
branch_labels = None
depends_on = None


catalog_item_type_enum = postgresql.ENUM("product", "service", name="catalogitemtype", create_type=False)
catalog_item_status_enum = postgresql.ENUM(
    "active",
    "inactive",
    "discontinued",
    "under_review",
    name="catalogitemstatus",
    create_type=False,
)


def upgrade():
    bind = op.get_bind()
    catalog_item_type_enum.create(bind, checkfirst=True)
    catalog_item_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "catalog_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("reference_code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("commercial_name", sa.String(length=255), nullable=False),
        sa.Column("type", catalog_item_type_enum, nullable=False),
        sa.Column("status", catalog_item_status_enum, nullable=False, server_default="active"),
        sa.Column("category", sa.String(length=120), nullable=False),
        sa.Column("sku", sa.String(length=120), nullable=True),
        sa.Column("commercial_description", sa.Text(), nullable=False),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("base_price", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("unit", sa.String(length=120), nullable=False),
        sa.Column("sla_or_delivery_time", sa.String(length=255), nullable=True),
        sa.Column("usage_rules", sa.Text(), nullable=True),
        sa.Column("active_for_support", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("can_be_quoted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("allows_discount", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("replaced_by_catalog_item_id", sa.UUID(), nullable=True),
        sa.Column("created_by_user_id", sa.UUID(), nullable=False),
        sa.Column("updated_by_user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("price_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["replaced_by_catalog_item_id"], ["catalog_items.id"]),
        sa.ForeignKeyConstraint(["updated_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference_code"),
    )

    op.create_index(op.f("ix_catalog_items_type"), "catalog_items", ["type"], unique=False)
    op.create_index(op.f("ix_catalog_items_status"), "catalog_items", ["status"], unique=False)
    op.create_index(op.f("ix_catalog_items_category"), "catalog_items", ["category"], unique=False)
    op.create_index(op.f("ix_catalog_items_can_be_quoted"), "catalog_items", ["can_be_quoted"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_catalog_items_can_be_quoted"), table_name="catalog_items")
    op.drop_index(op.f("ix_catalog_items_category"), table_name="catalog_items")
    op.drop_index(op.f("ix_catalog_items_status"), table_name="catalog_items")
    op.drop_index(op.f("ix_catalog_items_type"), table_name="catalog_items")
    op.drop_table("catalog_items")

    bind = op.get_bind()
    catalog_item_status_enum.drop(bind, checkfirst=True)
    catalog_item_type_enum.drop(bind, checkfirst=True)
