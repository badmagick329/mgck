# Generated by Django 4.2.3 on 2023-09-01 22:19

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Tag",
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
                ("name", models.CharField(max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name="Gfy",
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
                ("imgur_id", models.CharField(max_length=20)),
                ("gfy_id", models.CharField(blank=True, max_length=100, null=True)),
                ("imgur_title", models.CharField(max_length=255)),
                ("gfy_title", models.CharField(blank=True, max_length=255, null=True)),
                ("date", models.DateField(blank=True, null=True)),
                (
                    "tags",
                    models.ManyToManyField(
                        blank=True, null=True, related_name="gfys", to="gfys.tag"
                    ),
                ),
            ],
        ),
    ]
