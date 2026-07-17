import json
from datetime import datetime, timezone
from urllib.parse import quote

import pytest
from django.test import Client
from django.urls import reverse

from milestones.models import Milestone, MilestoneUser
from milestones.tests.helpers import (
    INTERNAL_API_KEY,
    internal_auth_headers,
)


@pytest.mark.django_db
class TestMilestoneAuthentication:
    def setup_method(self):
        self.client = Client()
        self.url = reverse("milestones:milestones")

    def test_requires_internal_service_authentication(self):
        assert self.client.get(self.url).status_code == 401

    def test_valid_internal_identity_claims_an_exact_legacy_owner(self):
        legacy = MilestoneUser.objects.create(username="Alice")

        response = self.client.get(
            self.url, **internal_auth_headers("Alice", "core-alice")
        )

        assert response.status_code == 200
        legacy.refresh_from_db()
        assert legacy.core_user_id == "core-alice"

    def test_rejects_an_incorrect_internal_key(self):
        response = self.client.get(
            self.url,
            **internal_auth_headers(
                "Alice",
                "core-alice",
                key="wrong-internal-key-that-is-at-least-32-characters",
            ),
        )
        assert response.status_code == 401

    def test_returns_503_when_internal_authentication_is_not_configured(
        self, settings
    ):
        settings.NEXT_DJANGO_INTERNAL_API_KEY = ""
        response = self.client.get(
            self.url, **internal_auth_headers("Alice", "core-alice")
        )
        assert response.status_code == 503

    @pytest.mark.parametrize(
        "overrides",
        [
            {"HTTP_X_MGCK_CORE_USER_ID": ""},
            {"HTTP_X_MGCK_CORE_USERNAME": ""},
            {"HTTP_X_MGCK_CORE_USER_ID": "%ZZ"},
            {"HTTP_X_MGCK_CORE_USERNAME": "%FF"},
            {"HTTP_X_MGCK_CORE_USER_ID": "x" * 256},
            {"HTTP_X_MGCK_CORE_USERNAME": "Alice%0AAdmin"},
        ],
    )
    def test_rejects_malformed_internal_identity(self, overrides):
        headers = internal_auth_headers("Alice", "core-alice")
        headers.update(overrides)
        assert self.client.get(self.url, **headers).status_code == 401

    def test_decodes_uri_encoded_utf8_identity(self):
        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=f"Bearer {INTERNAL_API_KEY}",
            HTTP_X_MGCK_CORE_USER_ID=quote("core-álîce", safe=""),
            HTTP_X_MGCK_CORE_USERNAME=quote("Álice", safe=""),
        )
        assert response.status_code == 200
        assert MilestoneUser.objects.get().username == "Álice"
        assert MilestoneUser.objects.get().core_user_id == "core-álîce"

    def test_does_not_claim_an_owner_bound_to_another_core_account(self):
        MilestoneUser.objects.create(
            username="Alice", core_user_id="different-core-account"
        )

        response = self.client.get(
            self.url, **internal_auth_headers("Alice", "core-alice")
        )

        assert response.status_code == 409
        assert MilestoneUser.objects.count() == 1

    def test_legacy_payload_username_cannot_select_another_owner(self):
        alice = MilestoneUser.objects.create(
            username="Alice", core_user_id="core-alice"
        )
        bob = MilestoneUser.objects.create(
            username="Bob", core_user_id="core-bob"
        )
        event_datetime = datetime(2030, 1, 1, tzinfo=timezone.utc)
        Milestone.objects.create(
            event_name="Alice event",
            event_datetime_utc=event_datetime,
            event_timezone="UTC",
            created_by=alice,
        )
        Milestone.objects.create(
            event_name="Bob event",
            event_datetime_utc=event_datetime,
            event_timezone="UTC",
            created_by=bob,
        )
        authentication = internal_auth_headers("Alice", "core-alice")

        listed = self.client.get(
            self.url, {"username": "Bob"}, **authentication
        )
        created = self.client.post(
            self.url,
            data=json.dumps(
                {
                    "username": "Bob",
                    "event_name": "Spoof attempt",
                    "timestamp": 1_800_000_000_000,
                    "timezone": "UTC",
                }
            ),
            content_type="application/json",
            **authentication,
        )

        assert [item["event_name"] for item in listed.json()] == [
            "Alice event"
        ]
        assert created.status_code == 201
        assert (
            Milestone.objects.get(event_name="Spoof attempt").created_by
            == alice
        )
