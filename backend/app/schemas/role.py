from pydantic import BaseModel, ConfigDict


class PermissionResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class RoleResponse(BaseModel):
    id: int
    name: str
    permissions: list[PermissionResponse]

    model_config = ConfigDict(from_attributes=True)


class RoleUpdate(BaseModel):
    permission_ids: set[int]
