# Generated by Django 4.2.3 on 2023-09-01 22:53

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("gfys", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="gfy",
            options={"ordering": ["-date"]},
        ),
        migrations.AlterModelOptions(
            name="tag",
            options={"ordering": ["name"]},
        ),
        migrations.AlterUniqueTogether(
            name="gfy",
            unique_together={("imgur_id",)},
        ),
        migrations.AlterUniqueTogether(
            name="tag",
            unique_together={("name",)},
        ),
    ]
