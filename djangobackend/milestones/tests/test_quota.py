import json
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import uuid4

import pytest
from django.test import Client
from django.urls import reverse
from django.utils import timezone
from django.db import connection, connections
from django.test.utils import CaptureQueriesContext

from milestones.limits import MilestoneQuotaExceeded
from milestones.models import Milestone, MilestoneUser
from milestones.tests.helpers import internal_auth_headers
from milestones.tests.test_sync import record


@pytest.fixture
def small_quota(monkeypatch):
    monkeypatch.setattr("milestones.limits.MAX_OWNER_RECORDS", 2)


def sync(records):
    return Client().post(
        reverse("milestones:sync_milestones"),
        json.dumps({"records": records}), content_type="application/json",
        **internal_auth_headers("Alice", "core-alice"),
    )


@pytest.mark.django_db
def test_repeated_snapshots_count_tombstones_and_reject_all_changes(small_quota):
    first = record(name="First", updated_at=1_000)
    second = record(name="Second", deleted=True, updated_at=2_000)
    assert sync([first]).status_code == 200
    assert sync([second]).status_code == 200
    response = sync([
        {**first, "name": "Should roll back", "updated_at": 3_000},
        record(name="Overflow"),
    ])
    assert response.status_code == 409
    assert response.json()["code"] == "record_limit"
    assert Milestone.objects.count() == 2
    assert Milestone.objects.get(public_id=first["public_id"]).event_name == "First"
    assert Milestone.objects.get(public_id=second["public_id"]).deleted_at is not None

    # Full accounts can still delete, replay, edit and restore an existing ID.
    assert sync([{**first, "updated_at": 3_000, "deleted_at": 3_000}]).status_code == 200
    assert sync([first]).status_code == 200
    assert Milestone.objects.get(public_id=first["public_id"]).deleted_at is not None
    assert sync([{**first, "updated_at": 4_000}]).status_code == 200
    assert sync([]).status_code == 200
    assert Milestone.objects.count() == 2


@pytest.mark.django_db
def test_new_tombstones_and_same_name_losers_cannot_bypass_quota(small_quota):
    assert sync([record(), record()]).status_code == 200
    assert Milestone.objects.filter(deleted_at__isnull=False).count() == 1
    assert sync([record(deleted=True)]).status_code == 409
    assert Milestone.objects.count() == 2


@pytest.mark.django_db
def test_legacy_create_and_model_create_share_the_quota(small_quota):
    owner = MilestoneUser.objects.create(username="Alice", core_user_id="core-alice")
    first = Milestone.create("First", 1_800_000_000_000, "UTC", "Alice")
    first.soft_delete()
    assert sync([record(name="Second")]).status_code == 200
    response = Client().post(
        reverse("milestones:milestones"),
        {"event_name": "Overflow", "timestamp": 1_800_000_000_000, "timezone": "UTC"},
        content_type="application/json", **internal_auth_headers("Alice", "core-alice"),
    )
    assert response.status_code == 409
    with pytest.raises(MilestoneQuotaExceeded):
        Milestone.objects.create(
            created_by=owner, event_name="Admin overflow", event_timezone="UTC",
            event_datetime_utc=timezone.now(), public_id=uuid4(),
        )
    assert Milestone.objects.count() == 2


@pytest.mark.django_db
def test_existing_over_quota_accounts_keep_data_and_can_edit(monkeypatch):
    monkeypatch.setattr("milestones.limits.MAX_OWNER_RECORDS", 3)
    records = [record(name=f"Event {index}") for index in range(3)]
    assert sync(records).status_code == 200
    monkeypatch.setattr("milestones.limits.MAX_OWNER_RECORDS", 2)
    assert sync([]).status_code == 200
    assert sync([{**records[0], "name": "Changed", "updated_at": records[0]["updated_at"] + 1}]).status_code == 200
    assert sync([record(name="New")]).status_code == 409
    assert Milestone.objects.count() == 3


@pytest.mark.django_db
def test_accounts_have_independent_quotas(small_quota):
    assert sync([record(name="First"), record(name="Second")]).status_code == 200
    Milestone.create("Bob's first", 1_800_000_000_000, "UTC", "Bob")
    assert Milestone.objects.filter(created_by__username="Bob").count() == 1


@pytest.mark.django_db
def test_full_size_snapshot_is_bounded_without_per_record_quota_queries():
    payload = [record(name=f"Event {index}") for index in range(1000)]
    with CaptureQueriesContext(connection) as queries:
        response = sync(payload)
    assert response.status_code == 200
    assert len(response.json()["records"]) == 1000
    assert Milestone.objects.count() == 1000
    assert len(queries) < 40
    assert sync([record(name="Overflow")]).status_code == 409


@pytest.mark.django_db(transaction=True)
@pytest.mark.skipif(connection.vendor != "postgresql", reason="Requires real row locks")
def test_concurrent_sync_and_legacy_creation_cannot_share_last_slot(small_quota):
    MilestoneUser.objects.create(username="Alice", core_user_id="core-alice")
    assert sync([record(name="Existing")]).status_code == 200
    barrier = Barrier(2)

    def write(use_sync):
        try:
            barrier.wait(timeout=10)
            if use_sync:
                return sync([record(name="Sync contender")]).status_code
            return Client().post(
                reverse("milestones:milestones"),
                {"event_name": "Legacy contender", "timestamp": 1_800_000_000_000, "timezone": "UTC"},
                content_type="application/json", **internal_auth_headers("Alice", "core-alice"),
            ).status_code
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(write, value) for value in [True, False]]
        statuses = [future.result(timeout=20) for future in futures]
    assert statuses.count(409) == 1
    assert sum(200 <= status < 300 for status in statuses) == 1
    assert Milestone.objects.count() == 2
