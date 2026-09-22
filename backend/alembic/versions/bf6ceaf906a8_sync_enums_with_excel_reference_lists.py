"""sync enums with excel reference lists

Revision ID: bf6ceaf906a8
Revises: 3e5e8e485f62
Create Date: 2026-09-17 15:15:20.872657

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "bf6ceaf906a8"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "3e5e8e485f62"

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


def _replace_value(
    table_name: str,
    column_name: str,
    old_value: str,
    new_value: str,
) -> None:
    connection = op.get_bind()

    connection.execute(
        sa.text(
            f"""
            UPDATE {table_name}
            SET {column_name} = :new_value
            WHERE {column_name} = :old_value
            """
        ),
        {
            "old_value": old_value,
            "new_value": new_value,
        },
    )


def upgrade() -> None:
    # Статус должности.
    _replace_value(
        "positions",
        "category",
        "head",
        "manager",
    )

    # Причина задержанного ТУ.
    _replace_value(
        "employees",
        "reason_delayed_hiring",
        "documents_pending",
        "document_issues",
    )

    # Формат проведения адаптации.
    method_mappings = {
        "in person": "in_person",
        "on portal": "portal",
        "a phone call": "call",
        "yandex form": "yandex_form",
    }

    for old_value, new_value in (
        method_mappings.items()
    ):
        _replace_value(
            "adaptation_stages",
            "method",
            old_value,
            new_value,
        )

    # Участники адаптации.
    participant_mappings = {
        "MPO": "mpo",
        "MPO and MPP": "mpo_and_mpp",
        "MPO and supervisor":
            "mpo_and_manager",
        "MPO, MPP and supervisor":
            "mpo_mpp_and_manager",
    }

    for old_value, new_value in (
        participant_mappings.items()
    ):
        _replace_value(
            "adaptation_stages",
            "participants",
            old_value,
            new_value,
        )

    # Красная зона остаётся ручным риском.
    _replace_value(
        "adaptation_stages",
        "risk_zone",
        "Red",
        "red",
    )

    # Green и Yellow раньше ошибочно хранились
    # в risk_zone. Теперь обычная зона вычисляется.
    connection = op.get_bind()

    connection.execute(
        sa.text(
            """
            UPDATE adaptation_stages
            SET risk_zone = NULL
            WHERE risk_zone IN (
                'Green',
                'Yellow'
            )
            """
        )
    )

    # Способ заведения оплаты.
    payment_method_mappings = {
        "Наставничество": "mentoring",
        "Прочая премия": "other_bonus",
    }

    for old_value, new_value in (
        payment_method_mappings.items()
    ):
        _replace_value(
            "mentor_payments",
            "registration_method",
            old_value,
            new_value,
        )


def downgrade() -> None:
    # Нового отдельного линейного руководителя
    # в старом enum не было.
    _replace_value(
        "positions",
        "category",
        "line_manager",
        "manager",
    )

    _replace_value(
        "employees",
        "reason_delayed_hiring",
        "document_issues",
        "documents_pending",
    )

    method_mappings = {
        "in_person": "in person",
        "portal": "on portal",
        "call": "a phone call",
        "yandex_form": "yandex form",
    }

    for old_value, new_value in (
        method_mappings.items()
    ):
        _replace_value(
            "adaptation_stages",
            "method",
            old_value,
            new_value,
        )

    participant_mappings = {
        "mpo": "MPO",
        "mpo_and_mpp": "MPO and MPP",
        "mpo_and_manager":
            "MPO and supervisor",
        "mpo_mpp_and_manager":
            "MPO, MPP and supervisor",
        "remote": "MPO",
    }

    for old_value, new_value in (
        participant_mappings.items()
    ):
        _replace_value(
            "adaptation_stages",
            "participants",
            old_value,
            new_value,
        )

    _replace_value(
        "adaptation_stages",
        "risk_zone",
        "red",
        "Red",
    )

    payment_method_mappings = {
        "mentoring": "Наставничество",
        "other_bonus": "Прочая премия",
    }

    for old_value, new_value in (
        payment_method_mappings.items()
    ):
        _replace_value(
            "mentor_payments",
            "registration_method",
            old_value,
            new_value,
        )