from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_remove_email_unique'),
    ]

    operations = [
        migrations.AddField(
            model_name='meeting',
            name='hosts',
            field=models.ManyToManyField(
                blank=True,
                related_name='hosting_meetings',
                to='core.familymember',
            ),
        ),
    ]
