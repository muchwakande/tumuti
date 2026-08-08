from django.db import migrations


def copy_meeting_to_generic(apps, schema_editor):
    Payment = apps.get_model('core', 'Payment')
    ContentType = apps.get_model('contenttypes', 'ContentType')
    meeting_ct, _ = ContentType.objects.get_or_create(app_label='core', model='meeting')
    for payment in Payment.objects.all():
        payment.content_type = meeting_ct
        payment.object_id = payment.meeting_id
        payment.save(update_fields=['content_type', 'object_id'])


def copy_generic_to_meeting(apps, schema_editor):
    Payment = apps.get_model('core', 'Payment')
    for payment in Payment.objects.all():
        payment.meeting_id = payment.object_id
        payment.save(update_fields=['meeting_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_payment_add_generic_target'),
    ]

    operations = [
        migrations.RunPython(copy_meeting_to_generic, copy_generic_to_meeting),
    ]
