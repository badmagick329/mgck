# Generated by Django 4.2.3 on 2023-09-05 16:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gfys', '0002_alter_gfy_options_alter_tag_options_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gfy',
            name='tags',
            field=models.ManyToManyField(related_name='gfys', to='gfys.tag'),
        ),
    ]
