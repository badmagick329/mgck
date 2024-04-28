from api.apps import ApiConfig
from api.serializers import KpopComebackListSerializer
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from kpopcomebacks.utils import filter_comebacks
from rest_framework import generics
from rest_framework.throttling import UserRateThrottle

app_name = ApiConfig.name
CACHE_TTL = settings.API_CACHE_TTL


class KpopComebackListThrottle(UserRateThrottle):
    rate = "120/minute"


class KpopComebackList(generics.ListAPIView):
    serializer_class = KpopComebackListSerializer
    throttle_classes = [KpopComebackListThrottle]

    @method_decorator(cache_page(CACHE_TTL))
    @swagger_auto_schema(
        operation_description="Get list of kpopcomebacks",
        manual_parameters=[
            openapi.Parameter(
                name="artist",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by artist (case insensitive substring match)",
            ),
            openapi.Parameter(
                name="title",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by title (case insensitive substring match)",
            ),
            openapi.Parameter(
                name="start_date",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by start date (YYYY-MM-DD)",
            ),
            openapi.Parameter(
                name="end_date",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by end date (YYYY-MM-DD)",
            ),
            openapi.Parameter(
                name="exact",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                description="Filter by exact match",
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        comebacks = filter_comebacks(
            self.request.query_params.get("artist", ""),
            self.request.query_params.get("title", ""),
            self.request.query_params.get("start_date", ""),
            self.request.query_params.get("end_date", ""),
            self.request.query_params.get("exact", "") == "exact",
        )
        return comebacks
