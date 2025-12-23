import re
from datetime import datetime
from datetime import timezone as dt_timezone

from django.core.exceptions import ValidationError
from django.db import models


def validate_hex_color(value):
    if not re.match(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", value):
        raise ValidationError(
            f"{value} is not a valid hex color code. Use format #RGB or #RRGGBB"
        )


class MilestoneUser(models.Model):
    username = models.CharField(max_length=255, unique=True)


class Milestone(models.Model):
    DEFAULT_COLOR = "#8884d8"

    event_timezone = models.CharField(max_length=63, blank=False, null=False)
    event_datetime_utc = models.DateTimeField(blank=False, null=False)
    event_name = models.CharField(max_length=255, blank=False, null=False)
    created = models.DateTimeField(auto_now_add=True)
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
        unique_together = ("event_name", "created_by")

    @classmethod
    def create(
        cls,
        event_name: str,
        timestamp: int,
        timezone: str,
        username: str,
        color: str | None = None,
    ):
        milestone_user, created = MilestoneUser.objects.get_or_create(username=username)

        timestamp_seconds = timestamp / 1000
        event_datetime = datetime.fromtimestamp(timestamp_seconds, tz=dt_timezone.utc)

        milestone = cls.objects.create(
            event_name=event_name,
            event_timezone=timezone,
            event_datetime_utc=event_datetime,
            created_by=milestone_user,
            color=color or cls.DEFAULT_COLOR,
        )
        return milestone

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
