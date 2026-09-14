from datetime import date

from sqlalchemy import Date, ForeignKey, Float, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Enum as SQLEnum

from app.db.database import Base
from app.enums.base import enum_values
from app.enums.introductory_training import AdmissionFormat, MentorAssignmentStatus


class IntroductoryProcess(Base):
    __tablename__ = "introductory_process"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    employee_id: Mapped[int] = mapped_column(
        ForeignKey(
            "employees.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=False,
    )

    tutor_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=False,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    introductory_internships: Mapped[
        list["IntroductoryInternship"]
    ] = relationship(
        back_populates="introductory_process",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    trainings: Mapped[list["Training"]] = relationship(
        back_populates="introductory_process",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    main_internships: Mapped[
        list["MainInternship"]
    ] = relationship(
        back_populates="introductory_process",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    adaptation_process: Mapped[
        "AdaptationProcess | None"
    ] = relationship(
        back_populates="introductory_process",
        passive_deletes="all",
        uselist=False,
    )

    employee: Mapped["Employee"] = relationship(
        back_populates="introductory_processes",
    )

    tutor: Mapped["User"] = relationship(
        back_populates="introductory_processes",
    )

    __table_args__ = (
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_introductory_process_dates",
        ),
    )


class IntroductoryInternship(Base):
    __tablename__ = "introductory_internships"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    introductory_process_id: Mapped[int] = mapped_column(
        ForeignKey(
            "introductory_process.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    mentor_id: Mapped[int] = mapped_column(
        ForeignKey(
            "employees.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=False,
    )

    internship_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    mentor: Mapped["Employee"] = relationship(
        back_populates="mentored_introductory_internships",
    )

    introductory_process: Mapped[
        "IntroductoryProcess"
    ] = relationship(
        back_populates="introductory_internships",
    )


class Training(Base):
    __tablename__ = "trainings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    introductory_process_id: Mapped[int] = mapped_column(
        ForeignKey(
            "introductory_process.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    training_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    admission_format: Mapped[AdmissionFormat] = mapped_column(
        SQLEnum(
            AdmissionFormat,
            values_callable=enum_values,
            name="admission_format",
        ),
        nullable=False,
    )

    test_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    test_result: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    introductory_process: Mapped[
        "IntroductoryProcess"
    ] = relationship(
        back_populates="trainings",
    )

    __table_args__ = (
        CheckConstraint(
            "test_result IS NULL "
            "OR (test_result >= 0 AND test_result <= 100)",
            name="ck_training_test_result",
        ),
        CheckConstraint(
            "training_date IS NULL "
            "OR test_date IS NULL "
            "OR test_date >= training_date",
            name="ck_training_dates",
        ),
    )


class MainInternship(Base):
    __tablename__ = "main_internships"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    introductory_process_id: Mapped[int] = mapped_column(
        ForeignKey(
            "introductory_process.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    internship_policy_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "internship_policies.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=True,
    )

    mentor_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "employees.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=True,
    )

    mentor_assignment_status: Mapped[
        MentorAssignmentStatus
    ] = mapped_column(
        SQLEnum(
            MentorAssignmentStatus,
            values_callable=enum_values,
            name="mentor_assignment_status",
        ),
        nullable=False,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    mentor: Mapped["Employee | None"] = relationship(
        back_populates="mentored_main_internships",
    )

    introductory_process: Mapped[
        "IntroductoryProcess"
    ] = relationship(
        back_populates="main_internships",
    )

    mentor_payment: Mapped[
        "MentorPayment | None"
    ] = relationship(
        back_populates="main_internship",
        passive_deletes="all",
        uselist=False,
    )

    internship_policy: Mapped[
        "InternshipPolicy | None"
    ] = relationship(
        back_populates="main_internships",
    )

    __table_args__ = (
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_main_internship_dates",
        ),
    )