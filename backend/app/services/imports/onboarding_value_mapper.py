from typing import Any

from app.enums.adaptation import (
    AdaptationDelayReason,
    AdaptationParticipants,
    AdaptationRiskReason,
    AdaptationRiskZone,
    MethodExecutionAdaptation,
)
from app.enums.employee import (
    CandidateType,
    HiringDelayReason,
    HiringRejectionReason,
    SeparationReason,
)
from app.enums.introductory_training import (
    AdmissionFormat,
    MentorAssignmentStatus,
)
from app.enums.mentor_payment import (
    NonPaymentReason,
    PaymentRegistrationMethod,
)


def _key(value: Any) -> str:
    if value is None:
        return ""

    return " ".join(
        str(value)
        .replace("\xa0", " ")
        .replace("ё", "е")
        .casefold()
        .split()
    )


CANDIDATE_TYPES = {
    "внешний кандидат":
        CandidateType.EXTERNAL_CANDIDATE,

    "работал ранее - вн":
        CandidateType.FORMER_EMPLOYEE,

    "контрагент":
        CandidateType.CONTRACTOR,
}


HIRING_REJECTION_REASONS = {
    "не устраивает график":
        HiringRejectionReason
        .SCHEDULE_UNSUITABLE,

    "обдумывает ту":
        HiringRejectionReason
        .CONSIDERING_EMPLOYMENT,

    "отказ руководителя":
        HiringRejectionReason
        .MANAGER_REFUSED,

    "отказ сб":
        HiringRejectionReason
        .SECURITY_REFUSED,

    "ту аннулировано":
        HiringRejectionReason
        .EMPLOYMENT_CANCELLED,

    "не устраивают условия труда":
        HiringRejectionReason
        .WORKING_CONDITIONS_UNSUITABLE,

    "не устраивает специфика работы":
        HiringRejectionReason
        .JOB_SPECIFICS_UNSUITABLE,

    "большой объем работы":
        HiringRejectionReason
        .WORKLOAD_TOO_HIGH,

    "не устраивает зарплата":
        HiringRejectionReason
        .SALARY_UNSUITABLE,

    "тяжелая работа (физ нагрузка)":
        HiringRejectionReason
        .HEAVY_PHYSICAL_WORK,

    "кандидат не выходит на связь":
        HiringRejectionReason.NO_CONTACT,

    "практикант":
        HiringRejectionReason.INTERN,

    "нашел другую работу":
        HiringRejectionReason
        .FOUND_ANOTHER_JOB,

    "сложности с оборудованием "
    "(тсд/пк/андройд)":
        HiringRejectionReason
        .EQUIPMENT_DIFFICULTIES,

    "проблемы с документами":
        HiringRejectionReason
        .DOCUMENT_ISSUES,

    "контрагент":
        HiringRejectionReason.CONTRACTOR,
}


HIRING_DELAY_REASONS = {
    "аутсорсинг":
        HiringDelayReason.OUTSOURCING,

    "проблема с документами":
        HiringDelayReason.DOCUMENT_ISSUES,

    "необходима замена патента":
        HiringDelayReason
        .PATENT_REPLACEMENT_REQUIRED,

    "отработка на прежнем месте работы":
        HiringDelayReason
        .NOTICE_PERIOD_AT_PREVIOUS_JOB,

    "ждет освобождения ставки":
        HiringDelayReason
        .WAITING_FOR_VACANCY,

    "временное ту на гпх":
        HiringDelayReason
        .TEMPORARY_CIVIL_CONTRACT,

    "обдумывает ту":
        HiringDelayReason
        .CONSIDERING_EMPLOYMENT,
}


