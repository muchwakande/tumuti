from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_remove_host_fk'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='meeting',
            name='savings_percentage',
        ),
    ]
