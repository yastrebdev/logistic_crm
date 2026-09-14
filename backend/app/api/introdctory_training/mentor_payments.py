from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import require_permission
from app.db.database import get_db
from app.models import User
from app.schemas.mentor_payment import (
    MentorPaymentCreate,
    MentorPaymentResponse,
    MentorPaymentUpdate,
)
from app.services import mentor_payment_service


router = APIRouter(
    prefix="/mentor-payments",
    tags=["Mentor payments"],
)


@router.get(
    "",
    response_model=list[MentorPaymentResponse],
)
def get_mentor_payments(
    main_internship_id: int | None = Query(
        default=None,
        gt=0,
    ),
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return list(
        mentor_payment_service.get_mentor_payments(
            db=db,
            main_internship_id=main_internship_id,
        )
    )


@router.get(
    "/{payment_id}",
    response_model=MentorPaymentResponse,
)
def get_mentor_payment(
    payment_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return mentor_payment_service.get_mentor_payment(
        db=db,
        payment_id=payment_id,
    )


@router.post(
    "",
    response_model=MentorPaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_mentor_payment(
    data: MentorPaymentCreate,
    _current_user: User = Depends(
        require_permission("onboarding.create")
    ),
    db: Session = Depends(get_db),
):
    return mentor_payment_service.create_mentor_payment(
        db=db,
        data=data,
    )


@router.patch(
    "/{payment_id}",
    response_model=MentorPaymentResponse,
)
def update_mentor_payment(
    payment_id: int,
    data: MentorPaymentUpdate,
    _current_user: User = Depends(
        require_permission("onboarding.update")
    ),
    db: Session = Depends(get_db),
):
    return mentor_payment_service.update_mentor_payment(
        db=db,
        payment_id=payment_id,
        data=data,
    )