from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_data_migrate_host_to_hosts'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='meeting',
            name='host',
        ),
    ]
