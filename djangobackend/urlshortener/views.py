import re

from rest_framework.decorators import api_view
from rest_framework.response import Response

from urlshortener.apps import UrlshortenerConfig
from urlshortener.models import ShortURL

app_name = UrlshortenerConfig.name


@api_view(["POST"])
def shorten_api(request):
    if request.method != "POST":
        return Response({"error": "Method not allowed"}, status=405)
    source_url = request.data.get("source_url", "").strip()
    custom_id = request.data.get("custom_id", "").strip()
    username = request.data.get("username", "").strip()

    if not username:
        return Response({"error": "Username is required"}, status=400)

    invalid_message = ShortURL.validate_url(source_url)
    if invalid_message:
        return Response({"error": invalid_message}, status=400)

    is_short_url = ShortURL.is_short_url(source_url)
    if is_short_url:
        return Response(
            {"error": "Shortened URLs cannot be shortened again"}, status=400
        )

    if custom_id:
        url_id = ShortURL.generate_custom_id(custom_id)
    else:
        url_id = ShortURL.generate_id()

    if isinstance(url_id, Exception):
        return Response({"error": str(url_id)}, status=400)

    short_url = ShortURL.objects.create(
        url=source_url, short_id=url_id, created_by=username
    )
    return Response(
        {
            "url": short_url.redirect_url,
        }
    )


@api_view(["GET"])
def target_url_api(request, short_id: str):
    if not short_id:
        return Response({"error": f"{short_id} is not a valid short URL"}, status=400)
    short_url = ShortURL.objects.filter(short_id=short_id).first()
    if not short_url:
        return Response({"error": f"Shortened ID '{short_id}' not found"}, status=404)
    url = short_url.url
    short_url.visit()
    if not re.match(r"^https?://", url):
        url = f"http://{url}"
    return Response(
        {
            "url": url,
        }
    )
