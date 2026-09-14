from pydantic import BaseModel, ConfigDict

from app.enums.organization import PositionCategory


# Distribution Center


class DistributionCenterBase(BaseModel):
    code: str
    name: str
    city: str


class DistributionCenterResponse(DistributionCenterBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DistributionCenterCreate(DistributionCenterBase):
    pass


class DistributionCenterUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    city: str | None = None


# Division Group


class DivisionGroupBase(BaseModel):
    code: str
    name: str
    abbreviation: str


class DivisionGroupResponse(DivisionGroupBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DivisionGroupCreate(DivisionGroupBase):
    pass


class DivisionGroupUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    abbreviation: str | None = None


# Division


class DivisionBase(BaseModel):
    division_group_id: int
    name: str


class DivisionResponse(DivisionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DivisionCreate(DivisionBase):
    pass


class DivisionUpdate(BaseModel):
    division_group_id: int | None = None
    name: str | None = None


# Position


class PositionBase(BaseModel):
    division_id: int
    name: str
    category: PositionCategory


class PositionResponse(PositionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    division_id: int | None = None
    name: str | None = None
    category: PositionCategory | None = None


# Distribution Center Division


class DistributionCenterDivisionBase(BaseModel):
    division_id: int
    name: str


class DistributionCenterDivisionCreate(
    DistributionCenterDivisionBase
):
    pass


class DistributionCenterDivisionUpdate(BaseModel):
    division_id: int | None = None
    name: str | None = None


class DistributionCenterDivisionResponse(
    DistributionCenterDivisionBase
):
    model_config = ConfigDict(from_attributes=True)

    id: int
    distribution_center_id: int


# Detailed Distribution Center Division


class DivisionWithGroupResponse(DivisionResponse):
    division_group: DivisionGroupResponse


class DistributionCenterDivisionDetailResponse(
    DistributionCenterDivisionResponse
):
    division: DivisionWithGroupResponse


# Complete Distribution Center Structure


class DivisionUnitStructureResponse(BaseModel):
    id: int
    name: str
    division_id: int
    positions: list[PositionResponse]


class DivisionGroupStructureResponse(
    DivisionGroupResponse
):
    divisions: list[DivisionUnitStructureResponse]


class DistributionCenterStructureResponse(
    DistributionCenterResponse
):
    groups: list[DivisionGroupStructureResponse]