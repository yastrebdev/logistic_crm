from datetime import date
from decimal import Decimal
from sqlalchemy import select
from app.db.database import SessionLocal
from app.models import (
    InternshipPolicy,
    MentorPaymentPolicy,
    Position,
)
EFFECTIVE_FROM = date(1900, 1, 1)
PROBATION_MONTHS = 3
# Название, минимум дней, максимум дней, выплата
POLICIES = [
    ("Администратор WMS", 30, 30, "10000"),
    ("Аналитик по списанию и утилизации", 30, 30, "5000"),
    ("Водитель погрузчика", 2, 3, "2500"),
    ("Водитель", 5, 5, "10000"),
    ("Водитель штабелера", 2, 3, "3000"),
    ("Диспетчер", 30, 30, "5000"),
    ("Инженер по эксплуатации", 30, 30, "7500"),
    ("Комплектовщик", 2, 3, "3000"),
    ("Менеджер по обучению", 30, 30, "6000"),
    ("Менеджер по персоналу", 30, 30, "6000"),
    (
        "Специалист по кадровому делопроизводству",
        30,
        30,
        "6000",
    ),
    ("Начальник автоколонны", 60, 60, "7500"),
    (
        "Начальник отдела предотвращения потерь РЦ",
        60,
        60,
        "15000",
    ),
    ("Начальник службы качества", 90, 90, "7500"),
    ("Оператор WMS", 30, 30, "5000"),
    ("Оператор отдела учета", 30, 30, "5000"),
    ("Приемосдатчик загрузки", 10, 10, "3000"),
    ("Приемосдатчик приемки", 10, 10, "2500"),
    (
        "Руководитель подразделения департамента логистики",
        90,
        90,
        "30000",
    ),
    (
        "Руководитель распределительного центра",
        90,
        90,
        "30000",
    ),
    (
        "Руководитель отгрузки и комплектации",
        30,
        30,
        "9000",
    ),
    (
        "Руководитель сектора складской обработки",
        60,
        60,
        "15000",
    ),
    ("Слотчик", 2, 3, "2000"),
    ("Специалист по качеству", 90, 90, "5000"),
    (
        "Старший специалист по оперативным потерям",
        30,
        30,
        "5000",
    ),
    (
        "Специалист приемки и хранения товара",
        30,
        30,
        "7500",
    ),
    ("Старший оператор", 30, 30, "7500"),
    ("Старший смены", 30, 30, "7500"),
    (
        "Технолог камеры газации бананов",
        30,
        30,
        "5000",
    ),
    (
        "Кладовщик камеры газации бананов",
        30,
        30,
        "5000",
    ),
    ("Транспортный диспетчер", 30, 30, "5000"),
    (
        "Ведущий менеджер по обучению",
        90,
        90,
        "6500",
    ),
    (
        "Ведущий менеджер по персоналу",
        90,
        90,
        "6500",
    ),
    (
        "Ведущий специалист качества",
        90,
        90,
        "6500",
    ),
    (
        "Ведущий специалист качеств (ФРОВ)",
        90,
        90,
        "6500",
    ),
    (
        "Ведущий специалист по кадровому делопроизводству",
        90,
        90,
        "6500",
    ),
    (
        "Инженер по безопасности дорожного движения",
        60,
        60,
        "5000",
    ),
    ("Комендант", 60, 60, "3000"),
    (
        "Руководитель диспетчерской службы",
        90,
        90,
        "6500",
    ),
    (
        "Руководитель отдел обучения логистики",
        90,
        90,
        "7500",
    ),
    (
        "Руководитель отдел персонала РЦ",
        90,
        90,
        "7500",
    ),
    (
        "Руководитель службы качества",
        90,
        90,
        "7500",
    ),
    (
        "Специалист отдел вторсырья",
        30,
        30,
        "5000",
    ),
    (
        "Специалист по договорной работе",
        30,
        30,
        "5000",
    ),
    (
        "Старший начальник автоколонны",
        90,
        90,
        "15000",
    ),
]
def seed_internship_policies() -> None:
    db = SessionLocal()
    created = 0
    updated = 0
    missing: list[str] = []
    try:
        for (
            position_name,
            duration_min_days,
            duration_max_days,
            payment_amount,
        ) in POLICIES:
            positions = db.scalars(
                select(Position).where(
                    Position.name
                    == position_name
                )
            ).all()
            if not positions:
                missing.append(position_name)
                continue
            for position in positions:
                policy = db.scalar(
                    select(
                        InternshipPolicy
                    ).where(
                        InternshipPolicy.position_id
                        == position.id,
                        InternshipPolicy.effective_from
                        == EFFECTIVE_FROM,
                    )
                )
                if policy is None:
                    policy = InternshipPolicy(
                        position_id=position.id,
                        effective_from=(
                            EFFECTIVE_FROM
                        ),
                        effective_to=None,
                        duration_min_days=(
                            duration_min_days
                        ),
                        duration_max_days=(
                            duration_max_days
                        ),
                        probation_months=(
                            PROBATION_MONTHS
                        ),
                    )
                    db.add(policy)
                    db.flush()
                    policy.mentor_payment_policy = (
                        MentorPaymentPolicy(
                            amount=Decimal(
                                payment_amount
                            )
                        )
                    )
                    created += 1
                else:
                    policy.duration_min_days = (
                        duration_min_days
                    )
                    policy.duration_max_days = (
                        duration_max_days
                    )
                    policy.probation_months = (
                        PROBATION_MONTHS
                    )
                    if (
                        policy
                        .mentor_payment_policy
                        is None
                    ):
                        policy.mentor_payment_policy = (
                            MentorPaymentPolicy(
                                amount=Decimal(
                                    payment_amount
                                )
                            )
                        )
                    else:
                        (
                            policy
                            .mentor_payment_policy
                            .amount
                        ) = Decimal(
                            payment_amount
                        )
                    updated += 1
        db.commit()
        print(
            f"Internship policies created: "
            f"{created}"
        )
        print(
            f"Internship policies updated: "
            f"{updated}"
        )
        if missing:
            print(
                "Positions not found:"
            )
            for name in missing:
                print(f"- {name}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
if __name__ == "__main__":
    seed_internship_policies()