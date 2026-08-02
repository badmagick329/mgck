from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request

from djangobackend.internal_authentication import NextServiceAuthentication
from urlshortener.utils import (
    create_shortened_url_response,
    delete_shortened_url_response,
    get_shortened_urls_list_response,
)


@api_view(["GET", "POST"])
@authentication_classes([NextServiceAuthentication])
@permission_classes([IsAuthenticated])
def urls(request: Request):
    if request.method == "GET":
        return get_shortened_urls_list_response(request.user.username)
    return create_shortened_url_response(
        source_url=request.data.get("source_url", "").strip(),
        custom_id=request.data.get("custom_id", "").strip(),
        username=request.user.username,
        include_record=True,
    )


@api_view(["DELETE"])
@authentication_classes([NextServiceAuthentication])
@permission_classes([IsAuthenticated])
def url(request: Request, short_id: str):
    return delete_shortened_url_response(short_id, request.user.username)