SEPARATION_REASONS = {
    "увольнение в порядке перевода":
        SeparationReason
        .TRANSFER_TERMINATION,

    "истечение срока действия документов":
        SeparationReason
        .DOCUMENTS_EXPIRED,

    "с внутреннего совместительства":
        SeparationReason
        .INTERNAL_PART_TIME_END,

    "переезд":
        SeparationReason.RELOCATION,

    "смерть":
        SeparationReason.DEATH,

    "призыв в армию":
        SeparationReason.MILITARY_SERVICE,

    "не устраивает зарплата":
        SeparationReason.SALARY_UNSUITABLE,

    "не устраивает руководитель":
        SeparationReason.MANAGER_UNSUITABLE,

    "не устраивает график":
        SeparationReason.SCHEDULE_UNSUITABLE,

    "не устраивает работа "
    "(только для супермаркетов и рц)":
        SeparationReason.JOB_UNSUITABLE,

    "большой объем работ":
        SeparationReason.WORKLOAD_TOO_HIGH,

    "нет карьерного роста":
        SeparationReason.NO_CAREER_GROWTH,

    "нашел работу по специальности "
    "(только для супермаркетов и рц)":
        SeparationReason
        .FOUND_JOB_IN_SPECIALTY,

    "по состоянию здоровья":
        SeparationReason.HEALTH_REASONS,

    "необходимость ухода за родственниками "
    "(болезнь, уход за детьми)":
        SeparationReason.FAMILY_CARE,

    "воровство (инициатива дпп)":
        SeparationReason.THEFT,

    "инициатива руководства "
    "(прогул, пьянство, хамство, "
    "частые больничные и т":
        SeparationReason
        .MANAGEMENT_INITIATIVE,

    "сотрудник не справляется":
        SeparationReason
        .PERFORMANCE_FAILURE,

    "прогул (увольнение по статье за прогул, "
    "не длительное отсутствие)":
        SeparationReason.ABSENCE,

    "потеряшка "
    "(длительное отсутствие на работе)":
        SeparationReason.LOST_CONTACT,

    "оптимизация штатного расписания "
    "(сокращение)":
        SeparationReason
        .STAFF_OPTIMIZATION,

    "декретница (не выходя из отпуска)":
        SeparationReason
        .MATERNITY_LEAVE_NO_RETURN,

    "причина неизвестна":
        SeparationReason.UNKNOWN,

    "прием на основное место к нам "
    "(с внешнего сов-ва)":
        SeparationReason
        .INTERNAL_PRIMARY_EMPLOYMENT,

    "выход на пенсию":
        SeparationReason.RETIREMENT,

    "работа на период каникул":
        SeparationReason.HOLIDAY_WORK,

    "садово-огородный сезон "
    "(только для супермаркетов и рц)":
        SeparationReason.GARDEN_SEASON,

    "полиграф":
        SeparationReason.POLYGRAPH,

    "студенты":
        SeparationReason.STUDENTS,

    "с внешнего совместительства":
        SeparationReason
        .EXTERNAL_PART_TIME_END,

    "банкротство":
        SeparationReason.BANKRUPTCY,

    "переоформление (рц)":
        SeparationReason.REEMPLOYMENT_DC,

    "деструктивное поведение "
    "(агрессия, враждебность, "
    "нецензурная лексика)":
        SeparationReason
        .DESTRUCTIVE_BEHAVIOR,

    "в связи с получением пособий":
        SeparationReason.BENEFITS,

    "не выявлена":
        SeparationReason.NOT_IDENTIFIED,
}


ADMISSION_FORMATS = {
    "тест на бланке":
        AdmissionFormat.TEST_FORM,

    "тест на портале":
        AdmissionFormat.TEST_PORTAL,

    "экзамен":
        AdmissionFormat.EXAM,

    "собеседование":
        AdmissionFormat.INTERVIEW,
}


MENTOR_ASSIGNMENT_STATUSES = {
    "ранее работал":
        MentorAssignmentStatus
        .PREVIOUSLY_EMPLOYED,

    "мпо - наставник":
        MentorAssignmentStatus
        .MPO_IS_MENTOR,

    "наставник не предполагается":
        MentorAssignmentStatus
        .MENTOR_NOT_REQUIRED,

    "наставник назначен":
        MentorAssignmentStatus
        .MENTOR_ASSIGNED,
}


NON_PAYMENT_REASONS = {
    "увольнение стажера":
        NonPaymentReason
        .TRAINEE_TERMINATED,

    "увольнение наставника":
        NonPaymentReason
        .MENTOR_TERMINATED,

    "нет потревждающих документов":
        NonPaymentReason
        .MISSING_SUPPORTING_DOCUMENTS,

    "два наставника":
        NonPaymentReason.TWO_MENTORS,

    "не полная стажировка":
        NonPaymentReason
        .INCOMPLETE_INTERNSHIP,
}


PAYMENT_REGISTRATION_METHODS = {
    "наставничество":
        PaymentRegistrationMethod.MENTORING,

    "прочая премия":
        PaymentRegistrationMethod
        .OTHER_BONUS,
}


ADAPTATION_METHODS = {
    "портал":
        MethodExecutionAdaptation.PORTAL,

    "очно":
        MethodExecutionAdaptation
        .IN_PERSON,

    "звонок":
        MethodExecutionAdaptation.CALL,

    "яндекс форма":
        MethodExecutionAdaptation
        .YANDEX_FORM,
}


