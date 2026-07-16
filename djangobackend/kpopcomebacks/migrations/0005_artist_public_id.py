import uuid

from django.db import migrations, models


def populate_artist_public_ids(apps, schema_editor):
    Artist = apps.get_model("kpopcomebacks", "Artist")
    for artist in Artist.objects.filter(public_id__isnull=True).iterator():
        artist.public_id = uuid.uuid4()
        artist.save(update_fields=["public_id"])


class Migration(migrations.Migration):
    dependencies = [
        ("kpopcomebacks", "0004_alter_release_unique_together"),
    ]

    operations = [
        migrations.AddField(
            model_name="artist",
            name="public_id",
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.RunPython(populate_artist_public_ids, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="artist",
            name="public_id",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
