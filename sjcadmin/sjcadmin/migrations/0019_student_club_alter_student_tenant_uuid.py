# Generated by Django 4.1.3 on 2023-11-05 10:29

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('sjcadmin', '0018_course_dates'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='club',
            field=models.ForeignKey(db_column='club_uuid', default='7fe20f85-c6b0-4c67-8b68-c033367c92a5', on_delete=django.db.models.deletion.RESTRICT, to='sjcadmin.tenant'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='student',
            name='tenant_uuid',
            field=models.UUIDField(db_column='tenant_uuid', null=True),
        ),
        migrations.RunSQL('UPDATE sjcadmin_student SET club_uuid = COALESCE(tenant_uuid, \'7fe20f85-c6b0-4c67-8b68-c033367c92a5\')'),
    ]