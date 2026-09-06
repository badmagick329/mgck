from datetime import datetime, time, timedelta, timezone

from django.db import DatabaseError, transaction
from django.db.models import Count, Q, Sum, OuterRef, Subquery
from django.db.models.functions import TruncDate
from rest_framework import serializers
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from emojify.ai import AiUnavailable, generate
from emojify.authentication import AiAuthentication, AiAdminPermission, AiUserPermission
from emojify.models import AiControl, AiUsage


class GenerateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=1500, allow_blank=True, trim_whitespace=False)
    frequent = serializers.BooleanField()


class DatesSerializer(serializers.Serializer):
    start = serializers.DateField()
    end = serializers.DateField()

    def validate(self, attrs):
        if attrs["start"] > attrs["end"] or attrs["end"].year == 9999:
            raise serializers.ValidationError("Invalid date range")
        return attrs


class ControlSerializer(serializers.Serializer):
    enabled = serializers.BooleanField()


@api_view(["POST"])
@authentication_classes([AiAuthentication])
@permission_classes([AiUserPermission])
def generate_view(request):
    serializer = GenerateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    text = serializer.validated_data["text"]
    if not text.strip():
        text = "You have to give me some text to emojify"
    try:
        output = generate(request.user, text, serializer.validated_data["frequent"])
    except DatabaseError:
        raise AiUnavailable()
    return Response({"text": output})


@api_view(["PATCH"])
@authentication_classes([AiAuthentication])
@permission_classes([AiAdminPermission])
def control_view(request):
    serializer = ControlSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        control = AiControl.objects.select_for_update().get(pk=1)
        control.enabled = serializer.validated_data["enabled"]
        control.updated_by = request.user.user_id
        control.save()
    return Response({"enabled": control.enabled})


@api_view(["GET"])
@authentication_classes([AiAuthentication])
@permission_classes([AiAdminPermission])
def usage_view(request):
    serializer = DatesSerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    start = datetime.combine(serializer.validated_data["start"], time.min, timezone.utc)
    end = datetime.combine(serializer.validated_data["end"] + timedelta(days=1), time.min, timezone.utc)
    latest_name = AiUsage.objects.filter(user_id=OuterRef("user_id")).order_by("-started_at").values("username")[:1]
    rows = list(AiUsage.objects.filter(started_at__gte=start, started_at__lt=end)
        .annotate(day=TruncDate("started_at", tzinfo=timezone.utc))
        .values("day", "user_id")
        .annotate(username=Subquery(latest_name), requests=Count("id"),
            succeeded=Count("id", filter=Q(status="succeeded")),
            failed=Count("id", filter=Q(status="failed")),
            pending=Count("id", filter=Q(status="pending")),
            characters=Sum("input_characters"), prompt_tokens=Sum("prompt_tokens"),
            output_tokens=Sum("output_tokens"), total_tokens=Sum("total_tokens"))
        .order_by("-day", "-requests", "user_id"))
    return Response({"enabled": AiControl.objects.get(pk=1).enabled, "rows": rows})
