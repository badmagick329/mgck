from datetime import datetime, timezone

from django.db import models


class MilestoneUser(models.Model):
    username = models.CharField(max_length=255, unique=True)


class Milestone(models.Model):
    event_timezone = models.CharField(max_length=63, blank=False, null=False)
    event_datetime_utc = models.DateTimeField(blank=False, null=False)
    event_name = models.CharField(max_length=255, blank=False, null=False)
    created = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        MilestoneUser, on_delete=models.CASCADE, blank=False, null=False
    )

    class Meta:  # type: ignore
        ordering = ["event_datetime_utc"]
        unique_together = ("event_name", "created_by")

    @classmethod
    def create(cls, timestamp: int, tz: str, user: str):
        milestone_user, created = MilestoneUser.objects.get_or_create(username=user)

        event_datetime = datetime.fromtimestamp(timestamp, tz=timezone.utc)

        milestone = cls.objects.create(
            event_timezone=tz,
            event_datetime_utc=event_datetime,
            created_by=milestone_user,
        )
        return milestone
