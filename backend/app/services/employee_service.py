from typing import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions.base import NotFoundError, BusinessRuleError, ConflictError
from app.models import Employee, DistributionCenterDivision, Position
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


def get_employees(
    db: Session,
) -> Sequence[Employee]:
    employees = db.scalars(
        select(Employee)
        .order_by(Employee.full_name)
    ).all()

    return employees


def get_employee(
    employee_id: int,
    db: Session,
) -> Employee:
    employee = db.get(
        Employee, employee_id
    )

    if employee is None:
        raise NotFoundError("An employee with such an ID was not found")

    return employee


def create_employee(
    data: EmployeeCreate,
    db: Session,
) -> Employee:
    center_division = None
    position = None

    if data.distribution_center_division_id is not None:
        center_division = db.get(
            DistributionCenterDivision,
            data.distribution_center_division_id,
        )

        if center_division is None:
            raise NotFoundError(
                "Distribution center division not found"
            )

    if data.position_id is not None:
        position = db.get(
            Position,
            data.position_id,
        )

        if position is None:
            raise NotFoundError(
                "Position not found"
            )

        if center_division is None:
            raise BusinessRuleError(
                "A distribution center division must be "
                "selected before choosing a position"
            )

    if (
            center_division is not None
            and position is not None
            and position.division_id
            != center_division.division_id
    ):
        raise BusinessRuleError(
            "Position does not belong to the selected division"
        )

    employee = Employee(
        **data.model_dump()
    )

    db.add(employee)
    db.commit()
    db.refresh(employee)

    return employee


def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session,
) -> Employee:
    employee = db.get(Employee, employee_id)

    if employee is None:
        raise NotFoundError(
            "Employee not found"
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    if not update_data:
        return employee

    # Проверка табельного номера
    if "personnel_number" in update_data:
        personnel_number = update_data["personnel_number"]

        if personnel_number is not None:
            existing_employee = db.scalar(
                select(Employee).where(
                    Employee.personnel_number
                    == personnel_number,
                    Employee.id != employee_id,
                )
            )

            if existing_employee is not None:
                raise ConflictError(
                    "Employee with this personnel number "
                    "already exists"
                )

    # Проверка руководителя
    if "manager_id" in update_data:
        manager_id = update_data["manager_id"]

        if manager_id == employee_id:
            raise BusinessRuleError(
                "Employee cannot be their own manager"
            )

        if manager_id is not None:
            manager = db.get(Employee, manager_id)

            if manager is None:
                raise NotFoundError(
                    "Manager not found"
                )

            # Проверяем, что новая связь не создаст цикл:
            # сотрудник → руководитель → ... → этот же сотрудник
            current_manager = manager
            visited_ids: set[int] = set()

            while current_manager is not None:
                if current_manager.id == employee_id:
                    raise BusinessRuleError(
                        "Employee hierarchy cannot contain cycles"
                    )

                if current_manager.id in visited_ids:
                    raise BusinessRuleError(
                        "Employee hierarchy already contains a cycle"
                    )

                visited_ids.add(current_manager.id)

                if current_manager.manager_id is None:
                    break

                current_manager = db.get(
                    Employee,
                    current_manager.manager_id,
                )

    # Получаем итоговые значения с учётом частичного PATCH
    target_center_division_id = update_data.get(
        "distribution_center_division_id",
        employee.distribution_center_division_id,
    )

    target_position_id = update_data.get(
        "position_id",
        employee.position_id,
    )

    center_division = None
    position = None

    # Проверка подразделения конкретного РЦ
    if target_center_division_id is not None:
        center_division = db.get(
            DistributionCenterDivision,
            target_center_division_id,
        )

        if center_division is None:
            raise NotFoundError(
                "Distribution center division not found"
            )

    # Проверка должности
    if target_position_id is not None:
        position = db.get(
            Position,
            target_position_id,
        )

        if position is None:
            raise NotFoundError(
                "Position not found"
            )

    # Должность должна относиться к выбранному подразделению
    if center_division is not None and position is not None:
        if position.division_id != center_division.division_id:
            raise BusinessRuleError(
                "Position must belong to the selected division"
            )

    for field, value in update_data.items():
        setattr(employee, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Employee data conflicts with an existing record"
        ) from None

    db.refresh(employee)

    return employee