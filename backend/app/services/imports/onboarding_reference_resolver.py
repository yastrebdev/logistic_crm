from collections import defaultdict
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    DistributionCenter,
    DistributionCenterDivision,
    Division,
    DivisionGroup,
    Position,
    User,
)


def _key(value: Any) -> str:
    if value is None:
        return ""

    return " ".join(
        str(value)
        .replace("\xa0", " ")
        .replace("ё", "е")
        .casefold()
        .split()
    )


def _center_key(value: Any) -> str:
    value_key = _key(value)

    if value_key.startswith("рц "):
        return value_key[3:].strip()

    return value_key


class OnboardingReferenceResolver:
    def __init__(
        self,
        db: Session,
    ) -> None:
        centers = db.scalars(
            select(DistributionCenter)
        ).all()

        units = db.scalars(
            select(DistributionCenterDivision)
        ).all()

        divisions = db.scalars(
            select(Division)
        ).all()

        groups = db.scalars(
            select(DivisionGroup)
        ).all()

        positions = db.scalars(
            select(Position)
        ).all()

        users = db.scalars(
            select(User)
        ).all()

        self.centers_by_key: dict[
            str,
            list[DistributionCenter],
        ] = defaultdict(list)

        for center in centers:
            center_key = _center_key(center.name)

            if center_key:
                self.centers_by_key[
                    center_key
                ].append(center)

        self.units_by_center_and_name: dict[
            tuple[int, str],
            list[DistributionCenterDivision],
        ] = defaultdict(list)

        for unit in units:
            self.units_by_center_and_name[
                (
                    unit.distribution_center_id,
                    _key(unit.name),
                )
            ].append(unit)

        self.divisions_by_id = {
            division.id: division
            for division in divisions
        }

        self.groups_by_id = {
            group.id: group
            for group in groups
        }

        self.positions_by_division_and_name: dict[
            tuple[int, str],
            list[Position],
        ] = defaultdict(list)

        for position in positions:
            self.positions_by_division_and_name[
                (
                    position.division_id,
                    _key(position.name),
                )
            ].append(position)

        self.users_by_name: dict[
            str,
            list[User],
        ] = defaultdict(list)

        for user in users:
            if user.full_name:
                self.users_by_name[
                    _key(user.full_name)
                ].append(user)

    def resolve(
        self,
        normalized_data: dict[str, Any],
        source_warnings: list[str],
        source_errors: list[str],
    ) -> tuple[
        dict[str, Any],
        list[str],
        list[str],
    ]:
        data = dict(normalized_data)
        warnings = list(source_warnings)
        errors = list(source_errors)

        center = self._resolve_center(
            value=data.get(
                "distribution_center"
            ),
            errors=errors,
        )

        if center is not None:
            data[
                "distribution_center_id"
            ] = center.id

        unit = self._resolve_unit(
            center=center,
            value=data.get(
                "distribution_center_division"
            ),
            errors=errors,
        )

        if unit is not None:
            data[
                "distribution_center_division_id"
            ] = unit.id

            data["division_id"] = (
                unit.division_id
            )

            division = (
                self.divisions_by_id.get(
                    unit.division_id
                )
            )

            if division is not None:
                data[
                    "division_group_id"
                ] = (
                    division
                    .division_group_id
                )

                self._validate_group(
                    division=division,
                    excel_group=data.get(
                        "division_group"
                    ),
                    warnings=warnings,
                )

        position = self._resolve_position(
            unit=unit,
            value=data.get(
                "position_name"
            ),
            errors=errors,
        )

        if position is not None:
            data["position_id"] = (
                position.id
            )

        tutor = self._resolve_user(
            value=data.get(
                "tutor_name"
            ),
            field_label="Куратор МПО",
            errors=errors,
        )

        if tutor is not None:
            data["tutor_id"] = tutor.id

        return data, warnings, errors

    def _resolve_center(
        self,
        value: Any,
        errors: list[str],
    ) -> DistributionCenter | None:
        if not value:
            return None

        matches = self.centers_by_key.get(
            _center_key(value),
            [],
        )

        if not matches:
            errors.append(
                f'РЦ «{value}» не найден'
            )
            return None

        if len(matches) > 1:
            errors.append(
                f'РЦ «{value}» найден неоднозначно'
            )
            return None

        return matches[0]

    def _resolve_unit(
        self,
        center: DistributionCenter | None,
        value: Any,
        errors: list[str],
    ) -> DistributionCenterDivision | None:
        if center is None or not value:
            return None

        matches = (
            self.units_by_center_and_name.get(
                (
                    center.id,
                    _key(value),
                ),
                [],
            )
        )

        if not matches:
            errors.append(
                f'Подразделение «{value}» '
                f'не найдено в РЦ «{center.name}»'
            )
            return None

        if len(matches) > 1:
            errors.append(
                f'Подразделение «{value}» '
                "найдено неоднозначно"
            )
            return None

        return matches[0]

    def _resolve_position(
        self,
        unit: DistributionCenterDivision | None,
        value: Any,
        errors: list[str],
    ) -> Position | None:
        if unit is None or not value:
            return None

        matches = (
            self
            .positions_by_division_and_name
            .get(
                (
                    unit.division_id,
                    _key(value),
                ),
                [],
            )
        )

        if not matches:
            errors.append(
                f'Должность «{value}» не найдена '
                "в выбранном подразделении"
            )
            return None

        if len(matches) > 1:
            errors.append(
                f'Должность «{value}» '
                "найдена неоднозначно"
            )
            return None

        return matches[0]

    def _resolve_user(
        self,
        value: Any,
        field_label: str,
        errors: list[str],
    ) -> User | None:
        if not value:
            return None

        matches = self.users_by_name.get(
            _key(value),
            [],
        )

        if not matches:
            errors.append(
                f'{field_label} «{value}» '
                "не найден среди пользователей"
            )
            return None

        if len(matches) > 1:
            errors.append(
                f'{field_label} «{value}» '
                "найден неоднозначно"
            )
            return None

        return matches[0]

    def _validate_group(
        self,
        division: Division,
        excel_group: Any,
        warnings: list[str],
    ) -> None:
        if not excel_group:
            return

        group = self.groups_by_id.get(
            division.division_group_id
        )

        if group is None:
            return

        allowed_values = {
            _key(group.name),
            _key(group.code),
            _key(group.abbreviation),
        }

        if _key(excel_group) not in allowed_values:
            warnings.append(
                f'Группа «{excel_group}» отличается '
                f'от группы подразделения '
                f'«{group.abbreviation}»'
            )