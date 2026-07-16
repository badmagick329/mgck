from api.apps import ApiConfig
from api.serializers import KpopComebackListSerializer, KpopWatchlistQuerySerializer
from django.conf import settings
from django.core.paginator import EmptyPage, Paginator
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from kpopcomebacks.utils import (
    filter_comebacks,
    filter_comebacks_by_artist_public_ids,
)
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

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
            openapi.Parameter(
                name="page_size",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Optional page size override for this result window",
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
            self.request.query_params.get("exact", "") != "",
        )
        return comebacks


class KpopWatchlistQuery(APIView):
    throttle_classes = [KpopComebackListThrottle]

    @swagger_auto_schema(
        operation_description="Get paginated K-pop releases for a watchlist.",
        request_body=KpopWatchlistQuerySerializer,
    )
    def post(self, request):
        query_serializer = KpopWatchlistQuerySerializer(data=request.data)
        query_serializer.is_valid(raise_exception=True)
        query = query_serializer.validated_data
        comebacks = filter_comebacks_by_artist_public_ids(
            query["artist_public_ids"],
            query.get("start_date"),
            query.get("end_date"),
        )
        paginator = Paginator(comebacks, query["page_size"])

        try:
            page = paginator.page(query["page"])
        except EmptyPage:
            return Response(
                {"page": ["This page contains no results."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serialized_comebacks = KpopComebackListSerializer(
            page.object_list,
            many=True,
        )
        return Response(
            {
                "count": paginator.count,
                "previous": None,
                "next": None,
                "total_pages": paginator.num_pages,
                "results": serialized_comebacks.data,
            }
        )
