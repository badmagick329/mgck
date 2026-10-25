from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

# Must match the mount point of fileuploader.urls in djangobackend/urls.py.
FILES_PATH_PREFIX = "/files/"


class FilesNoIndexMiddleware:
    """Keep every Django-served `/files/` response out of search indexes.

    The header goes on in middleware rather than templates so redirects, 404s
    and the login page's `?next=` variants (flagged as duplicates by Search
    Console) are covered too. robots.txt must keep allowing these paths, or
    crawlers never fetch the responses that carry the header.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        if is_files_path(request.path):
            response["X-Robots-Tag"] = "noindex, nofollow"
        return response


def is_files_path(path: str) -> bool:
    return path == FILES_PATH_PREFIX.rstrip("/") or path.startswith(
        FILES_PATH_PREFIX
    )
