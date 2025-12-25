from datetime import datetime
from datetime import timezone as dt_timezone

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from milestones.models import Milestone, MilestoneUser

TEST_TIMESTAMP = 1766248695000


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
        tz = "America/New_York"
        user = "testuser"

        milestone = Milestone.create("event", TEST_TIMESTAMP, tz, user)

        assert milestone.event_timezone == "America/New_York"
        assert milestone.created_by.username == "testuser"
        assert milestone.event_datetime_utc is not None
        assert milestone.color == Milestone.DEFAULT_COLOR
        assert Milestone.objects.count() == 1

    def test_create_milestone_with_existing_user(self):
        """Test creating a milestone with an existing user"""
        existing_user = MilestoneUser.objects.create(username="existing")

        timestamp = TEST_TIMESTAMP
        tz = "UTC"

        milestone = Milestone.create("event", timestamp, tz, "existing")

        assert milestone.created_by == existing_user
        assert MilestoneUser.objects.count() == 1

    def test_create_milestone_creates_new_user(self):
        """Test that create classmethod creates a new user if it doesn't exist"""
        timestamp = TEST_TIMESTAMP
        tz = "Europe/London"

        milestone = Milestone.create("event", timestamp, tz, "newuser")

        assert MilestoneUser.objects.count() == 1
        assert milestone.created_by.username == "newuser"

    def test_milestone_unique_together_constraint(self):
        """Test that same event_name and created_by can't be duplicated"""
        Milestone.create("MyEvent", TEST_TIMESTAMP, "UTC", "user")

        with pytest.raises(ValidationError):
            Milestone.create("MyEvent", TEST_TIMESTAMP, "UTC", "user")

    def test_different_users_same_event_name(self):
        """Test that different users can have the same event name"""

        milestone1 = Milestone.create("MyEvent", TEST_TIMESTAMP, "UTC", "user1")
        milestone2 = Milestone.create("MyEvent", TEST_TIMESTAMP, "UTC", "user2")

        assert milestone1.event_name == milestone2.event_name
        assert milestone1.created_by != milestone2.created_by
        assert Milestone.objects.count() == 2

    def test_milestone_created_timestamp(self):
        """Test that created timestamp is set automatically"""
        milestone = Milestone.create("event", TEST_TIMESTAMP, "UTC", "user")
        assert isinstance(milestone.created, datetime)

    def test_milestone_event_name_max_length(self):
        """Test creating a milestone with maximum length event name"""
        max_name = "x" * 255

        milestone = Milestone.create(max_name, TEST_TIMESTAMP, "UTC", "user")

        assert len(milestone.event_name) == 255

    def test_milestone_creation_with_default_color(self):
        """Test that milestone is created with default color if none provided"""
        milestone = Milestone.create("event", TEST_TIMESTAMP, "UTC", "user")

        assert milestone.color == Milestone.DEFAULT_COLOR

    def test_milestone_creation_with_custom_color(self):
        """Test that milestone is created with a custom color if provided"""
        custom_color = "#FF5733"
        milestone = Milestone.create(
            "event", TEST_TIMESTAMP, "UTC", "user", color=custom_color
        )

        assert milestone.color == custom_color

    @pytest.mark.parametrize(
        "invalid_color",
        ["NotAColor", "#GGGGGG", "123456", "hsl(0,100%,50%)", "rgb(255,0,0)"],
    )
    def test_milestone_creation_with_invalid_color(self, invalid_color):
        """Test that creating a milestone with invalid color raises ValidationError"""

        with pytest.raises(ValidationError):
            Milestone.create(
                "event", TEST_TIMESTAMP, "UTC", "user", color=invalid_color
            )

    def test_milestone_update_with_new_name(self):
        """Test updating a milestone's event name"""
        milestone = Milestone.create("OldName", TEST_TIMESTAMP, "UTC", "user")

        milestone.event_name = "NewName"
        milestone.save()

        updated_milestone = Milestone.objects.get(id=milestone.id)  # type: ignore
        assert updated_milestone.event_name == "NewName"

    def test_milestone_update_with_new_timestamp(self):
        """Test updating a milestone's timestamp"""
        milestone = Milestone.create("Event", TEST_TIMESTAMP, "UTC", "user")

        new_timestamp = TEST_TIMESTAMP + 86400000  # +1 day in milliseconds
        new_datetime_utc = datetime.fromtimestamp(
            new_timestamp / 1000, tz=dt_timezone.utc
        )

        milestone.event_datetime_utc = new_datetime_utc
        milestone.save()

        updated_milestone = Milestone.objects.get(id=milestone.id)  # type: ignore
        assert (
            updated_milestone.event_datetime_utc.timestamp()
            == new_datetime_utc.timestamp()
        )

    def test_milestone_update_with_new_color(self):
        """Test updating a milestone's color"""
        milestone = Milestone.create("Event", TEST_TIMESTAMP, "UTC", "user")

        new_color = "#00FF00"
        milestone.color = new_color
        milestone.save()

        updated_milestone = Milestone.objects.get(id=milestone.id)  # type: ignore
        assert updated_milestone.color == new_color
