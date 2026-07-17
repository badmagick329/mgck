import re
import secrets
from dataclasses import dataclass
from urllib.parse import unquote_to_bytes

from django.conf import settings
from rest_framework.authentication import (
    BaseAuthentication,
    get_authorization_header,
)
from rest_framework.exceptions import APIException, AuthenticationFailed

INVALID_PERCENT_ESCAPE = re.compile(r"%(?![0-9A-Fa-f]{2})")


class InternalAuthenticationNotConfigured(APIException):
    status_code = 503
    default_detail = "Internal authentication unavailable"
    default_code = "internal_authentication_unavailable"


@dataclass(frozen=True)
class CorePrincipal:
    user_id: str
    username: str

    @property
    def is_authenticated(self):
        return True


class NextServiceAuthentication(BaseAuthentication):
    keyword = b"bearer"

    def authenticate(self, request):
        configured_key = settings.NEXT_DJANGO_INTERNAL_API_KEY
        if not isinstance(configured_key, str) or len(configured_key) < 32:
            raise InternalAuthenticationNotConfigured()

        authorization = get_authorization_header(request).split()
        if len(authorization) != 2 or authorization[0].lower() != self.keyword:
            raise AuthenticationFailed("Invalid internal authentication")

        try:
            supplied_key = authorization[1].decode("ascii")
        except UnicodeError as error:
            raise AuthenticationFailed(
                "Invalid internal authentication"
            ) from error
        if not secrets.compare_digest(supplied_key, configured_key):
            raise AuthenticationFailed("Invalid internal authentication")

        user_id = self._decode_identity(
            request.headers.get("X-MGCK-Core-User-Id")
        )
        username = self._decode_identity(
            request.headers.get("X-MGCK-Core-Username")
        )
        return CorePrincipal(user_id=user_id, username=username), None

    def authenticate_header(self, request):
        return "Bearer"

    @staticmethod
    def _decode_identity(value):
        if not isinstance(value, str) or INVALID_PERCENT_ESCAPE.search(value):
            raise AuthenticationFailed("Invalid internal identity")
        try:
            decoded = unquote_to_bytes(value).decode("utf-8").strip()
        except UnicodeError as error:
            raise AuthenticationFailed("Invalid internal identity") from error
        if (
            not decoded
            or len(decoded) > 255
            or any(
                ord(character) < 32 or ord(character) == 127
                for character in decoded
            )
        ):
            raise AuthenticationFailed("Invalid internal identity")
        return decoded
