import sys
from sqlalchemy import delete, select
from app.db.database import SessionLocal
from app.models import (
    AdaptationProcess,
    AdaptationStage,
    Employee,
    ImportJob,
    ImportJobRow,
    IntroductoryInternship,
    IntroductoryProcess,
    MainInternship,
    MentorPayment,
    Training,
)
def collect_ids(
    rows: list[ImportJobRow],
    field: str,
) -> set[int]:
    result: set[int] = set()
    for row in rows:
        data = row.result_data or {}
        value = data.get(field)
        if value is not None:
            result.add(int(value))
    return result
def cleanup_import_job(
    import_job_id: int,
) -> None:
    db = SessionLocal()
    try:
        import_job = db.get(
            ImportJob,
            import_job_id,
        )
        if import_job is None:
            raise RuntimeError(
                f"Задание импорта {import_job_id} не найдено"
            )
        rows = list(
            db.scalars(
                select(ImportJobRow)
                .where(
                    ImportJobRow.import_job_id
                    == import_job_id
                )
            ).all()
        )
        employee_ids = collect_ids(
            rows,
            "employee_id",
        )
        introductory_process_ids = collect_ids(
            rows,
            "introductory_process_id",
        )
        adaptation_process_ids = collect_ids(
            rows,
            "adaptation_process_id",
        )
        mentor_payment_ids = collect_ids(
            rows,
            "mentor_payment_id",
        )
        print(
            "Будут удалены данные задания:",
            import_job_id,
        )
        print("Строк журнала:", len(rows))
        print("Сотрудников:", len(employee_ids))
        print(
            "Вводных процессов:",
            len(introductory_process_ids),
        )
        print(
            "Процессов адаптации:",
            len(adaptation_process_ids),
        )
        print(
            "Оплат наставникам:",
            len(mentor_payment_ids),
        )
        # 1. Этапы и процессы адаптации
        if adaptation_process_ids:
            db.execute(
                delete(AdaptationStage)
                .where(
                    AdaptationStage
                    .adaptation_process_id
                    .in_(adaptation_process_ids)
                )
            )
            db.execute(
                delete(AdaptationProcess)
                .where(
                    AdaptationProcess.id.in_(
                        adaptation_process_ids
                    )
                )
            )
        # 2. Оплаты наставникам
        if mentor_payment_ids:
            db.execute(
                delete(MentorPayment)
                .where(
                    MentorPayment.id.in_(
                        mentor_payment_ids
                    )
                )
            )
        # 3. Составляющие вводного процесса
        if introductory_process_ids:
            db.execute(
                delete(IntroductoryInternship)
                .where(
                    IntroductoryInternship
                    .introductory_process_id
                    .in_(introductory_process_ids)
                )
            )
            db.execute(
                delete(Training)
                .where(
                    Training
                    .introductory_process_id
                    .in_(introductory_process_ids)
                )
            )
            db.execute(
                delete(MainInternship)
                .where(
                    MainInternship
                    .introductory_process_id
                    .in_(introductory_process_ids)
                )
            )
            db.execute(
                delete(IntroductoryProcess)
                .where(
                    IntroductoryProcess.id.in_(
                        introductory_process_ids
                    )
                )
            )
        # 4. Сотрудники, созданные этим импортом
        if employee_ids:
            db.execute(
                delete(Employee)
                .where(
                    Employee.id.in_(
                        employee_ids
                    )
                )
            )
        # 5. Само задание и его строки
        db.execute(
            delete(ImportJobRow)
            .where(
                ImportJobRow.import_job_id
                == import_job_id
            )
        )
        db.delete(import_job)
        db.commit()
        print(
            f"Импорт {import_job_id} полностью очищен"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(
            "Использование: "
            "py -3.13 cleanup_import_job.py "
            "<import_job_id>"
        )
    cleanup_import_job(
        int(sys.argv[1])
    )