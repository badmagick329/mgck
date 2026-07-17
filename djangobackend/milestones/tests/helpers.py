import json
from urllib.parse import quote

from django.test import Client

INTERNAL_API_KEY = "test-next-django-internal-key-at-least-32-characters"


def internal_auth_headers(username="testuser", user_id=None, key=None):
    return {
        "HTTP_AUTHORIZATION": f"Bearer {key or INTERNAL_API_KEY}",
        "HTTP_X_MGCK_CORE_USER_ID": quote(
            user_id or f"core-{username}", safe=""
        ),
        "HTTP_X_MGCK_CORE_USERNAME": quote(username, safe=""),
    }


class MilestoneClient(Client):
    def _authentication(self, data):
        username = "authenticated-user"
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
                username = parsed.get("username") or username
            except json.JSONDecodeError:
                pass
        elif data is not None:
            username = data.get("username") or username
        return internal_auth_headers(username=username)

    def get(self, path, data=None, **extra):
        for key, value in self._authentication(data).items():
            extra.setdefault(key, value)
        return super().get(path, data, **extra)

    def post(self, path, data=None, content_type=None, **extra):
        for key, value in self._authentication(data).items():
            extra.setdefault(key, value)
        return super().post(path, data, content_type, **extra)

    def patch(self, path, data=None, content_type=None, **extra):
        for key, value in self._authentication(data).items():
            extra.setdefault(key, value)
        return super().patch(path, data, content_type, **extra)

    def delete(self, path, data=None, content_type=None, **extra):
        for key, value in self._authentication(data).items():
            extra.setdefault(key, value)
        return super().delete(path, data, content_type, **extra)
