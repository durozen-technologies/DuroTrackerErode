"""Drop minimum_stock from items

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-07-25 16:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("items", "minimum_stock")


def downgrade() -> None:
    op.add_column(
        "items",
        sa.Column(
            "minimum_stock",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0",
        ),
    )
