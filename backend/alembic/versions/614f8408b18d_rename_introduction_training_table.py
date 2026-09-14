"""rename introduction_training table

Revision ID: 614f8408b18d
Revises: 8408454cd4c9
Create Date: 2026-09-02 11:00:15.302090

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '614f8408b18d'
down_revision: Union[str, Sequence[str], None] = '8408454cd4c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table(
        "introductory_training",
        "introductory_process",
    )

    op.drop_index(
        "ix_introductory_training_employee_id",
        table_name="introductory_process",
    )
    op.drop_index(
        "ix_introductory_training_tutor_id",
        table_name="introductory_process",
    )

    op.create_index(
        "ix_introductory_process_employee_id",
        "introductory_process",
        ["employee_id"],
    )
    op.create_index(
        "ix_introductory_process_tutor_id",
        "introductory_process",
        ["tutor_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_introductory_process_employee_id",
        table_name="introductory_process",
    )
    op.drop_index(
        "ix_introductory_process_tutor_id",
        table_name="introductory_process",
    )

    op.rename_table(
        "introductory_process",
        "introductory_training",
    )

    op.create_index(
        "ix_introductory_training_employee_id",
        "introductory_training",
        ["employee_id"],
    )
    op.create_index(
        "ix_introductory_training_tutor_id",
        "introductory_training",
        ["tutor_id"],
    )
