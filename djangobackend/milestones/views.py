from django.db import transaction
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from djangobackend.internal_authentication import NextServiceAuthentication
from milestones.limits import MilestoneQuotaExceeded
from milestones.ownership import OwnerConflict, get_or_create_owner
from milestones.serializers import SyncSnapshotSerializer
from milestones.sync import SyncConflict, merge_snapshot


@api_view(["POST"])
@authentication_classes([NextServiceAuthentication])
@permission_classes([IsAuthenticated])
def sync_milestones(request: Request):
    serializer = SyncSnapshotSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    try:
        with transaction.atomic():
            owner = get_or_create_owner(request.user)
            records = merge_snapshot(owner, serializer.validated_data["records"])
            return Response({"records": records}, status=200)
    except (OwnerConflict, SyncConflict):
        return Response({"error": "Milestone sync conflict"}, status=409)
    except MilestoneQuotaExceeded as error:
        return Response(
            {"error": error.messages[0], "code": "record_limit"}, status=409
        )