ADAPTATION_DELAY_REASONS = {
    "болезнь":
        AdaptationDelayReason.ILLNESS,

    "несовпадение смен":
        AdaptationDelayReason
        .SHIFT_MISMATCH,

    "потеряшка":
        AdaptationDelayReason
        .LOST_CONTACT,

    "не ответил":
        AdaptationDelayReason
        .NO_RESPONSE,

    "отпуск мпо/бл":
        AdaptationDelayReason
        .MPO_VACATION_OR_SICK_LEAVE,

    "отказ руководителя":
        AdaptationDelayReason
        .MANAGER_REFUSED,

    "отказ сотрудника":
        AdaptationDelayReason
        .EMPLOYEE_REFUSED,

    "ночная смена":
        AdaptationDelayReason
        .NIGHT_SHIFT,

    "портал мпо/бл":
        AdaptationDelayReason
        .MPO_PORTAL_OR_SICK_LEAVE,
}


ADAPTATION_PARTICIPANTS = {
    "мпо":
        AdaptationParticipants.MPO,

    "мпо, мпп":
        AdaptationParticipants
        .MPO_AND_MPP,

    "мпо, рук.":
        AdaptationParticipants
        .MPO_AND_MANAGER,

    "мпо, мпп, рук.":
        AdaptationParticipants
        .MPO_MPP_AND_MANAGER,

    "удаленно (портал/яндекс)":
        AdaptationParticipants.REMOTE,
}


ADAPTATION_RISK_ZONES = {
    "красный":
        AdaptationRiskZone.RED,
}


ADAPTATION_RISK_REASONS = {
    "большой объем работы":
        AdaptationRiskReason
        .WORKLOAD_TOO_HIGH,

    "не устраивает график":
        AdaptationRiskReason
        .SCHEDULE_UNSUITABLE,

    "не устраивает зарплата":
        AdaptationRiskReason
        .SALARY_UNSUITABLE,

    "не устраивает работа":
        AdaptationRiskReason
        .JOB_UNSUITABLE,

    "не устраивает система штрафов":
        AdaptationRiskReason
        .PENALTY_SYSTEM_UNSUITABLE,

    "не устраивают условия труда":
        AdaptationRiskReason
        .WORKING_CONDITIONS_UNSUITABLE,

    "нет взаимопонимания с руководителем":
        AdaptationRiskReason
        .MANAGER_RELATIONSHIP_ISSUES,

    "планирует переезд":
        AdaptationRiskReason
        .PLANNING_RELOCATION,

    "по состоянию здоровья":
        AdaptationRiskReason
        .HEALTH_REASONS,

    "потеряшка":
        AdaptationRiskReason
        .LOST_CONTACT,

    "работоспособность оборудования":
        AdaptationRiskReason
        .EQUIPMENT_PERFORMANCE,

    "студенты на летнее время":
        AdaptationRiskReason
        .SEASONAL_STUDENT,

    "тяжелая работа":
        AdaptationRiskReason
        .HEAVY_WORK,
}


