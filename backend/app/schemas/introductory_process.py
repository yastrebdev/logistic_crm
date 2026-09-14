from datetime import date

from pydantic import (
    BaseModel,
    computed_field,
    ConfigDict,
    Field,
    model_validator,
)

from app.enums.introductory_training import (
    AdmissionFormat,
    MentorAssignmentStatus,
)
from app.schemas.mentor_payment import MentorPaymentResponse
from app.schemas.internship_policy import (
    InternshipPolicyResponse,
)


class IntroProcessCreate(BaseModel):
    employee_id: int = Field(gt=0)
    tutor_id: int = Field(gt=0)

    start_date: date = Field(
        default_factory=date.today,
    )
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError(
                "end_date cannot be earlier than start_date"
            )

        return self


class IntroProcessUpdate(BaseModel):
    employee_id: int | None = Field(
        default=None,
        gt=0,
    )
    tutor_id: int | None = Field(
        default=None,
        gt=0,
    )
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_null_values(self):
        required_fields = (
            "employee_id",
            "tutor_id",
            "start_date",
        )

        for field in required_fields:
            if (
                field in self.model_fields_set
                and getattr(self, field) is None
            ):
                raise ValueError(
                    f"{field} cannot be null"
                )

        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError(
                "end_date cannot be earlier than start_date"
            )

        return self


class IntroProcessResponse(BaseModel):
    id: int
    employee_id: int
    tutor_id: int
    start_date: date
    end_date: date | None

    model_config = ConfigDict(
        from_attributes=True,
    )


class IntroductoryInternshipCreate(BaseModel):
    introductory_process_id: int = Field(gt=0)
    mentor_id: int = Field(gt=0)
    internship_date: date


class IntroductoryInternshipUpdate(BaseModel):
    introductory_process_id: int | None = Field(
        default=None,
        gt=0,
    )
    mentor_id: int | None = Field(
        default=None,
        gt=0,
    )
    internship_date: date | None = None

    @model_validator(mode="after")
    def validate_null_values(self):
        required_fields = (
            "introductory_process_id",
            "mentor_id",
            "internship_date",
        )

        for field in required_fields:
            if (
                field in self.model_fields_set
                and getattr(self, field) is None
            ):
                raise ValueError(
                    f"{field} cannot be null"
                )

        return self


class IntroductoryInternshipResponse(BaseModel):
    id: int
    introductory_process_id: int
    mentor_id: int
    internship_date: date

    model_config = ConfigDict(
        from_attributes=True,
    )


class TrainingCreate(BaseModel):
    introductory_process_id: int = Field(gt=0)
    training_date: date | None = None
    admission_format: AdmissionFormat
    test_date: date | None = None
    test_result: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    @model_validator(mode="after")
    def validate_training(self):
        if (
            self.training_date is not None
            and self.test_date is not None
            and self.test_date < self.training_date
        ):
            raise ValueError(
                "test_date cannot be earlier "
                "than training_date"
            )

        if (
            self.test_result is not None
            and self.test_date is None
        ):
            raise ValueError(
                "test_date is required when "
                "test_result is specified"
            )

        return self


class TrainingUpdate(BaseModel):
    introductory_process_id: int | None = Field(
        default=None,
        gt=0,
    )
    training_date: date | None = None
    admission_format: AdmissionFormat | None = None
    test_date: date | None = None
    test_result: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    @model_validator(mode="after")
    def validate_update(self):
        required_fields = (
            "introductory_process_id",
            "admission_format",
        )

        for field in required_fields:
            if (
                field in self.model_fields_set
                and getattr(self, field) is None
            ):
                raise ValueError(
                    f"{field} cannot be null"
                )

        if (
            self.training_date is not None
            and self.test_date is not None
            and self.test_date < self.training_date
        ):
            raise ValueError(
                "test_date cannot be earlier "
                "than training_date"
            )

        return self


class TrainingResponse(BaseModel):
    id: int
    introductory_process_id: int
    training_date: date | None
    admission_format: AdmissionFormat
    test_date: date | None
    test_result: float | None

    model_config = ConfigDict(
        from_attributes=True,
    )


class MainInternshipCreate(BaseModel):
    introductory_process_id: int = Field(gt=0)
    mentor_id: int | None = Field(
        default=None,
        gt=0,
    )
    mentor_assignment_status: MentorAssignmentStatus
    start_date: date
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_main_internship(self):
        if (
            self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError(
                "end_date cannot be earlier than start_date"
            )

        if (
            self.mentor_assignment_status
            == MentorAssignmentStatus.MENTOR_ASSIGNED
            and self.mentor_id is None
        ):
            raise ValueError(
                "mentor_id is required when mentor is assigned"
            )

        return self


class MainInternshipUpdate(BaseModel):
    introductory_process_id: int | None = Field(
        default=None,
        gt=0,
    )
    mentor_id: int | None = Field(
        default=None,
        gt=0,
    )
    mentor_assignment_status: (
        MentorAssignmentStatus | None
    ) = None
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_update(self):
        required_fields = (
            "introductory_process_id",
            "mentor_assignment_status",
            "start_date",
        )

        for field in required_fields:
            if (
                field in self.model_fields_set
                and getattr(self, field) is None
            ):
                raise ValueError(
                    f"{field} cannot be null"
                )

        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError(
                "end_date cannot be earlier than start_date"
            )

        return self


class MainInternshipResponse(BaseModel):
    id: int
    introductory_process_id: int
    internship_policy_id: int | None
    mentor_id: int | None
    mentor_assignment_status: (
        MentorAssignmentStatus
    )
    start_date: date
    end_date: date | None

    model_config = ConfigDict(
        from_attributes=True,
    )

    @computed_field
    @property
    def actual_duration_days(
        self,
    ) -> int | None:
        if self.end_date is None:
            return None

        return (
            self.end_date - self.start_date
        ).days + 1


class MainInternshipDetailResponse(
    MainInternshipResponse
):
    mentor_payment: (
        MentorPaymentResponse | None
    ) = None

    internship_policy: (
        InternshipPolicyResponse | None
    ) = None


class IntroProcessDetailResponse(
    IntroProcessResponse
):
    introductory_internships: list[
        IntroductoryInternshipResponse
    ]

    trainings: list[TrainingResponse]

    main_internships: list[
        MainInternshipDetailResponse
    ]