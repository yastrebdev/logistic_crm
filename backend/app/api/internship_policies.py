from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import (
    require_permission,
)
from app.db.database import get_db
from app.models import User
from app.schemas.internship_policy import (
    InternshipPolicyCreate,
    InternshipPolicyResponse,
    InternshipPolicyUpdate,
)
from app.services import (
    internship_policy_service,
)


router = APIRouter(
    prefix="/internship-policies",
    tags=["Internship policies"],
)


@router.get(
    "",
    response_model=list[
        InternshipPolicyResponse
    ],
)
def get_internship_policies(
    position_id: int | None = Query(
        default=None,
        gt=0,
    ),
    _current_user: User = Depends(
        require_permission(
            "onboarding.read"
        )
    ),
    db: Session = Depends(get_db),
):
    return list(
        internship_policy_service
        .get_internship_policies(
            db=db,
            position_id=position_id,
        )
    )


@router.get(
    "/{policy_id}",
    response_model=InternshipPolicyResponse,
)
def get_internship_policy(
    policy_id: int,
    _current_user: User = Depends(
        require_permission(
            "onboarding.read"
        )
    ),
    db: Session = Depends(get_db),
):
    return (
        internship_policy_service
        .get_internship_policy(
            db=db,
            policy_id=policy_id,
        )
    )


@router.post(
    "",
    response_model=InternshipPolicyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_internship_policy(
    data: InternshipPolicyCreate,
    _current_user: User = Depends(
        require_permission(
            "onboarding.create"
        )
    ),
    db: Session = Depends(get_db),
):
    return (
        internship_policy_service
        .create_internship_policy(
            db=db,
            data=data,
        )
    )


@router.patch(
    "/{policy_id}",
    response_model=InternshipPolicyResponse,
)
def update_internship_policy(
    policy_id: int,
    data: InternshipPolicyUpdate,
    _current_user: User = Depends(
        require_permission(
            "onboarding.update"
        )
    ),
    db: Session = Depends(get_db),
):
    return (
        internship_policy_service
        .update_internship_policy(
            db=db,
            policy_id=policy_id,
            data=data,
        )
    )


@router.delete(
    "/{policy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_internship_policy(
    policy_id: int,
    _current_user: User = Depends(
        require_permission(
            "onboarding.delete"
        )
    ),
    db: Session = Depends(get_db),
) -> None:
    internship_policy_service.delete_internship_policy(
        db=db,
        policy_id=policy_id,
    )