from sqlalchemy import (
    CheckConstraint,
    Enum as SQLEnum,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.database import Base
from app.enums.base import enum_values
from app.enums.organization import PositionCategory


class DistributionCenter(Base):
    __tablename__ = "distribution_centers"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    code: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        unique=True,
    )

    name: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    city: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )


    division_units: Mapped[
        list["DistributionCenterDivision"]
    ] = relationship(
        back_populates="distribution_center",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    user_links: Mapped[
        list["UserDistributionCenter"]
    ] = relationship(
        back_populates="distribution_center",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint(
            "length(code) = 3",
            name="ck_distribution_centers_code_length",
        ),
    )


class DivisionGroup(Base):
    __tablename__ = "division_groups"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    abbreviation: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    divisions: Mapped[list["Division"]] = relationship(
        back_populates="division_group",
        passive_deletes="all",
    )

    __table_args__ = (
        UniqueConstraint(
            "code",
            name="uq_division_groups_code",
        ),
    )


class Division(Base):
    __tablename__ = "divisions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    division_group_id: Mapped[int] = mapped_column(
        ForeignKey(
            "division_groups.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )

    division_group: Mapped["DivisionGroup"] = relationship(
        back_populates="divisions",
    )

    positions: Mapped[list["Position"]] = relationship(
        back_populates="division",
        passive_deletes="all",
    )

    distribution_center_units: Mapped[
        list["DistributionCenterDivision"]
    ] = relationship(
        back_populates="division",
        passive_deletes="all",
    )

    __table_args__ = (
        UniqueConstraint(
            "division_group_id",
            "name",
            name="uq_division_group_name",
        ),
    )


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    division_id: Mapped[int] = mapped_column(
        ForeignKey(
            "divisions.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )

    category: Mapped[PositionCategory] = mapped_column(
        SQLEnum(
            PositionCategory,
            values_callable=enum_values,
            name="position_category",
        ),
        nullable=False,
    )

    division: Mapped["Division"] = relationship(
        back_populates="positions",
    )

    employees: Mapped[list["Employee"]] = relationship(
        back_populates="position",
        passive_deletes="all",
    )

    internship_policies: Mapped[
        list["InternshipPolicy"]
    ] = relationship(
        back_populates="position",
        passive_deletes="all",
    )

    __table_args__ = (
        UniqueConstraint(
            "division_id",
            "name",
            name="uq_position_division_name",
        ),
    )


class DistributionCenterDivision(Base):
    __tablename__ = "distribution_center_divisions"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    distribution_center_id: Mapped[int] = mapped_column(
        ForeignKey(
            "distribution_centers.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    division_id: Mapped[int] = mapped_column(
        ForeignKey(
            "divisions.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )


    employees: Mapped[list["Employee"]] = relationship(
        back_populates="distribution_center_division",
        passive_deletes="all",
    )

    distribution_center: Mapped["DistributionCenter"] = relationship(
        back_populates="division_units",
    )

    division: Mapped["Division"] = relationship(
        back_populates="distribution_center_units",
    )

    __table_args__ = (
        UniqueConstraint(
            "distribution_center_id",
            "name",
            name="uq_distribution_center_division_name",
        ),
    )