import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('core', '0010_add_welfare_event_and_payout'),
    ]

    operations = [
        # Relax 'meeting' to nullable so that reversing the removal in
        # 0013 (which re-adds this field) doesn't hit a NOT NULL violation
        # before 0012's reverse has a chance to repopulate it.
        migrations.AlterField(
            model_name='payment',
            name='meeting',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='payments',
                to='core.meeting',
            ),
        ),
        # Nullable for now so existing rows can be backfilled by the next
        # migration before content_type/object_id are required.
        migrations.AddField(
            model_name='payment',
            name='content_type',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='+',
                to='contenttypes.contenttype',
            ),
        ),
        migrations.AddField(
            model_name='payment',
            name='object_id',
            field=models.PositiveIntegerField(null=True),
        ),
    ]
