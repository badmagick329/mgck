from datetime import datetime

from drf_yasg import openapi
from rest_framework import serializers


class GfysListSerializer(serializers.BaseSerializer):
    class Meta:
        swagger_schema_fields = {
            "type": openapi.TYPE_OBJECT,
            "properties": {
                "imgur_id": openapi.Schema(
                    description="The imgur id of the gfy",
                    type=openapi.TYPE_STRING,
                ),
                "gfy_id": openapi.Schema(
                    description="The gfy id of the gfy",
                    type=openapi.TYPE_STRING,
                ),
                "imgur_url": openapi.Schema(
                    description="The imgur url of the gfy",
                    type=openapi.TYPE_STRING,
                ),
                "tags": openapi.Schema(
                    description="The tags belonging to the gfy",
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_STRING),
                ),
                "imgur_title": openapi.Schema(
                    description="The imgur title of the gfy",
                    type=openapi.TYPE_STRING,
                ),
                "gfy_title": openapi.Schema(
                    description="The gfy title of the gfy",
                    type=openapi.TYPE_STRING,
                ),
                "date": openapi.Schema(
                    description="The date of the gfy (YYYY-MM-DD)",
                    type=openapi.TYPE_STRING,
                ),
                "account": openapi.Schema(
                    description="The account name belonging to the gfy",
                    type=openapi.TYPE_STRING,
                ),
            },
            "example": [
                {
                    "imgur_id": "imgur_id",
                    "gfy_id": "gfy_id",
                    "tags": ["tag1", "tag2"],
                    "imgur_title": "imgur_title",
                    "gfy_title": "gfy_title",
                    "date": "2021-01-01",
                    "account": "account",
                },
            ],
        }

    def to_representation(self, instance):
        return {
            "imgur_id": instance.imgur_id,
            "gfy_id": instance.gfy_id,
            "tags": [tag.name for tag in instance.tags.all()],
            "imgur_title": instance.imgur_title,
            "gfy_title": instance.gfy_title,
            "date": instance.date,
            "account": instance.account.name if instance.account else None,
            "width": instance.width,
            "height": instance.height,
        }


class KpopComebackListSerializer(serializers.BaseSerializer):
    class Meta:
        swagger_schema_fields = {
            "type": openapi.TYPE_OBJECT,
            "properties": {
                "title": openapi.Schema(
                    description="The title of the comeback",
                    type=openapi.TYPE_STRING,
                ),
                "artist": openapi.Schema(
                    description="The artist of the comeback",
                    type=openapi.TYPE_STRING,
                ),
                "date": openapi.Schema(
                    description="The date of the comeback (YYYY-MM-DD)",
                    type=openapi.TYPE_STRING,
                ),
                "urls": openapi.Schema(
                    description="The video urls for the comeback",
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_STRING),
                ),
            },
            "example": [
                {
                    "title": "title",
                    "artist": "artist",
                    "date": "2021-01-01",
                    "video_url": [
                        "https://www.youtube.com/watch?v=video_id",
                        "https://www.youtube.com/watch?v=video_id2",
                    ],
                },
            ],
        }

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "title": instance.title,
            "artist": instance.artist.name,
            "date": datetime.strftime(instance.release_date, "%Y-%m-%d"),
            "album": instance.album,
            "release_type": instance.release_type.name,
            "urls": instance.urls,
        }
