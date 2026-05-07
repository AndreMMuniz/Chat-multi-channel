"""add clients table and commercial proposal fields

Revision ID: r4s5t6u7v8w9
Revises: q3r4s5t6u7v8
Create Date: 2026-05-07
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "r4s5t6u7v8w9"
down_revision = "q3r4s5t6u7v8"
branch_labels = None
depends_on = None

# referências aos enums já existentes no banco (create_type=False = não recriar)
_clienttype = postgresql.ENUM(name="clienttype", create_type=False)
_proposaltype = postgresql.ENUM(name="proposaltype", create_type=False)


def upgrade() -> None:
    # 1. Criar enums via DO block (seguro em retries — ignora se já existir)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE clienttype AS ENUM ('individual', 'company');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE proposaltype AS ENUM ('product', 'service');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    # 2. Estender proposalstatus com novos valores
    op.execute("ALTER TYPE proposalstatus ADD VALUE IF NOT EXISTS 'expired'")
    op.execute("ALTER TYPE proposalstatus ADD VALUE IF NOT EXISTS 'cancelled'")

    # 3. Tabela clients
    op.create_table(
        "clients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("country", sa.String(2), nullable=False, server_default="BR"),
        sa.Column("client_type", _clienttype, nullable=False, server_default="company"),
        sa.Column("tax_id", sa.String(30), nullable=True),
        sa.Column("tax_id_type", sa.String(20), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="BRL"),
        sa.Column("company_name", sa.String(255), nullable=True),
        sa.Column("website", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("contact_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contacts.id"), nullable=True),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("tax_id IS NULL OR tax_id_type IS NOT NULL", name="ck_clients_tax_id_type"),
    )
    op.create_index("ix_clients_email", "clients", ["email"])
    op.create_index("ix_clients_name", "clients", ["name"])

    # 4. Novos campos na tabela proposals
    op.add_column("proposals", sa.Column("client_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("clients.id"), nullable=True))
    op.add_column("proposals", sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("proposals", sa.Column("proposal_type", _proposaltype, nullable=True))
    op.add_column("proposals", sa.Column("currency", sa.String(3), nullable=False, server_default="BRL"))
    op.add_column("proposals", sa.Column("payment_method", sa.String(100), nullable=True))
    op.add_column("proposals", sa.Column("payment_terms", sa.Text, nullable=True))
    op.add_column("proposals", sa.Column("payment_installments", sa.Integer, nullable=True))
    op.add_column("proposals", sa.Column("delivery_deadline", sa.Date, nullable=True))
    op.add_column("proposals", sa.Column("delivery_days", sa.Integer, nullable=True))
    op.add_column("proposals", sa.Column("valid_until", sa.Date, nullable=True))
    op.create_index("ix_proposals_client_id", "proposals", ["client_id"])

    # 5. Tabela proposal_service_details
    op.create_table(
        "proposal_service_details",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("proposal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("service_name", sa.String(255), nullable=False),
        sa.Column("scope_of_work", sa.Text, nullable=True),
        sa.Column("methodology", sa.Text, nullable=True),
        sa.Column("hourly_rate", sa.Numeric(15, 2), nullable=True),
        sa.Column("estimated_hours", sa.Integer, nullable=True),
        sa.Column("client_responsibilities", postgresql.ARRAY(sa.Text), nullable=False, server_default="{}"),
        sa.Column("delivery_responsibilities", postgresql.ARRAY(sa.Text), nullable=False, server_default="{}"),
        sa.Column("revision_rounds", sa.Integer, nullable=True),
        sa.Column("support_period_days", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # 6. Tabela proposal_status_history (append-only)
    op.create_table(
        "proposal_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("proposal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_status", sa.String(30), nullable=True),
        sa.Column("to_status", sa.String(30), nullable=False),
        sa.Column("changed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_proposal_status_history_proposal_id", "proposal_status_history", ["proposal_id"])


def downgrade() -> None:
    op.drop_index("ix_proposal_status_history_proposal_id", "proposal_status_history")
    op.drop_table("proposal_status_history")
    op.drop_table("proposal_service_details")

    op.drop_index("ix_proposals_client_id", "proposals")
    for col in ["client_id", "owner_user_id", "proposal_type", "currency",
                "payment_method", "payment_terms", "payment_installments",
                "delivery_deadline", "delivery_days", "valid_until"]:
        op.drop_column("proposals", col)

    op.drop_index("ix_clients_name", "clients")
    op.drop_index("ix_clients_email", "clients")
    op.drop_table("clients")

    op.execute("DROP TYPE IF EXISTS proposaltype")
    op.execute("DROP TYPE IF EXISTS clienttype")
