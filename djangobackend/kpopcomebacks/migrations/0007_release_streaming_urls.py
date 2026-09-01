from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("kpopcomebacks", "0006_artistcreditmatch_release_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="release",
            name="apple_music_urls",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="release",
            name="spotify_urls",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
