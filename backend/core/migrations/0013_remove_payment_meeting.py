import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_data_migrate_payment_meeting_to_generic'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='payment',
            name='meeting',
        ),
        migrations.AlterField(
            model_name='payment',
            name='content_type',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='+',
                to='contenttypes.contenttype',
            ),
        ),
        migrations.AlterField(
            model_name='payment',
            name='object_id',
            field=models.PositiveIntegerField(),
        ),
        migrations.AddIndex(
            model_name='payment',
            index=models.Index(fields=['content_type', 'object_id'], name='payments_content_d0efb3_idx'),
        ),
    ]
