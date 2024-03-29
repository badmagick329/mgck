# Generated by Django 4.2.3 on 2023-12-12 15:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("gfys", "0005_gfyuser"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="gfy",
            unique_together=set(),
        ),
        migrations.AddField(
            model_name="gfy",
            name="object_id",
            field=models.CharField(
                blank=True, default=None, max_length=20, null=True, unique=True
            ),
        ),
        migrations.AddField(
            model_name="gfy",
            name="video_id",
            field=models.CharField(
                blank=True, default=None, max_length=20, null=True, unique=True
            ),
        ),
        migrations.AlterField(
            model_name="gfy",
            name="imgur_id",
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
    ]
