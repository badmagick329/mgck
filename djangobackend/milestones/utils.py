from datetime import datetime
from datetime import timezone as tz
from typing import Any

from core.error import Error
from core.result import Err, Ok, Result
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone as django_timezone
from rest_framework.response import Response

from milestones.models import Milestone, MilestoneUser


class MilestoneError(Error):
    status: int

    def __init__(self, error: str, status: int):
        super().__init__(error)
        self.status = status


def create_milestone(
    timestamp: int | None,
    timezone: str | None,
    owner: MilestoneUser,
    event_name: str | None,
    color: str | None,
) -> Result[Milestone, MilestoneError]:
    if isinstance(event_name, str):
        event_name = event_name.strip()
    if not event_name:
        return Err(MilestoneError("Event name is required", 400))
    if not timezone:
        return Err(MilestoneError("Timezone is required", 400))
    if timestamp is None:
        return Err(MilestoneError("Timestamp is required", 400))
    if Milestone.objects.filter(
        created_by=owner,
        event_name=event_name,
        deleted_at__isnull=True,
    ).exists():
        return Err(
            MilestoneError(
                f"Milestone with name '{event_name}' already exists", 400
            )
        )

    try:
        timestamp_seconds = timestamp / 1000
        event_datetime = datetime.fromtimestamp(timestamp_seconds, tz=tz.utc)
        received_at = django_timezone.now()
        milestone = Milestone.objects.create(
            event_name=event_name,
            event_datetime_utc=event_datetime,
            event_timezone=timezone,
            created_by=owner,
            color=color or Milestone.DEFAULT_COLOR,
            updated_at=received_at,
            server_received_at=received_at,
        )

        return Ok(milestone)
    except (TypeError, ValueError, OverflowError, OSError) as e:
        return Err(MilestoneError(f"Invalid timestamp: {str(e)}", 400))
    except ValidationError as e:
        return Err(
            MilestoneError(f"Invalid data: {e.message_dict or str(e)}", 400)
        )
    except IntegrityError as e:
        if "unique" in str(e).lower():
            return Err(
                MilestoneError(
                    f"Milestone with name '{event_name}' already exists",
                    400,
                )
            )
        return Err(MilestoneError(f"Constraint violation {str(e)}", 400))
    except Exception as e:
        print(e)
        return Err(MilestoneError(f"Error creating milestone: {str(e)}", 500))


def create_milestone_response(
    timestamp: int | None,
    timezone: str | None,
    owner: MilestoneUser,
    event_name: str | None,
    color: str | None,
):
    result = create_milestone(timestamp, timezone, owner, event_name, color)
    if result.is_err:
        error = result.unwrap_err()
        return Response({"error": error.error}, status=error.status)

    milestone = result.unwrap()
    return Response(
        {
            "id": milestone.id,  # type: ignore
            "event_name": milestone.event_name,
            "event_datetime_utc": milestone.event_datetime_utc,
            "event_timezone": milestone.event_timezone,
            "color": milestone.color,
            "created_by": milestone.created_by.username,
            "created": milestone.created,
        },
        status=201,
    )


def get_all_milestones(
    owner: MilestoneUser,
) -> Result[list[dict[str, Any]], MilestoneError]:
    try:
        milestones = Milestone.objects.filter(
            created_by=owner, deleted_at__isnull=True
        )
        milestones_data = [
            {
                "id": milestone.id,  # type: ignore
                "event_name": milestone.event_name,
                "event_datetime_utc": milestone.event_datetime_utc,
                "event_timezone": milestone.event_timezone,
                "created": milestone.created,
                "color": milestone.color,
            }
            for milestone in milestones
        ]
        return Ok(milestones_data)
    except Exception as e:
        return Err(MilestoneError(f"Error fetching milestones: {str(e)}", 500))


def get_all_milestones_response(owner: MilestoneUser):
    result = get_all_milestones(owner)
    if result.is_err:
        error = result.unwrap_err()
        return Response({"error": error.error}, status=error.status)

    milestones = result.unwrap()
    return Response(milestones, status=200)


