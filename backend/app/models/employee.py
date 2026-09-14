from datetime import date

from sqlalchemy import (
    Date,
    Enum as SQLEnum,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.database import Base
from app.enums.base import enum_values
from app.enums.employee import (
    CandidateType,
    HiringDelayReason,
    HiringRejectionReason,
    SeparationReason,
)


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    manager_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "employees.id",
            ondelete="SET NULL",
        ),
        index=True,
        nullable=True,
    )

    distribution_center_division_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "distribution_center_divisions.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=True,
    )

    position_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "positions.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=True,
    )

    personnel_number: Mapped[str | None] = mapped_column(
        String(16),
        unique=True,
        nullable=True,
    )

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    hire_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    reason_not_hiring: Mapped[
        HiringRejectionReason | None
    ] = mapped_column(
        SQLEnum(
            HiringRejectionReason,
            values_callable=enum_values,
            name="hiring_rejection_reason",
        ),
        nullable=True,
    )

    reason_delayed_hiring: Mapped[
        HiringDelayReason | None
    ] = mapped_column(
        SQLEnum(
            HiringDelayReason,
            values_callable=enum_values,
            name="hiring_delay_reason",
        ),
        nullable=True,
    )

    hiring_comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    candidate_type: Mapped[CandidateType] = mapped_column(
        SQLEnum(
            CandidateType,
            values_callable=enum_values,
            name="candidate_type",
        ),
        nullable=False,
    )

    separation_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    separation_reason: Mapped[
        SeparationReason | None
    ] = mapped_column(
        SQLEnum(
            SeparationReason,
            values_callable=enum_values,
            name="separation_reason",
        ),
        nullable=True,
    )

    manager_separation_feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    manager: Mapped["Employee | None"] = relationship(
        remote_side="Employee.id",
        back_populates="subordinates",
    )

    subordinates: Mapped[list["Employee"]] = relationship(
        back_populates="manager",
        passive_deletes=True,
    )

    distribution_center_division: Mapped[
        "DistributionCenterDivision | None"
    ] = relationship(
        back_populates="employees",
    )

    position: Mapped["Position | None"] = relationship(
        back_populates="employees",
    )

    introductory_processes: Mapped[
        list["IntroductoryProcess"]
    ] = relationship(
        back_populates="employee",
        passive_deletes="all",
    )

    mentored_introductory_internships: Mapped[
        list["IntroductoryInternship"]
    ] = relationship(
        back_populates="mentor",
        passive_deletes="all",
    )

    mentored_main_internships: Mapped[
        list["MainInternship"]
    ] = relationship(
        back_populates="mentor",
        passive_deletes="all",
    )