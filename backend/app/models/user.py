from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.database import Base
from app.enums.base import enum_values
from app.enums.user import UserType


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    manager_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        index=True,
        nullable=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    full_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    user_type: Mapped[UserType] = mapped_column(
        SQLEnum(
            UserType,
            values_callable=enum_values,
            name="user_type",
        ),
        nullable=False,
    )

    role_id: Mapped[int] = mapped_column(
        ForeignKey(
            "roles.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    manager: Mapped["User | None"] = relationship(
        remote_side="User.id",
        foreign_keys=[manager_id],
        back_populates="subordinates",
    )

    subordinates: Mapped[list["User"]] = relationship(
        foreign_keys="User.manager_id",
        back_populates="manager",
        passive_deletes=True,
    )

    role: Mapped["Role"] = relationship(
        back_populates="users",
    )

    distribution_center_links: Mapped[
        list["UserDistributionCenter"]
    ] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    created_notifications: Mapped[
        list["Notification"]
    ] = relationship(
        back_populates="created_by",
        foreign_keys="Notification.created_by_user_id",
        passive_deletes=True,
    )

    notification_recipients: Mapped[
        list["NotificationRecipient"]
    ] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    introductory_processes: Mapped[
        list["IntroductoryProcess"]
    ] = relationship(
        back_populates="tutor",
        passive_deletes="all",
    )


class UserDistributionCenter(Base):
    __tablename__ = "user_distribution_centers"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    distribution_center_id: Mapped[int] = mapped_column(
        ForeignKey(
            "distribution_centers.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )


    user: Mapped["User"] = relationship(
        back_populates="distribution_center_links",
    )

    distribution_center: Mapped[
        "DistributionCenter"
    ] = relationship(
        back_populates="user_links",
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "distribution_center_id",
            name="uq_user_distribution_center",
        ),
    )