# Generated by Django 4.1.3 on 2022-12-27 14:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sjcadmin', '0008_attendance__course_payment__course_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='_courses',
            field=models.ManyToManyField(to='sjcadmin.course'),
        ),
    ]
