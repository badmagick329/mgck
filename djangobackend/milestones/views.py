from rest_framework.decorators import api_view
from rest_framework.response import Response

from milestones.apps import MilestonesConfig
from milestones.utils import (
    create_milestone_response,
    delete_milestone_response,
    get_all_milestones_response,
    update_milestone_response,
)

app_name = MilestonesConfig.name


@api_view(["GET", "POST"])
def milestones(request):
    if request.method == "GET":
        return handle_list(request)

    if request.method == "POST":
        return handle_post(request)
    return Response({"error": "Method not allowed"}, status=405)


@api_view(["PATCH", "DELETE"])
def modify_milestone(request, event_name):
    if request.method == "PATCH":
        return handle_update(request, event_name)

    if request.method == "DELETE":
        return handle_delete(request, event_name)

    return Response({"error": "Method not allowed"}, status=405)


def handle_list(request):
    """
    List all milestones.

    Returns:
    [
        {
            "id": int,
            "event_name": str,
            "event_datetime_utc": datetime,
            "event_timezone": str,
            "created": datetime
        },
        ...
    ]
    """
    username = request.GET.get("username", "").strip()
    return get_all_milestones_response(username)


def handle_post(request):
    """
    Create a new milestone.

    Expected JSON body:
    {
        "timestamp": int (JavaScript milliseconds),
        "timezone": str (IANA timezone string),
        "username": str,
        "event_name": str
    }
    """
    data = request.data
    timestamp = data.get("timestamp")
    timezone = data.get("timezone")
    username = data.get("username")
    event_name = data.get("event_name")

    return create_milestone_response(timestamp, timezone, username, event_name)


def handle_update(request, event_name: str):
    """
    Update a milestone by username and event_name.

    Expected JSON body:
    {
        "username": str (identifier),
        "event_name": str (identifier),
        "new_event_name": str (optional),
        "new_timestamp": int (optional, JavaScript milliseconds),
        "new_timezone": str (optional)
    }

    At least one of new_event_name, new_timestamp, or new_timezone must be provided.
    """
    data = request.data
    username = data.get("username")
    new_event_name = data.get("new_event_name")
    new_timestamp = data.get("new_timestamp")
    new_timezone = data.get("new_timezone")

    return update_milestone_response(
        username, event_name, new_event_name, new_timestamp, new_timezone
    )


def handle_delete(request, event_name: str):
    """
    Delete a milestone by username and event_name.

    Expected JSON body:
    {
        "username": str,
        "event_name": str
    }
    """
    data = request.data
    username = data.get("username")

    return delete_milestone_response(username, event_name)
