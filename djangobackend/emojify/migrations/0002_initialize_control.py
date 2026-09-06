from django.db import migrations


def create_control(apps, schema_editor):
    apps.get_model('emojify', 'AiControl').objects.using(schema_editor.connection.alias).create(pk=1, enabled=False)


class Migration(migrations.Migration):
    dependencies = [('emojify', '0001_initial')]
    operations = [migrations.RunPython(create_control, migrations.RunPython.noop)]
