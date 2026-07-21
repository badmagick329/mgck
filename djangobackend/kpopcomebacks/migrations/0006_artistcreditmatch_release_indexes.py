# Generated manually for the K-pop following performance migration.

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("kpopcomebacks", "0005_artist_public_id"),
    ]

    operations = [
        migrations.CreateModel(
            name="ArtistCreditMatch",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "credited_artist",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="followed_by_matches",
                        to="kpopcomebacks.artist",
                    ),
                ),
                (
                    "followed_artist",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="credit_matches",
                        to="kpopcomebacks.artist",
                    ),
                ),
            ],
        ),
        migrations.AddIndex(
            model_name="artistcreditmatch",
            index=models.Index(
                fields=["followed_artist"], name="artist_credit_followed_idx"
            ),
        ),
        migrations.AddConstraint(
            model_name="artistcreditmatch",
            constraint=models.UniqueConstraint(
                fields=("followed_artist", "credited_artist"),
                name="unique_artist_credit_match",
            ),
        ),
        migrations.AddIndex(
            model_name="release",
            index=models.Index(
                fields=["artist", "release_date", "id"],
                name="release_artist_date_id_idx",
            ),
        ),
    ]
