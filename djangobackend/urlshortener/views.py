from rest_framework.decorators import api_view
from rest_framework.response import Response

from urlshortener.apps import UrlshortenerConfig
from urlshortener.utils import (
    create_shortened_url_response,
    delete_shortened_url_response,
    get_shortened_url_target_response,
    get_shortened_urls_list_response,
)

app_name = UrlshortenerConfig.name


@api_view(["POST"])
def shorten_url(request):
    if request.method != "POST":
        return Response({"error": "Method not allowed"}, status=405)
    source_url = request.data.get("source_url", "").strip()
    custom_id = request.data.get("custom_id", "").strip()
    username = request.data.get("username", "").strip()

    return create_shortened_url_response(
        source_url=source_url, custom_id=custom_id, username=username
    )


@api_view(["GET"])
def shortened_url_target(request, short_id: str):
    return get_shortened_url_target_response(short_id)


@api_view(["POST"])
def get_urls(request):
    if request.method != "POST":
        return Response({"error": "Method not allowed"}, status=405)

    username = request.data.get("username", "").strip()
    return get_shortened_urls_list_response(username)


@api_view(["GET", "POST"])
def urls(request):
    print(request.method)
    if request.method == "GET":
        username = request.GET.get("username", "").strip()
        return get_shortened_urls_list_response(username)

    if request.method == "POST":
        source_url = request.data.get("source_url", "").strip()
        custom_id = request.data.get("custom_id", "").strip()
        username = request.data.get("username", "").strip()

        return create_shortened_url_response(
            source_url=source_url, custom_id=custom_id, username=username
        )

    return Response({"error": "Method not allowed"}, status=405)


@api_view(["GET", "DELETE"])
def url(request, short_id):
    if request.method == "GET":
        return get_shortened_url_target_response(short_id)
    if request.method == "DELETE":
        username = request.GET.get("username", "").strip()
        return delete_shortened_url_response(short_id, username)

    return Response({"error": "Method not allowed"}, status=405)
