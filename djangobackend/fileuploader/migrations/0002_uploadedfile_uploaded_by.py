# Generated by Django 4.2.2 on 2023-07-15 23:43

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("fileuploader", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="uploadedfile",
            name="uploaded_by",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="uploaded_files",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
