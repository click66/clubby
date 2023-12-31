# Generated by Django 4.1.3 on 2023-02-11 11:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sjcadmin', '0009_student__courses'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='_creator',
            field=models.UUIDField(db_column='creator_id', null=True),
        ),
        migrations.RunSQL('ALTER TABLE sjcadmin_note DROP COLUMN author_id'),
        migrations.AddField(
            model_name='note',
            name='_author',
            field=models.UUIDField(db_column='author_id', null=True),
        ),
    ]
