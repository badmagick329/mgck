from datetime import datetime, timedelta, timezone

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from milestones.models import Milestone, MilestoneUser

EVENT_DATETIME = datetime(2030, 1, 1, tzinfo=timezone.utc)


@pytest.fixture
def owner():
    return MilestoneUser.objects.create(
        username="Alice", core_user_id="core-alice"
    )


@pytest.fixture
def milestone_values(owner):
    return {
        "event_name": "Launch",
        "event_datetime_utc": EVENT_DATETIME,
        "event_timezone": "UTC",
        "created_by": owner,
    }


@pytest.mark.django_db
class TestMilestoneUser:
    def test_username_unique_constraint(self):
        MilestoneUser.objects.create(username="duplicate")
        with pytest.raises(IntegrityError):
            MilestoneUser.objects.create(username="duplicate")

    def test_max_length_username(self):
        user = MilestoneUser(username="x" * 255)
        user.full_clean()
        user.save()
        assert MilestoneUser.objects.get().username == "x" * 255

    def test_exceeds_max_length_username(self):
        with pytest.raises(ValidationError):
            MilestoneUser(username="x" * 256).full_clean()


@pytest.mark.django_db
class TestMilestone:
    def test_model_creation_sets_defaults(self, milestone_values):
        milestone = Milestone.objects.create(**milestone_values)
        milestone.refresh_from_db()
        assert milestone.event_datetime_utc == EVENT_DATETIME
        assert milestone.color == Milestone.DEFAULT_COLOR
        assert milestone.public_id is not None
        assert isinstance(milestone.created, datetime)

    def test_active_names_are_unique_per_owner(self, milestone_values):
        Milestone.objects.create(**milestone_values)
        with pytest.raises(ValidationError):
            Milestone.objects.create(**milestone_values)

    def test_tombstone_does_not_reserve_active_name(self, milestone_values):
        deleted = Milestone.objects.create(
            **milestone_values, deleted_at=EVENT_DATETIME
        )
        active = Milestone.objects.create(**milestone_values)
        assert deleted.public_id != active.public_id
        assert Milestone.objects.count() == 2

    def test_different_owners_can_share_active_names(self, milestone_values):
        first = Milestone.objects.create(**milestone_values)
        other_owner = MilestoneUser.objects.create(username="Bob")
        second = Milestone.objects.create(
            **{**milestone_values, "created_by": other_owner}
        )
        assert first.event_name == second.event_name
        assert first.created_by != second.created_by

    @pytest.mark.parametrize("name", ["", "x" * 256])
    def test_save_validates_event_name(self, milestone_values, name):
        with pytest.raises(ValidationError):
            Milestone.objects.create(**{**milestone_values, "event_name": name})
        assert not Milestone.objects.exists()

    def test_maximum_event_name_length(self, milestone_values):
        milestone = Milestone.objects.create(
            **{**milestone_values, "event_name": "x" * 255}
        )
        assert len(milestone.event_name) == 255

    @pytest.mark.parametrize("color", ["#FF5733", "#abc"])
    def test_custom_color(self, milestone_values, color):
        milestone = Milestone.objects.create(**milestone_values, color=color)
        assert milestone.color == color

    @pytest.mark.parametrize(
        "color",
        ["NotAColor", "#GGGGGG", "123456", "hsl(0,100%,50%)", "rgb(255,0,0)"],
    )
    def test_save_validates_color(self, milestone_values, color):
        with pytest.raises(ValidationError):
            Milestone.objects.create(**milestone_values, color=color)
        assert not Milestone.objects.exists()

    def test_model_updates_persist(self, milestone_values):
        milestone = Milestone.objects.create(**milestone_values)
        milestone.event_name = "Renamed"
        milestone.event_datetime_utc += timedelta(days=1)
        milestone.color = "#00FF00"
        milestone.save()
        milestone.refresh_from_db()
        assert milestone.event_name == "Renamed"
        assert milestone.event_datetime_utc == EVENT_DATETIME + timedelta(days=1)
        assert milestone.color == "#00FF00"

    def test_invalid_update_does_not_change_stored_record(self, milestone_values):
        milestone = Milestone.objects.create(**milestone_values)
        milestone.color = "invalid"
        with pytest.raises(ValidationError):
            milestone.save()
        milestone.refresh_from_db()
        assert milestone.color == Milestone.DEFAULT_COLOR
