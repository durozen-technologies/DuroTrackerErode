"""Add unpaid_opening_balance to parties

Revision ID: d4e5f6a7b8c9
Revises: a1b2c3d4e5f6
Create Date: 2026-07-25 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "parties",
        sa.Column(
            "unpaid_opening_balance",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    # Backfill: standalone collection payments did not exist yet, so unpaid
    # opening equals the stored opening_balance for all existing parties.
    op.execute(
        sa.text("UPDATE parties SET unpaid_opening_balance = opening_balance")
    )


def downgrade() -> None:
    op.drop_column("parties", "unpaid_opening_balance")
