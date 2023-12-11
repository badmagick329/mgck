from api.apps import ApiConfig
from api.serializers import GfysListSerializer
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from gfys.models import Account, Gfy
from gfys.utils import filter_gfys
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

app_name = ApiConfig.name
CACHE_TTL = settings.API_CACHE_TTL


class GfyDetailsThrottle(UserRateThrottle):
    rate = "120/minute"


class AccountsList(APIView):
    throttle_classes = [GfyDetailsThrottle]

    @method_decorator(cache_page(CACHE_TTL))
    def get(self, request, *args, **kwargs):
        return Response(
            {
                "accounts": [
                    account.name
                    for account in Account.objects.all().order_by("name")
                ]
            }
        )


class GfyDetails(APIView):
    throttle_classes = [GfyDetailsThrottle]

    @method_decorator(cache_page(CACHE_TTL))
    @swagger_auto_schema(
        operation_description="Get video of gif",
        manual_parameters=[
            openapi.Parameter(
                name="id",
                in_=openapi.IN_PATH,
                type=openapi.TYPE_STRING,
                description="The imgur id of the gfy",
            ),
        ],
        responses={
            200: openapi.Response(
                description="Video of gif",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "title": openapi.Schema(
                            description="The imgur title of the gfy",
                            type=openapi.TYPE_STRING,
                        ),
                        "tags": openapi.Schema(
                            description="The tags belonging to the gfy",
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Items(type=openapi.TYPE_STRING),
                        ),
                        "date": openapi.Schema(
                            description="The date mentioned in the gfy (YYYY-MM-DD)",
                            type=openapi.TYPE_STRING,
                        ),
                        "account": openapi.Schema(
                            description="The account name belonging to the gfy",
                            type=openapi.TYPE_STRING,
                        ),
                        "video_url": openapi.Schema(
                            description="The video url of the gfy",
                            type=openapi.TYPE_STRING,
                        ),
                    },
                    example={
                        "title": "gfy title",
                        "tags": ["tag1", "tag2"],
                        "date": "2021-01-01",
                        "account": "account",
                        "video_url": "https://i.imgur.com/imgur_id.mp4",
                    },
                ),
            ),
            404: openapi.Response(description="Gfy not found"),
        },
    )
    def get(self, request, *args, **kwargs):
        nextGfy = Gfy.objects.filter(imgur_id=kwargs["id"]).first()
        if nextGfy is None:
            return Response(status=404)
        return Response(
            {
                "title": nextGfy.imgur_title,
                "tags": nextGfy.tags.all().values_list("name", flat=True),
                "date": nextGfy.date,
                "account": nextGfy.account.name,
                "video_url": id_to_imgur_mp4(nextGfy.imgur_id),
            }
        )


def id_to_imgur_mp4(id: str):
    return f"https://i.imgur.com/{id}.mp4"


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
        print(f"query_params: {self.request.query_params}")
        gfys = filter_gfys(
            self.request.query_params.get("title", ""),
            self.request.query_params.get("tags", ""),
            self.request.query_params.get("start_date", ""),
            self.request.query_params.get("end_date", ""),
            self.request.query_params.get("account", ""),
        )
        return gfys
