import json
from datetime import datetime, timedelta, timezone

import jwt
from django.test import Client

from milestones.authentication import NAME_CLAIM, NAME_IDENTIFIER_CLAIM

JWT_SIGNING_KEY = "test-signing-key-test-signing-key-test-signing-key-1234"
JWT_ISSUER = "http://core.test"
JWT_AUDIENCE = "http://core.test"


def create_token(
    username="testuser",
    user_id=None,
    expires_at=None,
    issuer=JWT_ISSUER,
    audience=JWT_AUDIENCE,
    signing_key=JWT_SIGNING_KEY,
):
    return jwt.encode(
        {
            NAME_IDENTIFIER_CLAIM: user_id or f"core-{username}",
            NAME_CLAIM: username,
            "role": "User",
            "exp": expires_at
            or datetime.now(timezone.utc) + timedelta(minutes=30),
            "iss": issuer,
            "aud": audience,
        },
        signing_key,
        algorithm="HS256",
    )


class MilestoneClient(Client):
    def _authorization(self, data):
        username = "authenticated-user"
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
                username = parsed.get("username") or username
            except json.JSONDecodeError:
                pass
        elif data is not None:
            username = data.get("username") or username
        return f"Bearer {create_token(username=username)}"

    def get(self, path, data=None, **extra):
        extra.setdefault("HTTP_AUTHORIZATION", self._authorization(data))
        return super().get(path, data, **extra)

    def post(self, path, data=None, content_type=None, **extra):
        extra.setdefault("HTTP_AUTHORIZATION", self._authorization(data))
        return super().post(path, data, content_type, **extra)

    def patch(self, path, data=None, content_type=None, **extra):
        extra.setdefault("HTTP_AUTHORIZATION", self._authorization(data))
        return super().patch(path, data, content_type, **extra)

    def delete(self, path, data=None, content_type=None, **extra):
        extra.setdefault("HTTP_AUTHORIZATION", self._authorization(data))
        return super().delete(path, data, content_type, **extra)
