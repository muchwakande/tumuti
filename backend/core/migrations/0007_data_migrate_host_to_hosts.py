from django.db import migrations


def copy_host_to_hosts(apps, schema_editor):
    Meeting = apps.get_model('core', 'Meeting')
    for meeting in Meeting.objects.exclude(host_id=None):
        meeting.hosts.add(meeting.host_id)


def reverse_hosts_to_host(apps, schema_editor):
    Meeting = apps.get_model('core', 'Meeting')
    for meeting in Meeting.objects.prefetch_related('hosts'):
        first_host = meeting.hosts.first()
        if first_host:
            Meeting.objects.filter(pk=meeting.pk).update(host_id=first_host.pk)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_add_hosts_m2m'),
    ]

    operations = [
        migrations.RunPython(copy_host_to_hosts, reverse_hosts_to_host),
    ]
