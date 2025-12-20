from datetime import datetime, timezone

import pytest
from django.db import IntegrityError

from milestones.models import Milestone, MilestoneUser

test_timestamp = 1766248695


@pytest.mark.django_db
class TestMilestoneUser:
    def test_create_milestone_user(self):
        """Test creating a basic milestone user"""
        user = MilestoneUser.objects.create(username="testuser")
        assert user.username == "testuser"
        assert MilestoneUser.objects.count() == 1

    def test_username_unique_constraint(self):
        """Test that duplicate usernames raise an integrity error"""
        MilestoneUser.objects.create(username="duplicate")
        with pytest.raises(IntegrityError):
            MilestoneUser.objects.create(username="duplicate")

    def test_max_length_username(self):
        """Test creating a user with maximum length username"""
        max_username = "x" * 255
        user = MilestoneUser.objects.create(username=max_username)
        assert len(user.username) == 255

    def test_exceeds_max_length_username(self):
        """Test that username exceeding max length fails"""
        too_long_username = "x" * 256
        user = MilestoneUser(username=too_long_username)
        with pytest.raises(Exception):
            user.full_clean()


@pytest.mark.django_db
class TestMilestone:
    def test_create_milestone_basic(self):
        """Test creating a milestone via the create classmethod"""
        timestamp = test_timestamp
        tz = "America/New_York"
        user = "testuser"

        milestone = Milestone.create(timestamp, tz, user)

        assert milestone.event_timezone == "America/New_York"
        assert milestone.created_by.username == "testuser"
        assert milestone.event_datetime_utc is not None
        assert Milestone.objects.count() == 1

    def test_create_milestone_with_existing_user(self):
        """Test creating a milestone with an existing user"""
        existing_user = MilestoneUser.objects.create(username="existing")

        timestamp = test_timestamp
        tz = "UTC"

        milestone = Milestone.create(timestamp, tz, "existing")

        assert milestone.created_by == existing_user
        assert MilestoneUser.objects.count() == 1

    def test_create_milestone_creates_new_user(self):
        """Test that create classmethod creates a new user if it doesn't exist"""
        timestamp = test_timestamp
        tz = "Europe/London"

        milestone = Milestone.create(timestamp, tz, "newuser")

        assert MilestoneUser.objects.count() == 1
        assert milestone.created_by.username == "newuser"

    def test_milestone_datetime_utc_conversion(self):
        """Test that datetime is correctly stored as UTC"""
        timestamp = test_timestamp
        tz = "America/New_York"

        milestone = Milestone.create(timestamp, tz, "user")

        expected_dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
        assert milestone.event_datetime_utc == expected_dt

    def test_milestone_unique_together_constraint(self):
        """Test that same event_name and created_by can't be duplicated"""
        user = MilestoneUser.objects.create(username="user1")
        timestamp = test_timestamp

        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=datetime.fromtimestamp(timestamp, tz=timezone.utc),
            event_name="MyEvent",
            created_by=user,
        )

        with pytest.raises(IntegrityError):
            Milestone.objects.create(
                event_timezone="UTC",
                event_datetime_utc=datetime.fromtimestamp(timestamp, tz=timezone.utc),
                event_name="MyEvent",
                created_by=user,
            )

    def test_different_users_same_event_name(self):
        """Test that different users can have the same event name"""
        timestamp = test_timestamp
        user1 = MilestoneUser.objects.create(username="user1")
        user2 = MilestoneUser.objects.create(username="user2")

        dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)

        milestone1 = Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="MyEvent",
            created_by=user1,
        )

        milestone2 = Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="MyEvent",
            created_by=user2,
        )

        assert milestone1.event_name == milestone2.event_name
        assert milestone1.created_by != milestone2.created_by
        assert Milestone.objects.count() == 2

    def test_milestone_created_timestamp(self):
        """Test that created timestamp is set automatically"""
        timestamp = test_timestamp
        milestone = Milestone.create(timestamp, "UTC", "user")
        assert milestone.created is not None
        assert isinstance(milestone.created, datetime)

    def test_milestone_timezone_storage(self):
        """Test various timezone strings are stored correctly"""
        timezones = ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"]
        for i, tz in enumerate(timezones):
            milestone = Milestone.create(test_timestamp, tz, f"user{i}")
            assert milestone.event_timezone == tz

    def test_milestone_event_name_max_length(self):
        """Test creating a milestone with maximum length event name"""
        max_name = "x" * 255
        user = MilestoneUser.objects.create(username="user")
        dt = datetime.fromtimestamp(test_timestamp, tz=timezone.utc)

        milestone = Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name=max_name,
            created_by=user,
        )

        assert len(milestone.event_name) == 255
