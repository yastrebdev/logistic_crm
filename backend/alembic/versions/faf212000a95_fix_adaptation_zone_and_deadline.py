"""fix adaptation zone and deadline

Revision ID: faf212000a95
Revises: f0c534af3755
Create Date: 2026-09-17 11:36:12.501656

"""

from datetime import timedelta
from typing import (
    Sequence,
    Union,
)

from alembic import op
import sqlalchemy as sa


revision: str = "faf212000a95"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "f0c534af3755"

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


adaptation_policies = sa.table(
    "adaptation_policies",
    sa.column("id", sa.Integer),
    sa.column(
        "total_deadline_days",
        sa.Integer,
    ),
)


adaptation_processes = sa.table(
    "adaptation_processes",
    sa.column("id", sa.Integer),
    sa.column("policy_id", sa.Integer),
    sa.column("deadline_date", sa.Date),
)


adaptation_stages = sa.table(
    "adaptation_stages",
    sa.column("id", sa.Integer),
    sa.column(
        "adaptation_process_id",
        sa.Integer,
    ),
    sa.column("stage_number", sa.Integer),
    sa.column(
        "planned_end_date",
        sa.Date,
    ),
)


def upgrade() -> None:
    connection = op.get_bind()

    policy_ids = list(
        connection.scalars(
            sa.select(
                adaptation_policies.c.id
            ).where(
                adaptation_policies
                .c.total_deadline_days
                == 90
            )
        )
    )

    if not policy_ids:
        return

    processes = connection.execute(
        sa.select(
            adaptation_processes.c.id,
            adaptation_processes
            .c.deadline_date,
        ).where(
            adaptation_processes
            .c.policy_id
            .in_(policy_ids)
        )
    ).mappings().all()

    for process in processes:
        process_id = process["id"]

        old_deadline = (
            process["deadline_date"]
        )

        new_deadline = (
            old_deadline
            + timedelta(days=1)
        )

        connection.execute(
            sa.update(
                adaptation_stages
            )
            .where(
                adaptation_stages
                .c.adaptation_process_id
                == process_id,
                adaptation_stages
                .c.stage_number
                == 3,
                adaptation_stages
                .c.planned_end_date
                == old_deadline,
            )
            .values(
                planned_end_date=(
                    new_deadline
                )
            )
        )

        connection.execute(
            sa.update(
                adaptation_processes
            )
            .where(
                adaptation_processes.c.id
                == process_id
            )
            .values(
                deadline_date=new_deadline
            )
        )

    connection.execute(
        sa.update(
            adaptation_policies
        )
        .where(
            adaptation_policies.c.id
            .in_(policy_ids)
        )
        .values(
            total_deadline_days=91
        )
    )


def downgrade() -> None:
    connection = op.get_bind()

    policy_ids = list(
        connection.scalars(
            sa.select(
                adaptation_policies.c.id
            ).where(
                adaptation_policies
                .c.total_deadline_days
                == 91
            )
        )
    )

    if not policy_ids:
        return

    processes = connection.execute(
        sa.select(
            adaptation_processes.c.id,
            adaptation_processes
            .c.deadline_date,
        ).where(
            adaptation_processes
            .c.policy_id
            .in_(policy_ids)
        )
    ).mappings().all()

    for process in processes:
        process_id = process["id"]

        old_deadline = (
            process["deadline_date"]
        )

        new_deadline = (
            old_deadline
            - timedelta(days=1)
        )

        connection.execute(
            sa.update(
                adaptation_stages
            )
            .where(
                adaptation_stages
                .c.adaptation_process_id
                == process_id,
                adaptation_stages
                .c.stage_number
                == 3,
                adaptation_stages
                .c.planned_end_date
                == old_deadline,
            )
            .values(
                planned_end_date=(
                    new_deadline
                )
            )
        )

        connection.execute(
            sa.update(
                adaptation_processes
            )
            .where(
                adaptation_processes.c.id
                == process_id
            )
            .values(
                deadline_date=new_deadline
            )
        )

    connection.execute(
        sa.update(
            adaptation_policies
        )
        .where(
            adaptation_policies.c.id
            .in_(policy_ids)
        )
        .values(
            total_deadline_days=90
        )
    )