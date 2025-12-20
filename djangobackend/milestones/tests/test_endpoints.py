import json
from datetime import datetime, timezone

import pytest
from django.test import Client
from django.urls import reverse

from milestones.models import Milestone, MilestoneUser

TEST_TIMESTAMP = 1766248695000
MILESTONES_ENDPOINT = "milestones:milestones"
MODIFY_MILESTONES_ENDPOINT = "milestones:modify_milestone"


@pytest.mark.django_db
class TestMilestoneCreateEndpoint:
    def setup_method(self):
        self.client = Client()

    def test_create_milestone_success(self):
        """Test successfully creating a milestone"""
        timestamp_ms = TEST_TIMESTAMP
        data = {
            "timestamp": timestamp_ms,
            "timezone": "America/New_York",
            "username": "testuser",
            "event_name": "Birthday",
        }
        response = self.client.post(
            reverse(MILESTONES_ENDPOINT),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 201
        response_data = json.loads(response.content)
        assert response_data["event_name"] == "Birthday"
        assert response_data["event_timezone"] == "America/New_York"
        assert Milestone.objects.count() == 1

    def test_create_milestone_missing_username(self):
        """Test creating milestone without username"""
        timestamp_ms = TEST_TIMESTAMP
        data = {
            "timestamp": timestamp_ms,
            "timezone": "UTC",
            "username": None,
            "event_name": "Event",
        }
        response = self.client.post(
            reverse(MILESTONES_ENDPOINT),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 400
        response_data = json.loads(response.content)
        assert "Username is required" in response_data["error"]

    def test_create_milestone_missing_timezone(self):
        """Test creating milestone without timezone"""
        timestamp_ms = TEST_TIMESTAMP
        data = {
            "timestamp": timestamp_ms,
            "timezone": None,
            "username": "user",
            "event_name": "Event",
        }
        response = self.client.post(
            reverse(MILESTONES_ENDPOINT),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 400
        response_data = json.loads(response.content)
        assert "Timezone is required" in response_data["error"]

    def test_create_milestone_missing_timestamp(self):
        """Test creating milestone without timestamp"""
        data = {
            "timestamp": None,
            "timezone": "UTC",
            "username": "user",
            "event_name": "Event",
        }
        response = self.client.post(
            reverse(MILESTONES_ENDPOINT),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 400
        response_data = json.loads(response.content)
        assert "Timestamp is required" in response_data["error"]

    def test_create_milestone_duplicate_event_name_same_user(self):
        """Test creating duplicate milestone for same user"""
        timestamp_ms = TEST_TIMESTAMP
        data = {
            "timestamp": timestamp_ms,
            "timezone": "UTC",
            "username": "user1",
            "event_name": "Event",
        }
        response1 = self.client.post(
            reverse(MILESTONES_ENDPOINT),
            data=json.dumps(data),
            content_type="application/json",
        )
        assert response1.status_code == 201

        response2 = self.client.post(
            reverse(MILESTONES_ENDPOINT),
            data=json.dumps(data),
            content_type="application/json",
        )
        assert response2.status_code == 400
        response_data = json.loads(response2.content)
        assert "already exists" in response_data["error"]

    def test_create_milestone_same_event_name_different_users(self):
        """Test creating same event name for different users"""
        timestamp_ms = TEST_TIMESTAMP
        data1 = {
            "timestamp": timestamp_ms,
            "timezone": "UTC",
            "username": "user1",
            "event_name": "Event",
        }
        data2 = {
            "timestamp": timestamp_ms,
            "timezone": "UTC",
            "username": "user2",
            "event_name": "Event",
        }

        response1 = self.client.post(
            reverse(MILESTONES_ENDPOINT),
            data=json.dumps(data1),
            content_type="application/json",
        )
        response2 = self.client.post(
            reverse(MILESTONES_ENDPOINT),
            data=json.dumps(data2),
            content_type="application/json",
        )

        assert response1.status_code == 201
        assert response2.status_code == 201
        assert Milestone.objects.count() == 2


@pytest.mark.django_db
class TestMilestoneListEndpoint:
    def setup_method(self):
        self.client = Client()

    def test_list_milestones_empty(self):
        """Test listing milestones when none exist"""
        response = self.client.get(reverse(MILESTONES_ENDPOINT), {"username": "user1"})

        assert response.status_code == 200
        response_data = json.loads(response.content)
        assert response_data == []

    def test_list_milestones_single(self):
        """Test listing with one milestone"""
        user = MilestoneUser.objects.create(username="user1")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="Event1",
            created_by=user,
        )

        response = self.client.get(reverse(MILESTONES_ENDPOINT), {"username": "user1"})

        assert response.status_code == 200
        response_data = json.loads(response.content)
        assert len(response_data) == 1
        assert response_data[0]["event_name"] == "Event1"

    def test_list_milestones_multiple(self):
        """Test listing multiple milestones"""
        user1 = MilestoneUser.objects.create(username="user1")
        user2 = MilestoneUser.objects.create(username="user2")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)

        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="Event1",
            created_by=user1,
        )
        Milestone.objects.create(
            event_timezone="America/New_York",
            event_datetime_utc=dt,
            event_name="Event2",
            created_by=user2,
        )

        response = self.client.get(reverse(MILESTONES_ENDPOINT), {"username": "user1"})

        assert response.status_code == 200
        response_data = json.loads(response.content)
        assert len(response_data) == 1
        assert response_data[0]["event_name"] == "Event1"

    def test_list_milestones_includes_required_fields(self):
        """Test that list response includes all required fields"""
        user = MilestoneUser.objects.create(username="user1")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="Event1",
            created_by=user,
        )

        response = self.client.get(reverse(MILESTONES_ENDPOINT), {"username": "user1"})

        assert response.status_code == 200
        response_data = json.loads(response.content)
        milestone = response_data[0]
        assert "id" in milestone
        assert "event_name" in milestone
        assert "event_datetime_utc" in milestone
        assert "event_timezone" in milestone
        assert "created" in milestone

    def test_list_milestones_empty_for_user_with_no_milestones(self):
        """Test that user with no milestones gets empty list"""
        user1 = MilestoneUser.objects.create(username="user1")
        MilestoneUser.objects.create(username="user2")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)

        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="User1Event",
            created_by=user1,
        )

        response = self.client.get(reverse(MILESTONES_ENDPOINT), {"username": "user2"})

        assert response.status_code == 200
        response_data = json.loads(response.content)
        assert response_data == []


