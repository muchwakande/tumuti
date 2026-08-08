import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_remove_savings_percentage'),
    ]

    operations = [
        migrations.CreateModel(
            name='WelfareEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(
                    choices=[('wedding', 'Wedding'), ('graduation', 'Graduation'), ('death', 'Death')],
                    max_length=20,
                )),
                ('date', models.DateField()),
                ('contribution_expected', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('member', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='welfare_events',
                    to='core.familymember',
                )),
            ],
            options={
                'db_table': 'welfare_events',
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='Payout',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('paid', 'Paid')],
                    default='pending',
                    max_length=10,
                )),
                ('paid_date', models.DateField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('welfare_event', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='payout',
                    to='core.welfareevent',
                )),
            ],
            options={
                'db_table': 'payouts',
            },
        ),
    ]
