from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_meeting_minutes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='familymember',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
