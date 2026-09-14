"""add probation result and payment registration method

Revision ID: d6510f6b5024
Revises: 4f022e37636e
Create Date: 2026-09-10 17:09:46.865666
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d6510f6b5024"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "4f022e37636e"

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
        "adaptation_processes",
        sa.Column(
            "probation_completed_successfully",
            sa.Boolean(),
            nullable=True,
        ),
    )

    op.add_column(
        "mentor_payments",
        sa.Column(
            "registration_method",
            sa.String(length=100),
            nullable=True,
        ),
    )


def downgrade() -> None:
    with op.batch_alter_table(
        "mentor_payments"
    ) as batch_op:
        batch_op.drop_column(
            "registration_method"
        )

    with op.batch_alter_table(
        "adaptation_processes"
    ) as batch_op:
        batch_op.drop_column(
            "probation_completed_successfully"
        )