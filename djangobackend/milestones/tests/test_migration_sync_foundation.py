from datetime import datetime, timezone

from django.db import IntegrityError, connection, transaction
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class TestSyncFoundationMigration(TransactionTestCase):
    migrate_from = ("milestones", "0002_milestone_color")
    migrate_to = ("milestones", "0003_sync_foundation")

    def setUp(self):
        executor = MigrationExecutor(connection)
        executor.migrate([self.migrate_from])
        old_apps = executor.loader.project_state([self.migrate_from]).apps
        MilestoneUser = old_apps.get_model("milestones", "MilestoneUser")
        Milestone = old_apps.get_model("milestones", "Milestone")
        owner = MilestoneUser.objects.create(username="legacy-user")
        self.event_datetime = datetime(2030, 1, 1, tzinfo=timezone.utc)
        legacy = Milestone.objects.create(
            event_timezone="Europe/London",
            event_datetime_utc=self.event_datetime,
            event_name="Legacy event",
            color="#abcdef",
            created_by=owner,
        )
        self.legacy_created = legacy.created

        executor = MigrationExecutor(connection)
        executor.migrate([self.migrate_to])
        self.apps = executor.loader.project_state([self.migrate_to]).apps

    def test_backfills_identity_and_timestamps_without_losing_data(self):
        MilestoneUser = self.apps.get_model("milestones", "MilestoneUser")
        Milestone = self.apps.get_model("milestones", "Milestone")
        owner = MilestoneUser.objects.get(username="legacy-user")
        milestone = Milestone.objects.get(created_by=owner)

        self.assertIsNone(owner.core_user_id)
        self.assertIsNotNone(milestone.public_id)
        self.assertEqual(milestone.event_name, "Legacy event")
        self.assertEqual(milestone.event_datetime_utc, self.event_datetime)
        self.assertEqual(milestone.event_timezone, "Europe/London")
        self.assertEqual(milestone.color, "#abcdef")
        self.assertEqual(milestone.updated_at, self.legacy_created)
        self.assertEqual(milestone.server_received_at, self.legacy_created)
        self.assertIsNone(milestone.deleted_at)

    def test_active_name_constraint_allows_tombstoned_name_reuse(self):
        MilestoneUser = self.apps.get_model("milestones", "MilestoneUser")
        Milestone = self.apps.get_model("milestones", "Milestone")
        owner = MilestoneUser.objects.get(username="legacy-user")
        original = Milestone.objects.get(created_by=owner)
        original.deleted_at = original.updated_at
        original.save(update_fields=["deleted_at"])

        replacement = Milestone.objects.create(
            event_timezone="UTC",
            event_datetime_utc=self.event_datetime,
            event_name="Legacy event",
            created_by=owner,
        )
        self.assertIsNotNone(replacement.pk)

        with self.assertRaises(IntegrityError), transaction.atomic():
            Milestone.objects.create(
                event_timezone="UTC",
                event_datetime_utc=self.event_datetime,
                event_name="Legacy event",
                created_by=owner,
            )
