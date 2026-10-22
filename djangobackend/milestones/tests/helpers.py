from urllib.parse import quote

INTERNAL_API_KEY = "test-next-django-internal-key-at-least-32-characters"


def internal_auth_headers(username="testuser", user_id=None, key=None):
    return {
        "HTTP_AUTHORIZATION": f"Bearer {key or INTERNAL_API_KEY}",
        "HTTP_X_MGCK_CORE_USER_ID": quote(
            user_id or f"core-{username}", safe=""
        ),
        "HTTP_X_MGCK_CORE_USERNAME": quote(username, safe=""),
    }
