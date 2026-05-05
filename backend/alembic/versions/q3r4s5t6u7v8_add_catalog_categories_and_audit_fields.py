"""add catalog categories and category linkage

Revision ID: q3r4s5t6u7v8
Revises: p2q3r4s5t6u7
Create Date: 2026-05-05
"""
from uuid import uuid4

from alembic import op
import sqlalchemy as sa

revision = "q3r4s5t6u7v8"
down_revision = "p2q3r4s5t6u7"
branch_labels = None
depends_on = None


catalog_categories = sa.table(
    "catalog_categories",
    sa.column("id", sa.UUID()),
    sa.column("key", sa.String(length=120)),
    sa.column("label", sa.String(length=120)),
    sa.column("position", sa.Integer()),
    sa.column("is_active", sa.Boolean()),
    sa.column("created_at", sa.DateTime(timezone=True)),
    sa.column("updated_at", sa.DateTime(timezone=True)),
)

catalog_items = sa.table(
    "catalog_items",
    sa.column("id", sa.UUID()),
    sa.column("category", sa.String(length=120)),
    sa.column("category_id", sa.UUID()),
)


def _slugify(value: str) -> str:
    normalized = "".join(ch.lower() if ch.isalnum() else "-" for ch in value.strip())
    while "--" in normalized:
        normalized = normalized.replace("--", "-")
    return normalized.strip("-")[:120] or "catalog-category"


def upgrade():
    op.create_table(
        "catalog_categories",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
        sa.UniqueConstraint("label"),
    )
    op.create_index(op.f("ix_catalog_categories_position"), "catalog_categories", ["position"], unique=False)
    op.add_column("catalog_items", sa.Column("category_id", sa.UUID(), nullable=True))
    op.create_index(op.f("ix_catalog_items_category_id"), "catalog_items", ["category_id"], unique=False)
    op.create_foreign_key(
        "fk_catalog_items_category_id_catalog_categories",
        "catalog_items",
        "catalog_categories",
        ["category_id"],
        ["id"],
    )

    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT DISTINCT category FROM catalog_items WHERE category IS NOT NULL AND category <> ''"))
    seen_keys = set()
    position = 1
    for row in rows:
        label = row[0]
        key = _slugify(label)
        suffix = 2
        while key in seen_keys:
            key = f"{_slugify(label)[:116]}-{suffix}"
            suffix += 1
        seen_keys.add(key)
        category_id = uuid4()

        bind.execute(
            catalog_categories.insert().values(
                id=category_id,
                key=key,
                label=label,
                position=position,
                is_active=True,
            )
        )
        bind.execute(
            catalog_items.update()
            .where(catalog_items.c.category == label)
            .values(category_id=category_id)
        )
        position += 1

    op.alter_column("catalog_items", "category_id", nullable=False)


def downgrade():
    op.drop_constraint("fk_catalog_items_category_id_catalog_categories", "catalog_items", type_="foreignkey")
    op.drop_index(op.f("ix_catalog_items_category_id"), table_name="catalog_items")
    op.drop_column("catalog_items", "category_id")
    op.drop_index(op.f("ix_catalog_categories_position"), table_name="catalog_categories")
    op.drop_table("catalog_categories")
