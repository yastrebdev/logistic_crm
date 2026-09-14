"""add user full name

Revision ID: 1cc7f5c0a9c4
Revises: d6510f6b5024
Create Date: 2026-09-10 17:25:57.473542
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1cc7f5c0a9c4"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "d6510f6b5024"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "full_name",
            sa.String(length=255),
            nullable=True,
        ),
    )


def downgrade() -> None:
    with op.batch_alter_table(
        "users"
    ) as batch_op:
        batch_op.drop_column(
            "full_name"
        )