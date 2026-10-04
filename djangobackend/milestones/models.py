import re
import uuid
from datetime import datetime
from datetime import timezone as dt_timezone

from django.core.exceptions import ValidationError
from django.db import models, router, transaction
from django.db.models import Q
from django.utils import timezone
from milestones.limits import enforce_record_limit


def validate_hex_color(value):
    if not re.match(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", value):
        raise ValidationError(
            f"{value} is not a valid hex color code. Use format #RGB or #RRGGBB"
        )


class MilestoneUser(models.Model):
    username = models.CharField(max_length=255, unique=True)
    core_user_id = models.CharField(
        max_length=255, unique=True, null=True, blank=True
    )


class Milestone(models.Model):
    DEFAULT_COLOR = "#8884d8"

    event_timezone = models.CharField(max_length=63, blank=False, null=False)
    event_datetime_utc = models.DateTimeField(blank=False, null=False)
    event_name = models.CharField(max_length=255, blank=False, null=False)
    created = models.DateTimeField(auto_now_add=True)
    public_id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False
    )
    updated_at = models.DateTimeField(default=timezone.now)
    deleted_at = models.DateTimeField(null=True, blank=True)
    server_received_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(
        MilestoneUser, on_delete=models.CASCADE, blank=False, null=False
    )
    color = models.CharField(
        max_length=63,
        blank=False,
        null=False,
        validators=[validate_hex_color],
        default=DEFAULT_COLOR,
    )

    class Meta:  # type: ignore
        ordering = ["event_datetime_utc"]
        constraints = [
            models.UniqueConstraint(
                fields=["event_name", "created_by"],
                condition=Q(deleted_at__isnull=True),
                name="milestone_unique_active_name_per_user",
            )
        ]

    @classmethod
    def create(
        cls,
        event_name: str,
        timestamp: int,
        timezone: str,
        username: str,
        color: str | None = None,
    ):
        milestone_user, created = MilestoneUser.objects.get_or_create(
            username=username
        )

        timestamp_seconds = timestamp / 1000
        event_datetime = datetime.fromtimestamp(
            timestamp_seconds, tz=dt_timezone.utc
        )

        milestone = cls.objects.create(
            event_name=event_name,
            event_timezone=timezone,
            event_datetime_utc=event_datetime,
            created_by=milestone_user,
            color=color or cls.DEFAULT_COLOR,
        )
        return milestone

    def soft_delete(self, received_at=None):
        deletion_time = received_at or timezone.now()
        self.updated_at = deletion_time
        self.deleted_at = deletion_time
        self.server_received_at = deletion_time
        self.save(
            update_fields=["updated_at", "deleted_at", "server_received_at"]
        )

    def save(self, *args, **kwargs):
        using = kwargs.get("using") or router.db_for_write(type(self), instance=self)
        with transaction.atomic(using=using):
            # All model-based creation (including admin and legacy helpers) and
            # sync take this owner lock before counting or writing. A count
            # without the lock would allow concurrent requests past the quota.
            MilestoneUser.objects.using(using).select_for_update().get(
                pk=self.created_by_id
            )
            previous_owner = (
                type(self).objects.using(using).filter(pk=self.pk)
                .values_list("created_by_id", flat=True).first()
                if self.pk else None
            )
            if previous_owner != self.created_by_id:
                enforce_record_limit(
                    type(self).objects.using(using).filter(
                        created_by_id=self.created_by_id
                    ).count(),
                    1,
                )
            self.full_clean()
            super().save(*args, **kwargs)
