from datetime import date

from sqlalchemy import select

from app.db.database import SessionLocal
from app.enums.organization import PositionCategory
from app.models import AdaptationPolicy


POLICIES = [
    # Старое правило линейного персонала:
    # действует по 01.07.2026 включительно
    {
        "effective_from": date(1900, 1, 1),
        "effective_to": date(2026, 7, 1),
        "position_category": PositionCategory.LINE_STAFF,
        "stage_1_start_offset_days": 7,
        "stage_1_duration_days": 7,
        "stage_2_red_offset_days": 7,
        "stage_2_normal_offset_days": 14,
        "stage_2_duration_days": 7,
        "stage_3_red_offset_days": 7,
        "stage_3_normal_offset_days": 14,
        "stage_3_duration_days": 7,
        "total_deadline_days": 90,
    },

    # Новое правило линейного персонала:
    # действует с 02.07.2026
    {
        "effective_from": date(2026, 7, 2),
        "effective_to": None,
        "position_category": PositionCategory.LINE_STAFF,
        "stage_1_start_offset_days": 14,
        "stage_1_duration_days": 14,
        "stage_2_red_offset_days": 30,
        "stage_2_normal_offset_days": 30,
        "stage_2_duration_days": 14,
        "stage_3_red_offset_days": 14,
        "stage_3_normal_offset_days": 14,
        "stage_3_duration_days": 14,
        "total_deadline_days": 90,
    },

    # Специалист
    {
        "effective_from": date(1900, 1, 1),
        "effective_to": None,
        "position_category": PositionCategory.SPECIALIST,
        "stage_1_start_offset_days": 14,
        "stage_1_duration_days": 14,
        "stage_2_red_offset_days": 14,
        "stage_2_normal_offset_days": 21,
        "stage_2_duration_days": 14,
        "stage_3_red_offset_days": 14,
        "stage_3_normal_offset_days": 14,
        "stage_3_duration_days": 14,
        "total_deadline_days": 90,
    },

    # Линейный руководитель
    {
        "effective_from": date(1900, 1, 1),
        "effective_to": None,
        "position_category": PositionCategory.MANAGER,
        "stage_1_start_offset_days": 14,
        "stage_1_duration_days": 14,
        "stage_2_red_offset_days": 14,
        "stage_2_normal_offset_days": 21,
        "stage_2_duration_days": 14,
        "stage_3_red_offset_days": 14,
        "stage_3_normal_offset_days": 14,
        "stage_3_duration_days": 14,
        "total_deadline_days": 90,
    },

    # Руководитель
    {
        "effective_from": date(1900, 1, 1),
        "effective_to": None,
        "position_category": PositionCategory.HEAD,
        "stage_1_start_offset_days": 14,
        "stage_1_duration_days": 14,
        "stage_2_red_offset_days": 14,
        "stage_2_normal_offset_days": 21,
        "stage_2_duration_days": 14,
        "stage_3_red_offset_days": 14,
        "stage_3_normal_offset_days": 14,
        "stage_3_duration_days": 14,
        "total_deadline_days": 90,
    },
]


def seed_adaptation_policies() -> None:
    db = SessionLocal()

    try:
        for policy_data in POLICIES:
            policy = db.scalar(
                select(AdaptationPolicy).where(
                    AdaptationPolicy.position_category
                    == policy_data["position_category"],
                    AdaptationPolicy.effective_from
                    == policy_data["effective_from"],
                )
            )

            if policy is None:
                policy = AdaptationPolicy(
                    **policy_data
                )
                db.add(policy)
            else:
                for field, value in policy_data.items():
                    setattr(policy, field, value)

        db.commit()

        print(
            f"Adaptation policies seeded: "
            f"{len(POLICIES)}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_adaptation_policies()