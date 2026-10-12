from django.db import migrations


class Migration(migrations.Migration):
    """MGK-22: drop the per-view rows MGK-19 folded into Gfy.view_count."""

    dependencies = [
        ("gfys", "0009_gfy_view_count"),
    ]

    operations = [
        migrations.DeleteModel(
            name="GfyView",
        ),
    ]
