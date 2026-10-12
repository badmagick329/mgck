from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class TestViewCountMigration(TransactionTestCase):
    """MGK-19: existing per-view rows become each Gfy's counter."""

    migrate_from = ("gfys", "0008_gfy_height_gfy_width")
    migrate_to = ("gfys", "0009_gfy_view_count")

    def setUp(self):
        executor = MigrationExecutor(connection)
        executor.migrate([self.migrate_from])
        old_apps = executor.loader.project_state([self.migrate_from]).apps
        Gfy = old_apps.get_model("gfys", "Gfy")
        GfyView = old_apps.get_model("gfys", "GfyView")
        viewed = Gfy.objects.create(
            imgur_id="viewed", object_id="viewed", imgur_title="Viewed"
        )
        Gfy.objects.create(
            imgur_id="unseen", object_id="unseen", imgur_title="Unseen"
        )
        GfyView.objects.bulk_create([GfyView(gfy=viewed) for _ in range(3)])

        executor = MigrationExecutor(connection)
        executor.migrate([self.migrate_to])
        self.apps = executor.loader.project_state([self.migrate_to]).apps

    def test_folds_existing_views_into_the_counter(self):
        Gfy = self.apps.get_model("gfys", "Gfy")

        counts = dict(Gfy.objects.values_list("imgur_id", "view_count"))

        self.assertEqual(counts, {"viewed": 3, "unseen": 0})

    def test_inserts_without_the_column_still_work_after_a_rollback(self):
        # The previous image does not know view_count; db_default must cover it.
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO gfys_gfy (object_id, imgur_id, imgur_title) "
                "VALUES ('old-image', 'old-image', 'Old image') RETURNING view_count"
            )
            self.assertEqual(cursor.fetchone()[0], 0)
