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
        url=source_url, short_id=url_id, created_by=username, accessed=None
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


@api_view(["POST"])
def get_urls(request):
    if request.method != "POST":
        return Response({"error": "Method not allowed"}, status=405)

    username = request.data.get("username", "").strip()
    if not username:
        return Response({"error": "Username is required"}, status=400)
    short_urls = ShortURL.objects.filter(created_by=username).order_by("-created")
    urls = [
        {
            "url": url.url,
            "short_id": url.short_id,
            "created": url.created,
            "accessed": url.accessed,
            "number_of_uses": url.number_of_uses,
        }
        for url in short_urls
    ]
    return Response(urls)


@api_view(["GET", "POST"])
def urls(request):
    if request.method not in ["GET", "POST"]:
        return Response({"error": "Method not allowed"}, status=405)

    if request.method == "GET":
        username = request.GET.get("username", "").strip()
        short_id = request.GET.get("short_id", "").strip()

        if not username:
            return Response({"error": "Username is required"}, status=400)

        if not short_id:
            short_urls = ShortURL.objects.filter(created_by=username).order_by(
                "-created"
            )
            urls = [
                {
                    "url": url.url,
                    "short_id": url.short_id,
                    "created": url.created,
                    "accessed": url.accessed,
                    "number_of_uses": url.number_of_uses,
                }
                for url in short_urls
            ]
            return Response(urls)
        else:
            short_url = ShortURL.objects.filter(short_id=short_id).first()
            if not short_url:
                return Response(
                    {"error": f"Shortened ID '{short_id}' not found"}, status=404
                )
            url = short_url.url
            short_url.visit()
            if not re.match(r"^https?://", url):
                url = f"http://{url}"
            return Response(
                {
                    "url": url,
                }
            )

    if request.method == "POST":
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
            url=source_url, short_id=url_id, created_by=username, accessed=None
        )
        return Response(
            {
                "url": short_url.redirect_url,
            }
        )

    return Response({"error": "Method not allowed"}, status=405)


@api_view(["GET", "DELETE"])
def url(request, short_id):
    if request.method == "GET":
        short_url = ShortURL.objects.filter(short_id=short_id).first()
        if not short_url:
            return Response(
                {"error": f"Shortened ID '{short_id}' not found"}, status=404
            )
        url = short_url.url
        short_url.visit()
        if not re.match(r"^https?://", url):
            url = f"http://{url}"
        return Response(
            {
                "url": url,
            }
        )
    if request.method == "DELETE":
        username = request.GET.get("username", "").strip()
        short_url = ShortURL.objects.filter(short_id=short_id).first()
        if not short_url:
            return Response(
                {"error": f"Shortened ID '{short_id}' not found"}, status=404
            )
        if short_url.created_by != username:
            return Response(
                {"error": "You do not have permission to delete this URL"}, status=403
            )
        short_url.delete()
        return Response(status=204)

    return Response({"error": "Method not allowed"}, status=405)
