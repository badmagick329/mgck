import json
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4
from unittest.mock import patch

import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone as django_timezone

from milestones.models import Milestone, MilestoneUser
from milestones.serializers import SyncSnapshotSerializer
from milestones.tests.helpers import create_token

EVENT_TIMESTAMP = 1_800_000_000_000


def record(
    public_id=None,
    name="Launch",
    updated_at=None,
    deleted=False,
    color="#123456",
):
    updated_at = updated_at or int(django_timezone.now().timestamp() * 1000)
    return {
        "public_id": str(public_id or uuid4()),
        "name": name,
        "timestamp": EVENT_TIMESTAMP,
        "timezone": "Europe/London",
        "color": color,
        "updated_at": updated_at,
        "deleted_at": updated_at if deleted else None,
    }


@pytest.mark.django_db
class TestMilestoneSync:
    def setup_method(self):
        self.client = Client()
        self.url = reverse("milestones:sync_milestones")

    def sync(self, records, username="Alice", user_id="core-alice"):
        return self.client.post(
            self.url,
            data=json.dumps({"records": records}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {create_token(username, user_id)}",
        )

    def test_replay_is_idempotent_and_empty_snapshot_does_not_delete(self):
        public_id = uuid4()
        payload = record(public_id=public_id)
        first = self.sync([payload])
        assert first.status_code == 200
        milestone = Milestone.objects.get(public_id=public_id)
        first_received_at = milestone.server_received_at

        second = self.sync([payload])
        assert second.status_code == 200
        milestone.refresh_from_db()
        assert milestone.server_received_at == first_received_at
        assert Milestone.objects.count() == 1

        empty = self.sync([])
        assert empty.status_code == 200
        assert len(empty.json()["records"]) == 1
        assert Milestone.objects.get(public_id=public_id).deleted_at is None

    def test_newer_edit_wins_and_older_replay_is_ignored(self):
        public_id = uuid4()
        base = int(django_timezone.now().timestamp() * 1000) - 10_000
        self.sync([record(public_id, updated_at=base)])
        self.sync(
            [
                record(
                    public_id,
                    name="New name",
                    updated_at=base + 2_000,
                    color="#abcdef",
                )
            ]
        )
        self.sync(
            [record(public_id, name="Old replay", updated_at=base + 1_000)]
        )

        milestone = Milestone.objects.get(public_id=public_id)
        assert milestone.event_name == "New name"
        assert milestone.color == "#abcdef"

    def test_newer_tombstone_wins_and_genuinely_newer_edit_restores(self):
        public_id = uuid4()
        base = int(django_timezone.now().timestamp() * 1000) - 10_000
        self.sync([record(public_id, updated_at=base)])
        self.sync([record(public_id, updated_at=base + 1_000, deleted=True)])
        self.sync([record(public_id, updated_at=base + 500)])
        assert (
            Milestone.objects.get(public_id=public_id).deleted_at is not None
        )

        restored = self.sync(
            [record(public_id, name="Restored", updated_at=base + 2_000)]
        )
        assert restored.status_code == 200
        milestone = Milestone.objects.get(public_id=public_id)
        assert milestone.deleted_at is None
        assert milestone.event_name == "Restored"

    def test_equal_timestamp_with_different_content_uses_later_receipt(self):
        public_id = uuid4()
        updated_at = int(django_timezone.now().timestamp() * 1000) - 1_000
        self.sync([record(public_id, name="First", updated_at=updated_at)])
        self.sync([record(public_id, name="Second", updated_at=updated_at)])
        assert (
            Milestone.objects.get(public_id=public_id).event_name == "Second"
        )

    def test_same_name_records_choose_one_winner_and_tombstone_the_loser(self):
        older_id = UUID("048c3d72-5c61-4f2c-9707-e06b0cc1f7f5")
        newer_id = UUID("148c3d72-5c61-4f2c-9707-e06b0cc1f7f5")
        base = int(django_timezone.now().timestamp() * 1000) - 10_000

        response = self.sync(
            [
                record(older_id, updated_at=base),
                record(newer_id, updated_at=base + 1_000),
            ]
        )

        assert response.status_code == 200
        older = Milestone.objects.get(public_id=older_id)
        newer = Milestone.objects.get(public_id=newer_id)
        assert older.deleted_at is not None
        assert older.updated_at >= newer.updated_at
        assert newer.deleted_at is None

        self.sync([record(older_id, updated_at=base)])
        older.refresh_from_db()
        assert older.deleted_at is not None

    def test_swapping_two_active_names_is_transactionally_safe(self):
        first_id, second_id = uuid4(), uuid4()
        base = int(django_timezone.now().timestamp() * 1000) - 10_000
        self.sync(
            [
                record(first_id, name="First", updated_at=base),
                record(second_id, name="Second", updated_at=base),
            ]
        )

        response = self.sync(
            [
                record(first_id, name="Second", updated_at=base + 1_000),
                record(second_id, name="First", updated_at=base + 1_000),
            ]
        )

        assert response.status_code == 200
        assert Milestone.objects.get(public_id=first_id).event_name == "Second"
        assert Milestone.objects.get(public_id=second_id).event_name == "First"

    def test_future_timestamp_is_normalized_with_matching_tombstone(self):
        public_id = uuid4()
        future = int(
            (django_timezone.now() + timedelta(minutes=10)).timestamp() * 1000
        )
        before = int(django_timezone.now().timestamp() * 1000)

        response = self.sync(
            [record(public_id, updated_at=future, deleted=True)]
        )

        returned = response.json()["records"][0]
        after = int(django_timezone.now().timestamp() * 1000)
        assert before <= returned["updated_at"] <= after
        assert returned["deleted_at"] == returned["updated_at"]

    def test_rejects_duplicate_ids_and_invalid_snapshot_without_partial_writes(
        self,
    ):
        public_id = uuid4()
        duplicate = record(public_id)
        response = self.sync([duplicate, {**duplicate, "name": "Other"}])
        assert response.status_code == 400
        assert Milestone.objects.count() == 0

        response = self.sync([record(), {**record(), "color": "invalid"}])
        assert response.status_code == 400
        assert Milestone.objects.count() == 0

    def test_rejects_foreign_uuid_without_revealing_or_mutating_it(self):
        alice_id = uuid4()
        self.sync([record(alice_id)])

        response = self.sync(
            [record(alice_id, name="Stolen")],
            username="Bob",
            user_id="core-bob",
        )

        assert response.status_code == 409
        assert Milestone.objects.get(public_id=alice_id).event_name == "Launch"
        assert not Milestone.objects.filter(
            created_by__core_user_id="core-bob"
        ).exists()

    def test_response_order_is_stable_by_public_id(self):
        first = UUID("048c3d72-5c61-4f2c-9707-e06b0cc1f7f5")
        second = UUID("148c3d72-5c61-4f2c-9707-e06b0cc1f7f5")
        response = self.sync(
            [record(second, name="Second"), record(first, name="First")]
        )
        assert [item["public_id"] for item in response.json()["records"]] == [
            str(first),
            str(second),
        ]

    def test_database_error_rolls_back_all_snapshot_changes(self):
        owner = MilestoneUser.objects.create(
            username="Alice", core_user_id="core-alice"
        )
        existing = Milestone.create(
            "Original", EVENT_TIMESTAMP, "UTC", "Alice"
        )
        existing.created_by = owner
        existing.save(update_fields=["created_by"])
        updated_at = int(django_timezone.now().timestamp() * 1000) + 1

        with patch(
            "milestones.sync.Milestone.objects.create",
            side_effect=RuntimeError("database failure"),
        ):
            with pytest.raises(RuntimeError):
                self.sync(
                    [
                        record(
                            existing.public_id,
                            name="Changed",
                            updated_at=updated_at,
                        ),
                        record(name="New", updated_at=updated_at),
                    ]
                )

        existing.refresh_from_db()
        assert existing.event_name == "Original"
        assert existing.deleted_at is None
        assert Milestone.objects.count() == 1


def test_snapshot_record_limit():
    records = [record(name=f"Record {index}") for index in range(1000)]
    assert SyncSnapshotSerializer(data={"records": records}).is_valid()
    records.append(record(name="Too many"))
    assert not SyncSnapshotSerializer(data={"records": records}).is_valid()
