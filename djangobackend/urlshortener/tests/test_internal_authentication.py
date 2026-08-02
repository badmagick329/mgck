import json

import pytest
from django.test import Client
from django.urls import reverse

from milestones.tests.helpers import INTERNAL_API_KEY, internal_auth_headers
from urlshortener.models import ShortURL


@pytest.fixture(autouse=True)
def configure_internal_authentication(settings):
    settings.NEXT_DJANGO_INTERNAL_API_KEY = INTERNAL_API_KEY


@pytest.mark.django_db
class TestShortenerInternalAuthentication:
    def setup_method(self):
        self.client = Client()
        self.urls_url = reverse("urlshortener_internal:urls")

    def test_management_requires_the_next_service_key(self):
        assert self.client.get(self.urls_url).status_code == 401

    def test_request_username_cannot_choose_owner(self):
        response = self.client.post(
            self.urls_url,
            data=json.dumps(
                {
                    "source_url": "https://example.com",
                    "custom_id": "alice-link",
                    "username": "Bob",
                }
            ),
            content_type="application/json",
            **internal_auth_headers("Alice", "core-alice"),
        )
        assert response.status_code == 201
        assert ShortURL.objects.get(short_id="alice-link").created_by == "Alice"

    def test_delete_is_limited_to_the_authenticated_owner(self):
        ShortURL.objects.create(
            url="https://example.com", short_id="bobs-link", created_by="Bob"
        )
        response = self.client.delete(
            reverse("urlshortener_internal:url", args=["bobs-link"]),
            **internal_auth_headers("Alice", "core-alice"),
        )
        assert response.status_code == 403
        assert ShortURL.objects.filter(short_id="bobs-link").exists()


@pytest.mark.parametrize(
    "url, valid",
    [
        ("https://example.com", True),
        ("http://example.com/path", True),
        ("example.com", False),
        ("ftp://example.com", False),
        ("javascript:alert(1)", False),
    ],
)
def test_new_short_urls_require_absolute_http_urls(url, valid):
    assert (ShortURL.validate_url(url) is None) is valid