def update_milestone(
    owner: MilestoneUser,
    event_name: str | None,
    new_event_name: str | None = None,
    new_timestamp: int | None = None,
    new_timezone: str | None = None,
    new_color: str | None = None,
) -> Result[Milestone, MilestoneError]:
    if isinstance(event_name, str):
        event_name = event_name.strip()
    if isinstance(new_event_name, str):
        new_event_name = new_event_name.strip()
    if not event_name:
        return Err(MilestoneError("Event name is required", 400))

    if (
        new_event_name is None
        and new_timestamp is None
        and new_timezone is None
        and new_color is None
    ):
        return Err(
            MilestoneError(
                "At least one field (new_event_name, new_timestamp, new_timezone, new_color) must be provided",
                400,
            )
        )

    try:
        milestone = Milestone.objects.filter(
            event_name=event_name,
            created_by=owner,
            deleted_at__isnull=True,
        ).first()
        if not milestone:
            return Err(
                MilestoneError(
                    f"Milestone '{event_name}' not found for user '{owner.username}'",
                    404,
                )
            )

        if (
            new_event_name is not None
            and Milestone.objects.filter(
                created_by=owner,
                event_name=new_event_name,
                deleted_at__isnull=True,
            )
            .exclude(pk=milestone.pk)
            .exists()
        ):
            return Err(
                MilestoneError(
                    f"Milestone with name '{new_event_name}' already exists",
                    400,
                )
            )

        if new_event_name is not None:
            milestone.event_name = new_event_name
        if new_timestamp is not None:
            try:
                timestamp_seconds = new_timestamp / 1000
                milestone.event_datetime_utc = datetime.fromtimestamp(
                    timestamp_seconds, tz=tz.utc
                )
            except (TypeError, ValueError, OverflowError, OSError) as e:
                return Err(MilestoneError(f"Invalid timestamp: {str(e)}", 400))
        if new_timezone is not None:
            milestone.event_timezone = new_timezone
        if new_color is not None:
            milestone.color = new_color

        received_at = django_timezone.now()
        milestone.updated_at = received_at
        milestone.server_received_at = received_at
        milestone.save()
        return Ok(milestone)
    except ValidationError as e:
        return Err(
            MilestoneError(f"Invalid data: {e.message_dict or str(e)}", 400)
        )
    except IntegrityError as e:
        if "unique" in str(e).lower():
            return Err(
                MilestoneError(
                    f"Milestone with name '{event_name}' already exists",
                    400,
                )
            )
        return Err(MilestoneError(f"Constraint violation {str(e)}", 400))
    except Exception as e:
        print(e)
        return Err(MilestoneError(f"Error creating milestone: {str(e)}", 500))


def update_milestone_response(
    owner: MilestoneUser,
    event_name: str | None,
    new_event_name: str | None = None,
    new_timestamp: int | None = None,
    new_timezone: str | None = None,
    new_color: str | None = None,
):
    result = update_milestone(
        owner,
        event_name,
        new_event_name,
        new_timestamp,
        new_timezone,
        new_color,
    )
    if result.is_err:
        error = result.unwrap_err()
        return Response({"error": error.error}, status=error.status)
    milestone = result.unwrap()
    return Response(
        {
            "id": milestone.id,  # type: ignore
            "event_name": milestone.event_name,
            "event_datetime_utc": milestone.event_datetime_utc,
            "event_timezone": milestone.event_timezone,
            "color": milestone.color,
            "created_by": milestone.created_by.username,
            "created": milestone.created,
        },
        status=200,
    )


def delete_milestone(
    owner: MilestoneUser, event_name: str
) -> MilestoneError | None:
    if not event_name:
        return MilestoneError("Event name is required", 400)

    try:
        milestone = Milestone.objects.filter(
            event_name=event_name,
            created_by=owner,
            deleted_at__isnull=True,
        ).first()
        if not milestone:
            return MilestoneError(
                f"Milestone '{event_name}' not found for user '{owner.username}'",
                404,
            )

        milestone.soft_delete()
        return None
    except Exception as e:
        return MilestoneError(f"Error deleting milestone: {str(e)}", 500)


def delete_milestone_response(owner: MilestoneUser, event_name: str):
    error = delete_milestone(owner, event_name)
    if error:
        return Response({"error": error.error}, status=error.status)

    return Response(status=204)
