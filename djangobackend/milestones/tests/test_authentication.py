import json
from datetime import datetime, timedelta, timezone

import pytest
from django.test import Client
from django.urls import reverse

from milestones.models import Milestone, MilestoneUser
from milestones.tests.helpers import create_token


@pytest.mark.django_db
class TestMilestoneAuthentication:
    def setup_method(self):
        self.client = Client()
        self.url = reverse("milestones:milestones")

    def test_requires_a_bearer_token(self):
        assert self.client.get(self.url).status_code == 401

    def test_valid_token_claims_an_exact_legacy_owner(self):
        legacy = MilestoneUser.objects.create(username="Alice")

        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=f"Bearer {create_token('Alice', 'core-alice')}",
        )

        assert response.status_code == 200
        legacy.refresh_from_db()
        assert legacy.core_user_id == "core-alice"

    @pytest.mark.parametrize(
        "token",
        [
            "not-a-token",
            create_token(
                expires_at=datetime.now(timezone.utc) - timedelta(seconds=1)
            ),
            create_token(issuer="http://wrong-issuer"),
            create_token(audience="http://wrong-audience"),
            create_token(
                signing_key="wrong-signing-key-wrong-signing-key-1234"
            ),
        ],
    )
    def test_rejects_invalid_tokens(self, token):
        response = self.client.get(
            self.url, HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        assert response.status_code == 401

    def test_does_not_claim_an_owner_bound_to_another_core_account(self):
        MilestoneUser.objects.create(
            username="Alice", core_user_id="different-core-account"
        )

        response = self.client.get(
            self.url,
            HTTP_AUTHORIZATION=f"Bearer {create_token('Alice', 'core-alice')}",
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
        authorization = f"Bearer {create_token('Alice', 'core-alice')}"

        listed = self.client.get(
            self.url,
            {"username": "Bob"},
            HTTP_AUTHORIZATION=authorization,
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
            HTTP_AUTHORIZATION=authorization,
        )

        assert [item["event_name"] for item in listed.json()] == [
            "Alice event"
        ]
        assert created.status_code == 201
        assert (
            Milestone.objects.get(event_name="Spoof attempt").created_by
            == alice
        )
