"""Add company_name and is_active to parties

Revision ID: a1b2c3d4e5f6
Revises: c85f1ecd6ecb
Create Date: 2026-07-24 16:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "c85f1ecd6ecb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("parties", sa.Column("company_name", sa.String(length=255), nullable=True))
    op.add_column(
        "parties",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )


def downgrade() -> None:
    op.drop_column("parties", "is_active")
    op.drop_column("parties", "company_name")
