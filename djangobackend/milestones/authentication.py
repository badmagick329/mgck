from dataclasses import dataclass

import jwt
from django.conf import settings
from rest_framework.authentication import (
    BaseAuthentication,
    get_authorization_header,
)
from rest_framework.exceptions import AuthenticationFailed

NAME_IDENTIFIER_CLAIM = (
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
)
NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"


@dataclass(frozen=True)
class CorePrincipal:
    user_id: str
    username: str

    @property
    def is_authenticated(self):
        return True


class CoreJWTAuthentication(BaseAuthentication):
    keyword = b"bearer"

    def authenticate(self, request):
        authorization = get_authorization_header(request).split()
        if not authorization:
            return None
        if authorization[0].lower() != self.keyword or len(authorization) != 2:
            raise AuthenticationFailed("Invalid authorization header")

        if not all(
            [
                settings.CORE_JWT_SIGNING_KEY,
                settings.CORE_JWT_ISSUER,
                settings.CORE_JWT_AUDIENCE,
            ]
        ):
            raise AuthenticationFailed("Authentication is not configured")

        try:
            token = authorization[1].decode("utf-8")
            claims = jwt.decode(
                token,
                settings.CORE_JWT_SIGNING_KEY,
                algorithms=["HS256"],
                issuer=settings.CORE_JWT_ISSUER,
                audience=settings.CORE_JWT_AUDIENCE,
                leeway=0,
                options={
                    "require": ["exp", NAME_IDENTIFIER_CLAIM, NAME_CLAIM]
                },
            )
        except (UnicodeError, jwt.PyJWTError) as error:
            raise AuthenticationFailed("Invalid or expired token") from error

        user_id = claims.get(NAME_IDENTIFIER_CLAIM)
        username = claims.get(NAME_CLAIM)
        if not isinstance(user_id, str) or not user_id.strip():
            raise AuthenticationFailed("Invalid account identity")
        if not isinstance(username, str) or not username.strip():
            raise AuthenticationFailed("Invalid account identity")
        if len(user_id) > 255 or len(username) > 255:
            raise AuthenticationFailed("Invalid account identity")

        return CorePrincipal(user_id.strip(), username.strip()), token

    def authenticate_header(self, request):
        return "Bearer"
