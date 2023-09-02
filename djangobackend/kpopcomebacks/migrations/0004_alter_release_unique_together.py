# Generated by Django 4.2.2 on 2023-07-26 21:38

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("kpopcomebacks", "0003_release_reddit_urls"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="release",
            unique_together={
                ("artist", "album", "title", "release_date", "release_type")
            },
        ),
    ]