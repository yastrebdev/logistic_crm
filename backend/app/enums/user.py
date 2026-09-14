from enum import Enum


class UserType(str, Enum):
    TM = "Training Manager"
    LTM = "Lead Training Manager"
    HOD = "Head of Department"