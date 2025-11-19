import re
from typing import Any

from core.error import Error
from core.result import Err, Ok, Result
from rest_framework.response import Response

from urlshortener.models import ShortURL


class UrlShortenerError(Error):
    status: int

    def __init__(self, error: str, status: int):
        super().__init__(error)
        self.status = status


def create_shortened_url(
    source_url: str, custom_id: str, username: str
) -> Result[ShortURL, UrlShortenerError]:
    if not username:
        return Err(UrlShortenerError("Username is required", 400))

    invalid_message = ShortURL.validate_url(source_url)
    if invalid_message:
        return Err(UrlShortenerError(invalid_message, 400))

    is_short_url = ShortURL.is_short_url(source_url)
    if is_short_url:
        return Err(UrlShortenerError("Shortened URLs cannot be shortened again", 400))

    if custom_id:
        url_id = ShortURL.generate_custom_id(custom_id)
    else:
        url_id = ShortURL.generate_id()

    if isinstance(url_id, Exception):
        return Err(UrlShortenerError(str(url_id), 400))

    short_url = ShortURL.objects.create(
        url=source_url, short_id=url_id, created_by=username, accessed=None
    )
    return Ok(short_url)


def create_shortened_url_response(source_url: str, custom_id: str, username: str):
    result = create_shortened_url(
        source_url=source_url, custom_id=custom_id, username=username
    )
    if result.is_err:
        error = result.unwrap_err()
        return Response({"error": error.error}, status=error.status)

    shortened_url = result.unwrap()

    return Response(
        {
            "url": shortened_url.redirect_url,
        }
    )


def get_shortened_url_target(short_id: str) -> Result[str, UrlShortenerError]:
    if not short_id:
        return Err(UrlShortenerError("Short ID is required", 400))
    short_url = ShortURL.objects.filter(short_id=short_id).first()
    if not short_url:
        return Err(UrlShortenerError(f"Shortened ID '{short_id}' not found", 404))
    url = short_url.url
    short_url.register_visit()
    if not re.match(r"^https?://", url):
        url = f"http://{url}"
    return Ok(url)


def get_shortened_url_target_response(short_id: str):
    result = get_shortened_url_target(short_id=short_id)
    if result.is_err:
        error = result.unwrap_err()
        return Response({"error": error.error}, status=error.status)

    url = result.unwrap()

    return Response(
        {
            "url": url,
        }
    )


def get_shortened_urls_list(
    username: str,
) -> Result[list[dict[str, Any]], UrlShortenerError]:
    if not username:
        return Err(UrlShortenerError("Username is required", 400))
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
    return Ok(urls)


def get_shortened_urls_list_response(username: str):
    result = get_shortened_urls_list(username=username)
    if result.is_err:
        error = result.unwrap_err()
        return Response({"error": error.error}, status=error.status)

    urls = result.unwrap()
    return Response(urls)


def delete_shortened_url(short_id: str, username: str) -> UrlShortenerError | None:
    short_url = ShortURL.objects.filter(short_id=short_id).first()

    if not short_url:
        return UrlShortenerError(f"Shortened ID '{short_id}' not found", 404)
    if short_url.created_by != username:
        return UrlShortenerError("You do not have permission to delete this URL", 403)

    short_url.delete()


def delete_shortened_url_response(short_id: str, username: str):
    error = delete_shortened_url(short_id=short_id, username=username)
    if error:
        return Response({"error": error.error}, status=error.status)

    return Response(status=204)
