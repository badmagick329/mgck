from datetime import datetime
from datetime import timezone as tz
from typing import Any

from core.error import Error
from core.result import Err, Ok, Result
from rest_framework.response import Response

from milestones.models import Milestone, MilestoneUser


class MilestoneError(Error):
    status: int

    def __init__(self, error: str, status: int):
        super().__init__(error)
        self.status = status


def create_milestone(
    timestamp: int, timezone: str, username: str, event_name: str
) -> Result[Milestone, MilestoneError]:
    if not username:
        return Err(MilestoneError("Username is required", 400))
    if not event_name:
        return Err(MilestoneError("Event name is required", 400))
    if not timezone:
        return Err(MilestoneError("Timezone is required", 400))
    if timestamp is None:
        return Err(MilestoneError("Timestamp is required", 400))

    try:
        timestamp_seconds = timestamp / 1000
        event_datetime = datetime.fromtimestamp(timestamp_seconds, tz=tz.utc)

        milestone_user, _ = MilestoneUser.objects.get_or_create(username=username)

        milestone = Milestone.objects.create(
            event_timezone=timezone,
            event_datetime_utc=event_datetime,
            event_name=event_name,
            created_by=milestone_user,
        )
        return Ok(milestone)
    except ValueError as e:
        return Err(MilestoneError(f"Invalid timestamp: {str(e)}", 400))
    except Exception as e:
        if "unique constraint" in str(e).lower():
            return Err(
                MilestoneError(
                    f"Milestone with name '{event_name}' already exists for this user",
                    400,
                )
            )
        return Err(MilestoneError(f"Error creating milestone: {str(e)}", 500))


def create_milestone_response(
    timestamp: int, timezone: str, username: str, event_name: str
):
    result = create_milestone(timestamp, timezone, username, event_name)
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
            "created_by": milestone.created_by.username,
            "created": milestone.created,
        },
        status=201,
    )


def get_all_milestones(username: str) -> Result[list[dict[str, Any]], MilestoneError]:
    try:
        milestones = Milestone.objects.filter(created_by__username=username)
        milestones_data = [
            {
                "id": milestone.id,  # type: ignore
                "event_name": milestone.event_name,
                "event_datetime_utc": milestone.event_datetime_utc,
                "event_timezone": milestone.event_timezone,
                "created": milestone.created,
            }
            for milestone in milestones
        ]
        return Ok(milestones_data)
    except Exception as e:
        return Err(MilestoneError(f"Error fetching milestones: {str(e)}", 500))


def get_all_milestones_response(username: str):
    result = get_all_milestones(username)
    if result.is_err:
        error = result.unwrap_err()
        return Response({"error": error.error}, status=error.status)

    milestones = result.unwrap()
    return Response(milestones, status=200)


def update_milestone(
    username: str,
    event_name: str,
    new_event_name: str | None = None,
    new_timestamp: int | None = None,
    new_timezone: str | None = None,
) -> Result[Milestone, MilestoneError]:
    if not username:
        return Err(MilestoneError("Username is required", 400))
    if not event_name:
        return Err(MilestoneError("Event name is required", 400))

    if new_event_name is None and new_timestamp is None and new_timezone is None:
        return Err(
            MilestoneError(
                "At least one field (new_event_name, new_timestamp, new_timezone) must be provided",
                400,
            )
        )

    try:
        milestone_user = MilestoneUser.objects.filter(username=username).first()
        if not milestone_user:
            return Err(MilestoneError(f"User '{username}' not found", 404))

        milestone = Milestone.objects.filter(
            event_name=event_name, created_by=milestone_user
        ).first()
        if not milestone:
            return Err(
                MilestoneError(
                    f"Milestone '{event_name}' not found for user '{username}'",
                    404,
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
            except ValueError as e:
                return Err(MilestoneError(f"Invalid timestamp: {str(e)}", 400))
        if new_timezone is not None:
            milestone.event_timezone = new_timezone

        milestone.save()
        return Ok(milestone)
    except Exception as e:
        if "unique constraint" in str(e).lower():
            return Err(
                MilestoneError(
                    f"Milestone with name '{new_event_name}' already exists for this user",
                    400,
                )
            )
        return Err(MilestoneError(f"Error updating milestone: {str(e)}", 500))


def update_milestone_response(
    username: str,
    event_name: str,
    new_event_name: str | None = None,
    new_timestamp: int | None = None,
    new_timezone: str | None = None,
):
    result = update_milestone(
        username, event_name, new_event_name, new_timestamp, new_timezone
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
            "created_by": milestone.created_by.username,
            "created": milestone.created,
        },
        status=200,
    )


def delete_milestone(username: str, event_name: str) -> MilestoneError | None:
    if not username:
        return MilestoneError("Username is required", 400)
    if not event_name:
        return MilestoneError("Event name is required", 400)

    try:
        milestone_user = MilestoneUser.objects.filter(username=username).first()
        if not milestone_user:
            return MilestoneError(f"User '{username}' not found", 404)

        milestone = Milestone.objects.filter(
            event_name=event_name, created_by=milestone_user
        ).first()
        if not milestone:
            return MilestoneError(
                f"Milestone '{event_name}' not found for user '{username}'",
                404,
            )

        milestone.delete()
        return None
    except Exception as e:
        return MilestoneError(f"Error deleting milestone: {str(e)}", 500)


def delete_milestone_response(username: str, event_name: str):
    error = delete_milestone(username, event_name)
    if error:
        return Response({"error": error.error}, status=error.status)

    return Response(status=204)
