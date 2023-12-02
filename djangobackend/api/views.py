from api.apps import ApiConfig
from api.serializers import GfysListSerializer
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from gfys.utils import filter_gfys
from rest_framework import generics
from rest_framework.throttling import UserRateThrottle

app_name = ApiConfig.name
CACHE_TTL = settings.API_CACHE_TTL


class GfysListThrottle(UserRateThrottle):
    rate = "60/minute"


class GfysList(generics.ListAPIView):
    serializer_class = GfysListSerializer
    throttle_classes = [GfysListThrottle]

    @method_decorator(cache_page(CACHE_TTL))
    @swagger_auto_schema(
        operation_description="Get list of gifs",
        manual_parameters=[
            openapi.Parameter(
                name="title",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by title (case insensitive substring match)",
            ),
            openapi.Parameter(
                name="tags",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by tags (comma separated list of tags)",
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
                name="account",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by account name (case insensitive exact match)",
            ),
        ],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        gfys = filter_gfys(
            self.request.query_params.get("title", ""),
            self.request.query_params.get("tags", ""),
            self.request.query_params.get("start_date", ""),
            self.request.query_params.get("end_date", ""),
            self.request.query_params.get("account", ""),
        )
        return gfys
