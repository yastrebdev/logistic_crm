from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import require_permission
from app.db.database import get_db

from app.models import User
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeResponse, EmployeeUpdate,
)
from app.services import employee_service

router = APIRouter(
    prefix="/employees",
    tags=["Employee"],
)


@router.get(
    "",
    response_model=list[EmployeeResponse],
    status_code=status.HTTP_200_OK,
)
def get_employees(
    _current_user: User = Depends(
        require_permission("employees.read")
    ),
    db: Session = Depends(get_db),
):
    employees = employee_service.get_employees(db)

    return employees


@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
    status_code=status.HTTP_200_OK,
)
def get_employee(
    employee_id: int,
    _current_user: User = Depends(
        require_permission("employees.read")
    ),
    db: Session = Depends(get_db),
):
    employee = employee_service.get_employee(
        employee_id=employee_id,
        db=db,
    )

    return employee


@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    data: EmployeeCreate,
    _current_user: User = Depends(
        require_permission("employees.create")
    ),
    db: Session = Depends(get_db),
):
    employee = employee_service.create_employee(
        data=data,
        db=db,
    )

    return employee


@router.patch(
    "/{employee_id}",
    response_model=EmployeeResponse,
    status_code=status.HTTP_200_OK,
)
def update_employee(
    employee_id,
    data: EmployeeUpdate,
    _current_user: User = Depends(
        require_permission("employees.update")
    ),
    db: Session = Depends(get_db),
):
    employee = employee_service.update_employee(
        employee_id=employee_id,
        data=data,
        db=db,
    )

    return employee