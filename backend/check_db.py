from sqlalchemy import select

from app.db.database import SessionLocal
from app.models.rbac import Role


db = SessionLocal()

roles = db.scalars(
    select(Role)
).all()

for role in roles:
    print(f"\nRole: {role.name}")

    for permission in role.permissions:
        print(f"  - {permission.name}")

db.close()