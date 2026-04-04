from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_refactor_payments'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='minutes',
            field=models.TextField(blank=True, default=''),
            preserve_default=False,
        ),
    ]
