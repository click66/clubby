# Generated by Django 4.1.3 on 2023-09-28 14:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sjcadmin', '0013_student__creator_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='active',
            field=models.BooleanField(default=True),
        ),
    ]