@pytest.mark.django_db
class TestMilestoneUpdateEndpoint:
    def setup_method(self):
        self.client = Client()

    def test_update_milestone_event_name(self):
        """Test updating just the event name"""
        user = MilestoneUser.objects.create(username="user1")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="OldName",
            created_by=user,
        )

        data = {
            "username": "user1",
            "new_event_name": "NewName",
        }
        response = self.client.patch(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["OldName"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200
        response_data = json.loads(response.content)
        assert response_data["event_name"] == "NewName"
        assert response_data["event_timezone"] == "UTC"

    def test_update_milestone_timestamp(self):
        """Test updating just the timestamp"""
        user = MilestoneUser.objects.create(username="user1")
        old_dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=old_dt,
            event_name="Event",
            created_by=user,
        )

        new_timestamp_ms = 1800000000000
        data = {
            "username": "user1",
            "new_timestamp": new_timestamp_ms,
        }
        response = self.client.patch(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Event"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200
        response_data = json.loads(response.content)
        assert response_data["event_datetime_utc"] != old_dt.isoformat()

    def test_update_milestone_timezone(self):
        """Test updating just the timezone"""
        user = MilestoneUser.objects.create(username="user1")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="Event",
            created_by=user,
        )

        data = {
            "username": "user1",
            "new_timezone": "America/Chicago",
        }
        response = self.client.patch(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Event"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200
        response_data = json.loads(response.content)
        assert response_data["event_timezone"] == "America/Chicago"

    def test_update_milestone_all_fields(self):
        """Test updating all fields"""
        user = MilestoneUser.objects.create(username="user1")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="OldEvent",
            created_by=user,
        )

        new_timestamp_ms = 1800000000000
        data = {
            "username": "user1",
            "new_event_name": "NewEvent",
            "new_timestamp": new_timestamp_ms,
            "new_timezone": "Europe/Paris",
        }
        response = self.client.patch(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["OldEvent"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 200
        response_data = json.loads(response.content)
        assert response_data["event_name"] == "NewEvent"
        assert response_data["event_timezone"] == "Europe/Paris"

    def test_update_milestone_no_fields_provided(self):
        """Test update with no fields provided"""
        user = MilestoneUser.objects.create(username="user1")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="Event",
            created_by=user,
        )

        data = {
            "username": "user1",
        }
        response = self.client.patch(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Event"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 400
        response_data = json.loads(response.content)
        assert "At least one field" in response_data["error"]

    def test_update_milestone_nonexistent_user(self):
        """Test updating milestone for nonexistent user"""
        data = {
            "username": "nonexistent",
            "new_event_name": "NewName",
        }
        response = self.client.patch(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Event"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 404
        response_data = json.loads(response.content)
        assert "not found" in response_data["error"]

    def test_update_milestone_nonexistent_milestone(self):
        """Test updating nonexistent milestone"""
        MilestoneUser.objects.create(username="user1")

        data = {
            "username": "user1",
            "new_event_name": "NewName",
        }
        response = self.client.patch(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["NonexistentEvent"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 404
        response_data = json.loads(response.content)
        assert "not found" in response_data["error"]

    def test_update_milestone_duplicate_new_name(self):
        """Test updating to a name that already exists"""
        user = MilestoneUser.objects.create(username="user1")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="Event1",
            created_by=user,
        )
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="Event2",
            created_by=user,
        )

        data = {
            "username": "user1",
            "new_event_name": "Event1",
        }
        response = self.client.patch(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Event2"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 400
        response_data = json.loads(response.content)
        assert "already exists" in response_data["error"]


@pytest.mark.django_db
class TestMilestoneDeleteEndpoint:
    def setup_method(self):
        self.client = Client()

    def test_delete_milestone_success(self):
        """Test successfully deleting a milestone"""
        user = MilestoneUser.objects.create(username="user1")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="Event",
            created_by=user,
        )

        data = {
            "username": "user1",
        }
        response = self.client.delete(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Event"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 204
        assert Milestone.objects.count() == 0

    def test_delete_milestone_missing_username(self):
        """Test delete without username"""
        data = {
            "username": None,
        }
        response = self.client.delete(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Event"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 400
        response_data = json.loads(response.content)
        assert "Username is required" in response_data["error"]

    def test_delete_milestone_nonexistent_user(self):
        """Test deleting milestone for nonexistent user"""
        data = {
            "username": "nonexistent",
        }
        response = self.client.delete(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Event"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 404
        response_data = json.loads(response.content)
        assert "not found" in response_data["error"]

    def test_delete_milestone_nonexistent_milestone(self):
        """Test deleting nonexistent milestone"""
        MilestoneUser.objects.create(username="user1")

        data = {
            "username": "user1",
        }
        response = self.client.delete(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["NonexistentEvent"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 404
        response_data = json.loads(response.content)
        assert "not found" in response_data["error"]

    def test_delete_milestone_wrong_user(self):
        """Test deleting milestone owned by different user"""
        user1 = MilestoneUser.objects.create(username="user1")
        MilestoneUser.objects.create(username="user2")
        dt = datetime.fromtimestamp(1766248695, tz=timezone.utc)
        Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=dt,
            event_name="Event",
            created_by=user1,
        )

        data = {
            "username": "user2",
        }
        response = self.client.delete(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Event"]),
            data=json.dumps(data),
            content_type="application/json",
        )

        assert response.status_code == 404
        assert Milestone.objects.count() == 1


@pytest.mark.django_db
class TestMilestoneEndpointIntegration:
    def setup_method(self):
        self.client = Client()

    def test_full_crud_workflow(self):
        """Test complete create-read-update-delete workflow"""
        # Create
        create_data = {
            "timestamp": TEST_TIMESTAMP,
            "timezone": "UTC",
            "username": "user1",
            "event_name": "Birthday",
        }
        create_response = self.client.post(
            reverse(MILESTONES_ENDPOINT),
            data=json.dumps(create_data),
            content_type="application/json",
        )
        assert create_response.status_code == 201

        # Read
        list_response = self.client.get(
            reverse(MILESTONES_ENDPOINT), {"username": "user1"}
        )
        assert list_response.status_code == 200
        list_data = json.loads(list_response.content)
        assert len(list_data) == 1
        assert list_data[0]["event_name"] == "Birthday"

        # Update
        update_data = {
            "username": "user1",
            "new_event_name": "Updated Birthday",
        }
        update_response = self.client.patch(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Birthday"]),
            data=json.dumps(update_data),
            content_type="application/json",
        )
        assert update_response.status_code == 200
        update_response_data = json.loads(update_response.content)
        assert update_response_data["event_name"] == "Updated Birthday"

        # Verify update
        list_response = self.client.get(
            reverse(MILESTONES_ENDPOINT), {"username": "user1"}
        )
        list_data = json.loads(list_response.content)
        assert list_data[0]["event_name"] == "Updated Birthday"

        # Delete
        delete_data = {
            "username": "user1",
        }
        delete_response = self.client.delete(
            reverse(MODIFY_MILESTONES_ENDPOINT, args=["Updated Birthday"]),
            data=json.dumps(delete_data),
            content_type="application/json",
        )
        assert delete_response.status_code == 204

        # Verify deletion
        list_response = self.client.get(
            reverse(MILESTONES_ENDPOINT), {"username": "user1"}
        )
        list_data = json.loads(list_response.content)
        assert len(list_data) == 0
