from datetime import datetime, timezone
from urllib.parse import quote

import pytest
from django.test import Client
from django.urls import reverse

from milestones.models import Milestone, MilestoneUser
from milestones.tests.helpers import INTERNAL_API_KEY, internal_auth_headers


@pytest.mark.django_db
class TestMilestoneAuthentication:
    def setup_method(self):
        self.client = Client()
        self.url = reverse("milestones:sync_milestones")

    def sync(self, **headers):
        return self.client.post(
            self.url, {"records": []}, content_type="application/json", **headers
        )

    def test_requires_internal_service_authentication(self):
        assert self.sync().status_code == 401

    def test_matching_username_cannot_claim_unbound_legacy_records(self):
        legacy = MilestoneUser.objects.create(username="Alice")
        response = self.sync(**internal_auth_headers("Alice", "core-alice"))
        assert response.status_code == 409
        legacy.refresh_from_db()
        assert legacy.core_user_id is None
        assert MilestoneUser.objects.count() == 1

    def test_verified_stable_id_can_access_manually_bound_legacy_owner(self):
        legacy = MilestoneUser.objects.create(
            username="Alice", core_user_id="core-alice"
        )
        response = self.sync(**internal_auth_headers("Alice", "core-alice"))
        assert response.status_code == 200
        legacy.refresh_from_db()
        assert legacy.core_user_id == "core-alice"

    def test_rejects_an_incorrect_internal_key(self):
        response = self.sync(
            **internal_auth_headers(
                "Alice", "core-alice",
                key="wrong-internal-key-that-is-at-least-32-characters",
            )
        )
        assert response.status_code == 401

    def test_returns_503_when_internal_authentication_is_not_configured(
        self, settings
    ):
        settings.NEXT_DJANGO_INTERNAL_API_KEY = ""
        response = self.sync(**internal_auth_headers("Alice", "core-alice"))
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
        assert self.sync(**headers).status_code == 401

    def test_decodes_uri_encoded_utf8_identity(self):
        response = self.sync(
            HTTP_AUTHORIZATION=f"Bearer {INTERNAL_API_KEY}",
            HTTP_X_MGCK_CORE_USER_ID=quote("core-álîce", safe=""),
            HTTP_X_MGCK_CORE_USERNAME=quote("Álice", safe=""),
        )
        assert response.status_code == 200
        owner = MilestoneUser.objects.get()
        assert owner.username == "Álice"
        assert owner.core_user_id == "core-álîce"

    def test_does_not_claim_an_owner_bound_to_another_core_account(self):
        MilestoneUser.objects.create(
            username="Alice", core_user_id="different-core-account"
        )
        response = self.sync(**internal_auth_headers("Alice", "core-alice"))
        assert response.status_code == 409
        assert MilestoneUser.objects.count() == 1

    def test_payload_and_query_username_cannot_select_another_owner(self):
        alice = MilestoneUser.objects.create(
            username="Alice", core_user_id="core-alice"
        )
        bob = MilestoneUser.objects.create(username="Bob", core_user_id="core-bob")
        for owner in (alice, bob):
            Milestone.objects.create(
                event_name=f"{owner.username} event",
                event_datetime_utc=datetime(2030, 1, 1, tzinfo=timezone.utc),
                event_timezone="UTC",
                created_by=owner,
            )
        response = self.client.post(
            f"{self.url}?username=Bob",
            {"records": [], "username": "Bob"},
            content_type="application/json",
            **internal_auth_headers("Alice", "core-alice"),
        )
        assert response.status_code == 200
        assert [item["name"] for item in response.json()["records"]] == [
            "Alice event"
        ]
        assert Milestone.objects.get(created_by=bob).event_name == "Bob event"
