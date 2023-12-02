from drf_yasg import openapi
from rest_framework import serializers


class GfysListSerializer(serializers.BaseSerializer):
    class Meta:
        swagger_schema_fields = {
            "type": openapi.TYPE_OBJECT,
            "properties": {
                "imgur_id": openapi.Schema(
                    description="The imgur id of the gif",
                    type=openapi.TYPE_STRING,
                ),
                "gfy_id": openapi.Schema(
                    description="The gfy id of the gif",
                    type=openapi.TYPE_STRING,
                ),
                "imgur_url": openapi.Schema(
                    description="The imgur url of the gif",
                    type=openapi.TYPE_STRING,
                ),
                "tags": openapi.Schema(
                    description="The tags belonging to the gif",
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_STRING),
                ),
                "imgur_title": openapi.Schema(
                    description="The imgur title of the gif",
                    type=openapi.TYPE_STRING,
                ),
                "gfy_title": openapi.Schema(
                    description="The gfy title of the gif",
                    type=openapi.TYPE_STRING,
                ),
                "date": openapi.Schema(
                    description="The date of the gif (YYYY-MM-DD)",
                    type=openapi.TYPE_STRING,
                ),
                "account": openapi.Schema(
                    description="The account name belonging to the gif",
                    type=openapi.TYPE_STRING,
                ),
            },
            "example": [
                {
                    "imgur_id": "imgur_id",
                    "gfy_id": "gfy_id",
                    "imgur_url": "imgur_url",
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
            "imgur_url": instance.imgur_url,
            "tags": [tag.name for tag in instance.tags.all()],
            "imgur_title": instance.imgur_title,
            "gfy_title": instance.gfy_title,
            "date": instance.date,
            "account": instance.account.name if instance.account else None,
        }
