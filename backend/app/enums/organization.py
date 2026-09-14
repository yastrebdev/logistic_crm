from enum import Enum


class PositionCategory(str, Enum):
    LINE_STAFF = "line_staff"
    SPECIALIST = "specialist"
    MANAGER = "manager"
    HEAD = "head"