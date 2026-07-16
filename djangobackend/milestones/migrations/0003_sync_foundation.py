import uuid

from django.db import migrations, models
from django.db.models import Q
import django.utils.timezone


def backfill_sync_fields(apps, schema_editor):
    Milestone = apps.get_model("milestones", "Milestone")
    for milestone in Milestone.objects.all().iterator():
        Milestone.objects.filter(pk=milestone.pk).update(
            public_id=uuid.uuid4(),
            updated_at=milestone.created,
            server_received_at=milestone.created,
        )


class Migration(migrations.Migration):
    dependencies = [("milestones", "0002_milestone_color")]

    operations = [
        migrations.AddField(
            model_name="milestoneuser",
            name="core_user_id",
            field=models.CharField(
                blank=True, max_length=255, null=True, unique=True
            ),
        ),
        migrations.AddField(
            model_name="milestone",
            name="public_id",
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.AddField(
            model_name="milestone",
            name="updated_at",
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name="milestone",
            name="deleted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="milestone",
            name="server_received_at",
            field=models.DateTimeField(null=True),
        ),
        migrations.RunPython(backfill_sync_fields, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="milestone",
            name="public_id",
            field=models.UUIDField(
                default=uuid.uuid4, editable=False, unique=True
            ),
        ),
        migrations.AlterField(
            model_name="milestone",
            name="updated_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name="milestone",
            name="server_received_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterUniqueTogether(
            name="milestone",
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name="milestone",
            constraint=models.UniqueConstraint(
                condition=Q(deleted_at__isnull=True),
                fields=("event_name", "created_by"),
                name="milestone_unique_active_name_per_user",
            ),
        ),
    ]
