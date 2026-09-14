from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
)

from app.schemas.organization import (
    DistributionCenterResponse,
)
from app.enums.user import UserType


class UserRoleResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    manager_id: int | None
    email: EmailStr
    full_name: str | None
    user_type: UserType
    is_active: bool
    role: UserRoleResponse
    created_at: datetime


class CurrentUserResponse(BaseModel):
    id: int
    manager_id: int | None
    email: EmailStr
    full_name: str | None
    user_type: UserType
    is_active: bool
    role: UserRoleResponse
    permissions: list[str]
    distribution_centers: list[DistributionCenterResponse]
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(
        min_length=1,
        max_length=255,
    )
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    user_type: UserType
    role_id: int
    manager_id: int | None = None


class UserUpdate(BaseModel):
    role_id: int | None = None
    manager_id: int | None = None
    user_type: UserType | None = None
    full_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_null_values(self):
        required_fields = (
            "role_id",
            "user_type",
            "full_name",
            "is_active",
        )

        for field_name in required_fields:
            if (
                field_name in self.model_fields_set
                and getattr(self, field_name) is None
            ):
                raise ValueError(
                    f"{field_name} cannot be null"
                )

        return self


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int


class UserDistributionCenterCreate(BaseModel):
    distribution_center_id: int


class UserDistributionCenterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    distribution_center_id: int
    distribution_center: DistributionCenterResponse