"""add internship and mentor payment policies

Revision ID: 4f022e37636e
Revises: 59f0d31cba95
Create Date: 2026-09-10 15:04:26.450334
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4f022e37636e"
down_revision: Union[
    str,
    Sequence[str],
    None,
] = "59f0d31cba95"

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
    op.create_table(
        "internship_policies",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "position_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "effective_from",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "effective_to",
            sa.Date(),
            nullable=True,
        ),
        sa.Column(
            "duration_min_days",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "duration_max_days",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "probation_months",
            sa.Integer(),
            nullable=False,
        ),
        sa.CheckConstraint(
            (
                "duration_max_days "
                ">= duration_min_days"
            ),
            name=(
                "ck_internship_policy_"
                "duration_range"
            ),
        ),
        sa.CheckConstraint(
            "duration_min_days > 0",
            name=(
                "ck_internship_policy_"
                "min_duration"
            ),
        ),
        sa.CheckConstraint(
            (
                "effective_to IS NULL "
                "OR effective_to >= effective_from"
            ),
            name=(
                "ck_internship_policy_"
                "effective_dates"
            ),
        ),
        sa.CheckConstraint(
            "probation_months > 0",
            name=(
                "ck_internship_policy_"
                "probation_months"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["position_id"],
            ["positions.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "position_id",
            "effective_from",
            name=(
                "uq_internship_policy_"
                "position_effective_from"
            ),
        ),
    )

    op.create_index(
        op.f(
            "ix_internship_policies_position_id"
        ),
        "internship_policies",
        ["position_id"],
        unique=False,
    )

    op.create_table(
        "mentor_payment_policies",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "internship_policy_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "amount",
            sa.Numeric(
                precision=10,
                scale=2,
            ),
            nullable=False,
        ),
        sa.CheckConstraint(
            "amount >= 0",
            name=(
                "ck_mentor_payment_policy_amount"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["internship_policy_id"],
            ["internship_policies.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f(
            "ix_mentor_payment_policies_"
            "internship_policy_id"
        ),
        "mentor_payment_policies",
        ["internship_policy_id"],
        unique=True,
    )

    with op.batch_alter_table(
        "main_internships"
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "internship_policy_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.create_index(
            op.f(
                "ix_main_internships_"
                "internship_policy_id"
            ),
            ["internship_policy_id"],
            unique=False,
        )

        batch_op.create_foreign_key(
            (
                "fk_main_internships_"
                "internship_policy_id"
            ),
            "internship_policies",
            ["internship_policy_id"],
            ["id"],
            ondelete="RESTRICT",
        )

    with op.batch_alter_table(
        "mentor_payments"
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "payment_policy_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "planned_amount",
                sa.Numeric(
                    precision=10,
                    scale=2,
                ),
                nullable=True,
            )
        )

        batch_op.create_index(
            op.f(
                "ix_mentor_payments_"
                "payment_policy_id"
            ),
            ["payment_policy_id"],
            unique=False,
        )

        batch_op.create_foreign_key(
            (
                "fk_mentor_payments_"
                "payment_policy_id"
            ),
            "mentor_payment_policies",
            ["payment_policy_id"],
            ["id"],
            ondelete="RESTRICT",
        )


def downgrade() -> None:
    with op.batch_alter_table(
        "mentor_payments"
    ) as batch_op:
        batch_op.drop_constraint(
            (
                "fk_mentor_payments_"
                "payment_policy_id"
            ),
            type_="foreignkey",
        )

        batch_op.drop_index(
            op.f(
                "ix_mentor_payments_"
                "payment_policy_id"
            )
        )

        batch_op.drop_column(
            "planned_amount"
        )

        batch_op.drop_column(
            "payment_policy_id"
        )

    with op.batch_alter_table(
        "main_internships"
    ) as batch_op:
        batch_op.drop_constraint(
            (
                "fk_main_internships_"
                "internship_policy_id"
            ),
            type_="foreignkey",
        )

        batch_op.drop_index(
            op.f(
                "ix_main_internships_"
                "internship_policy_id"
            )
        )

        batch_op.drop_column(
            "internship_policy_id"
        )

    op.drop_index(
        op.f(
            "ix_mentor_payment_policies_"
            "internship_policy_id"
        ),
        table_name=(
            "mentor_payment_policies"
        ),
    )

    op.drop_table(
        "mentor_payment_policies"
    )

    op.drop_index(
        op.f(
            "ix_internship_policies_position_id"
        ),
        table_name="internship_policies",
    )

    op.drop_table(
        "internship_policies"
    )