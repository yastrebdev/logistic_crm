from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import require_permission
from app.db.database import get_db
from app.enums.organization import PositionCategory
from app.models import User
from app.schemas.adaptation import (
    AdaptationPolicyCreate,
    AdaptationPolicyResponse,
    AdaptationPolicyUpdate,
)
from app.services import adaptation_policy_service


router = APIRouter(
    prefix="/adaptation-policies",
    tags=["Adaptation policies"],
)


@router.get(
    "",
    response_model=list[AdaptationPolicyResponse],
)
def get_adaptation_policies(
    position_category: PositionCategory | None = Query(
        default=None,
    ),
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return list(
        adaptation_policy_service
        .get_adaptation_policies(
            db=db,
            position_category=position_category,
        )
    )


@router.get(
    "/{policy_id}",
    response_model=AdaptationPolicyResponse,
)
def get_adaptation_policy(
    policy_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return (
        adaptation_policy_service
        .get_adaptation_policy(
            db=db,
            policy_id=policy_id,
        )
    )


@router.post(
    "",
    response_model=AdaptationPolicyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_adaptation_policy(
    data: AdaptationPolicyCreate,
    _current_user: User = Depends(
        require_permission("onboarding.create")
    ),
    db: Session = Depends(get_db),
):
    return (
        adaptation_policy_service
        .create_adaptation_policy(
            db=db,
            data=data,
        )
    )


@router.patch(
    "/{policy_id}",
    response_model=AdaptationPolicyResponse,
)
def update_adaptation_policy(
    policy_id: int,
    data: AdaptationPolicyUpdate,
    _current_user: User = Depends(
        require_permission("onboarding.update")
    ),
    db: Session = Depends(get_db),
):
    return (
        adaptation_policy_service
        .update_adaptation_policy(
            db=db,
            policy_id=policy_id,
            data=data,
        )
    )


@router.delete(
    "/{policy_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_adaptation_policy(
    policy_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.delete")
    ),
    db: Session = Depends(get_db),
) -> None:
    adaptation_policy_service.delete_adaptation_policy(
        db=db,
        policy_id=policy_id,
    )