def map_onboarding_values(
    normalized_data: dict[str, Any],
    source_warnings: list[str],
    source_errors: list[str],
) -> tuple[
    dict[str, Any],
    list[str],
    list[str],
]:
    data = dict(normalized_data)
    warnings = list(source_warnings)
    errors = list(source_errors)

    _map_field(
        data=data,
        source_field="candidate_type",
        target_field="candidate_type_value",
        mapping=CANDIDATE_TYPES,
        label="Статус ТУ",
        errors=errors,
        required=True,
    )

    _map_field(
        data=data,
        source_field="reason_not_hiring",
        target_field=(
            "reason_not_hiring_value"
        ),
        mapping=HIRING_REJECTION_REASONS,
        label="Причина не ТУ",
        errors=errors,
    )

    _map_field(
        data=data,
        source_field="reason_delayed_hiring",
        target_field=(
            "reason_delayed_hiring_value"
        ),
        mapping=HIRING_DELAY_REASONS,
        label="ТУ не сразу",
        errors=errors,
    )

    _map_field(
        data=data,
        source_field="admission_format",
        target_field="admission_format_value",
        mapping=ADMISSION_FORMATS,
        label="Формат допуска",
        errors=errors,
        required=any(
            data.get(field) is not None
            for field in (
                "training_date",
                "test_date",
                "test_result",
            )
        ),
    )

    main_mentor_name = data.get(
        "main_mentor_name"
    )

    mentor_absence_reason = data.get(
        "mentor_absence_reason"
    )

    if main_mentor_name:
        data[
            "mentor_assignment_status_value"
        ] = (
            MentorAssignmentStatus
            .MENTOR_ASSIGNED
            .value
        )

    elif mentor_absence_reason:
        mapped_status = (
            MENTOR_ASSIGNMENT_STATUSES.get(
                _key(mentor_absence_reason)
            )
        )

        if mapped_status is None:
            data[
                "mentor_assignment_status_value"
            ] = None

            errors.append(
                f'Значение «{mentor_absence_reason}» '
                "не найдено в списке "
                "«Причина отсутствия наставника»"
            )
        else:
            data[
                "mentor_assignment_status_value"
            ] = mapped_status.value

    elif data.get(
            "main_internship_start_date"
    ) is not None:
        data[
            "mentor_assignment_status_value"
        ] = None

        errors.append(
            "Для основной стажировки не указан "
            "наставник или причина его отсутствия"
        )

    else:
        data[
            "mentor_assignment_status_value"
        ] = None

    _map_field(
        data=data,
        source_field="non_payment_reason",
        target_field=(
            "non_payment_reason_value"
        ),
        mapping=NON_PAYMENT_REASONS,
        label="Причина неполной оплаты",
        errors=errors,
    )

    _map_field(
        data=data,
        source_field=(
            "payment_registration_method"
        ),
        target_field=(
            "payment_registration_method_value"
        ),
        mapping=(
            PAYMENT_REGISTRATION_METHODS
        ),
        label=(
            "Метод заведения оплаты в 1С"
        ),
        errors=errors,
    )

    _map_field(
        data=data,
        source_field="separation_reason",
        target_field="separation_reason_value",
        mapping=SEPARATION_REASONS,
        label="Причина увольнения",
        errors=errors,
    )

    for stage_number in (1, 2, 3):
        prefix = f"stage_{stage_number}"

        _map_field(
            data=data,
            source_field=f"{prefix}_method",
            target_field=(
                f"{prefix}_method_value"
            ),
            mapping=ADAPTATION_METHODS,
            label=(
                f"Метод {stage_number} "
                "адаптации"
            ),
            errors=errors,
        )

        _map_field(
            data=data,
            source_field=(
                f"{prefix}_participants"
            ),
            target_field=(
                f"{prefix}_participants_value"
            ),
            mapping=ADAPTATION_PARTICIPANTS,
            label=(
                f"Участники {stage_number} "
                "адаптации"
            ),
            errors=errors,
        )

        _map_field(
            data=data,
            source_field=(
                f"{prefix}_delay_reason"
            ),
            target_field=(
                f"{prefix}_delay_reason_value"
            ),
            mapping=(
                ADAPTATION_DELAY_REASONS
            ),
            label=(
                f"Причина опоздания "
                f"{stage_number} адаптации"
            ),
            errors=errors,
        )

        _map_field(
            data=data,
            source_field=(
                f"{prefix}_risk_zone"
            ),
            target_field=(
                f"{prefix}_risk_zone_value"
            ),
            mapping=ADAPTATION_RISK_ZONES,
            label=(
                f"Риск зоны {stage_number}"
            ),
            errors=errors,
        )

        _map_field(
            data=data,
            source_field=(
                f"{prefix}_risk_reason"
            ),
            target_field=(
                f"{prefix}_risk_reason_value"
            ),
            mapping=(
                ADAPTATION_RISK_REASONS
            ),
            label=(
                f"Причина риска "
                f"{stage_number}"
            ),
            errors=errors,
        )

        risk_reason = data.get(
            f"{prefix}_risk_reason_value"
        )

        risk_zone = data.get(
            f"{prefix}_risk_zone_value"
        )

        if (
            risk_reason is not None
            and risk_zone is None
        ):
            errors.append(
                f"Для причины риска "
                f"{stage_number} адаптации "
                "не указан красный риск"
            )

    return data, warnings, errors


def _map_field(
    data: dict[str, Any],
    source_field: str,
    target_field: str,
    mapping: dict[str, Any],
    label: str,
    errors: list[str],
    required: bool = False,
) -> None:
    source_value = data.get(source_field)

    if source_value is None or not _key(
        source_value
    ):
        data[target_field] = None

        if required:
            errors.append(
                f'Не заполнено обязательное поле '
                f'«{label}»'
            )

        return

    mapped_value = mapping.get(
        _key(source_value)
    )

    if mapped_value is None:
        data[target_field] = None

        errors.append(
            f'Значение «{source_value}» '
            f'не найдено в списке «{label}»'
        )

        return

    data[target_field] = (
        mapped_value.value
    )