# Generated manually for adding attendance status fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_merge_20250903_1844'),
    ]

    operations = [
        migrations.AddField(
            model_name='attendance',
            name='day_status',
            field=models.CharField(
                choices=[
                    ('complete_day', 'Complete Day'),
                    ('half_day', 'Half Day'),
                    ('absent', 'Absent')
                ],
                default='complete_day',
                max_length=15
            ),
        ),
        migrations.AddField(
            model_name='attendance',
            name='is_late',
            field=models.BooleanField(
                default=False,
                help_text='Whether employee came late'
            ),
        ),
        migrations.AddField(
            model_name='attendance',
            name='late_minutes',
            field=models.IntegerField(
                default=0,
                help_text='Minutes late from start time'
            ),
        ),
        migrations.AddField(
            model_name='workinghourssettings',
            name='late_coming_threshold',
            field=models.TimeField(
                default='12:30:00',
                help_text='Time after which check-in is considered late coming'
            ),
        ),
        migrations.AlterField(
            model_name='workinghourssettings',
            name='half_day_threshold',
            field=models.IntegerField(
                default=300,
                help_text='Minutes to consider half day (5 hours)'
            ),
        ),
    ]
