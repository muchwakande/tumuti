from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_add_spouse'),
    ]

    operations = [
        # Drop the old Contribution model
        migrations.DeleteModel(name='Contribution'),

        # Add expected_contribution to Meeting
        migrations.AddField(
            model_name='meeting',
            name='expected_contribution',
            field=models.DecimalField(decimal_places=2, default=Decimal('1000.00'), max_digits=15),
        ),

        # Create Attendance
        migrations.CreateModel(
            name='Attendance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('meeting', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='attendances',
                    to='core.meeting',
                )),
                ('member', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='attendances',
                    to='core.familymember',
                )),
            ],
            options={
                'db_table': 'attendance',
                'unique_together': {('meeting', 'member')},
            },
        ),

        # Create Payment
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('method', models.CharField(
                    choices=[('cash', 'Cash'), ('mpesa', 'MPESA')],
                    default='cash',
                    max_length=10,
                )),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('meeting', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='payments',
                    to='core.meeting',
                )),
                ('member', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='payments',
                    to='core.familymember',
                )),
            ],
            options={
                'db_table': 'payments',
                'ordering': ['created_at'],
            },
        ),
    ]
