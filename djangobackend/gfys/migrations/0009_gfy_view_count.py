from django.db import migrations, models
from django.db.models import Count, OuterRef, Subquery
from django.db.models.functions import Coalesce


def fold_views_into_counter(apps, schema_editor):
    Gfy = apps.get_model("gfys", "Gfy")
    GfyView = apps.get_model("gfys", "GfyView")
    per_gfy = (
        GfyView.objects.filter(gfy=OuterRef("pk"))
        .order_by()
        .values("gfy")
        .annotate(total=Count("id"))
        .values("total")
    )
    Gfy.objects.update(view_count=Coalesce(Subquery(per_gfy), 0))


class Migration(migrations.Migration):
    """MGK-19: keep one bounded counter per Gfy instead of a row per view."""

    dependencies = [
        ("gfys", "0008_gfy_height_gfy_width"),
    ]

    operations = [
        migrations.AddField(
            model_name="gfy",
            name="view_count",
            field=models.PositiveBigIntegerField(db_default=0, default=0),
        ),
        # The retired rows stay, so reversing only drops the counter.
        migrations.RunPython(
            fold_views_into_counter, migrations.RunPython.noop
        ),
    ]
