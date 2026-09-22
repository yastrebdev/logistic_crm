from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.database import Base
from app.enums.adaptation import (
    AdaptationDelayReason,
    AdaptationParticipants,
    AdaptationProcessStatus,
    AdaptationRiskReason,
    MethodExecutionAdaptation,
    AdaptationRiskZone,
)
from app.enums.base import enum_values
from app.enums.organization import PositionCategory


class AdaptationPolicy(Base):
    __tablename__ = "adaptation_policies"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    effective_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    effective_to: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    position_category: Mapped[
        PositionCategory
    ] = mapped_column(
        SQLEnum(
            PositionCategory,
            values_callable=enum_values,
            name="position_category",
        ),
        index=True,
        nullable=False,
    )

    stage_1_start_offset_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    stage_1_duration_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    stage_2_red_offset_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    stage_2_normal_offset_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    stage_2_duration_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    stage_3_red_offset_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    stage_3_normal_offset_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    stage_3_duration_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    total_deadline_days: Mapped[int] = mapped_column(
        Integer,
        default=90,
        nullable=False,
    )

    adaptation_processes: Mapped[
        list["AdaptationProcess"]
    ] = relationship(
        back_populates="policy",
        passive_deletes="all",
    )

    __table_args__ = (
        UniqueConstraint(
            "position_category",
            "effective_from",
            name=(
                "uq_adaptation_policy_category_"
                "effective_from"
            ),
        ),
        CheckConstraint(
            (
                "effective_to IS NULL "
                "OR effective_to >= effective_from"
            ),
            name="ck_adaptation_policy_dates",
        ),
        CheckConstraint(
            (
                "stage_1_start_offset_days >= 0 "
                "AND stage_1_duration_days > 0 "
                "AND stage_2_red_offset_days >= 0 "
                "AND stage_2_normal_offset_days >= 0 "
                "AND stage_2_duration_days > 0 "
                "AND stage_3_red_offset_days >= 0 "
                "AND stage_3_normal_offset_days >= 0 "
                "AND stage_3_duration_days > 0 "
                "AND total_deadline_days > 0"
            ),
            name="ck_adaptation_policy_positive_days",
        ),
    )


class AdaptationProcess(Base):
    __tablename__ = "adaptation_processes"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    introductory_process_id: Mapped[int] = mapped_column(
        ForeignKey(
            "introductory_process.id",
            ondelete="RESTRICT",
        ),
        unique=True,
        index=True,
        nullable=False,
    )

    policy_id: Mapped[int] = mapped_column(
        ForeignKey(
            "adaptation_policies.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=False,
    )

    deadline_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    status: Mapped[
        AdaptationProcessStatus
    ] = mapped_column(
        SQLEnum(
            AdaptationProcessStatus,
            values_callable=enum_values,
            name="adaptation_process_status",
        ),
        default=AdaptationProcessStatus.ACTIVE,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    probation_completed_successfully: Mapped[
        bool | None
        ] = mapped_column(
        Boolean,
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    introductory_process: Mapped[
        "IntroductoryProcess"
    ] = relationship(
        back_populates="adaptation_process",
    )

    policy: Mapped["AdaptationPolicy"] = relationship(
        back_populates="adaptation_processes",
    )

    stages: Mapped[
        list["AdaptationStage"]
    ] = relationship(
        back_populates="adaptation_process",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class AdaptationStage(Base):
    __tablename__ = "adaptation_stages"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    adaptation_process_id: Mapped[int] = mapped_column(
        ForeignKey(
            "adaptation_processes.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    stage_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    planned_start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    planned_end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    actual_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    method: Mapped[
        MethodExecutionAdaptation | None
    ] = mapped_column(
        SQLEnum(
            MethodExecutionAdaptation,
            values_callable=enum_values,
            name="method_execution_adaptation",
        ),
        nullable=True,
    )

    participants: Mapped[
        AdaptationParticipants | None
    ] = mapped_column(
        SQLEnum(
            AdaptationParticipants,
            values_callable=enum_values,
            name="adaptation_participants",
        ),
        nullable=True,
    )

    delay_reason: Mapped[
        AdaptationDelayReason | None
    ] = mapped_column(
        SQLEnum(
            AdaptationDelayReason,
            values_callable=enum_values,
            name="adaptation_delay_reason",
        ),
        nullable=True,
    )

    risk_zone: Mapped[
        AdaptationRiskZone | None
        ] = mapped_column(
        SQLEnum(
            AdaptationRiskZone,
            values_callable=enum_values,
            name="adaptation_risk_zone",
        ),
        nullable=True,
    )

    risk_reason: Mapped[
        AdaptationRiskReason | None
    ] = mapped_column(
        SQLEnum(
            AdaptationRiskReason,
            values_callable=enum_values,
            name="adaptation_risk_reason",
        ),
        nullable=True,
    )

    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    adaptation_process: Mapped[
        "AdaptationProcess"
    ] = relationship(
        back_populates="stages",
    )

    __table_args__ = (
        CheckConstraint(
            "stage_number >= 1 AND stage_number <= 3",
            name="ck_adaptation_stage_number",
        ),
        CheckConstraint(
            "planned_end_date >= planned_start_date",
            name="ck_adaptation_stage_planned_dates",
        ),
        UniqueConstraint(
            "adaptation_process_id",
            "stage_number",
            name="uq_adaptation_process_stage",
        ),
    )