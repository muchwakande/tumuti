from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='FamilyMember',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(blank=True, max_length=254, null=True, unique=True)),
                ('phone', models.CharField(max_length=20)),
                ('is_host', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='children',
                    to='core.familymember',
                )),
            ],
            options={
                'db_table': 'family_members',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Meeting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField()),
                ('month', models.IntegerField(choices=[(4, 'April'), (8, 'August'), (12, 'December')])),
                ('date', models.DateField()),
                ('status', models.CharField(
                    choices=[('scheduled', 'Scheduled'), ('completed', 'Completed'), ('cancelled', 'Cancelled')],
                    default='scheduled',
                    max_length=20,
                )),
                ('savings_percentage', models.DecimalField(decimal_places=2, default=Decimal('30.00'), max_digits=5)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('host', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='hosted_meetings',
                    to='core.familymember',
                )),
            ],
            options={
                'db_table': 'meetings',
                'ordering': ['-year', '-month'],
                'unique_together': {('year', 'month')},
            },
        ),
        migrations.CreateModel(
            name='Contribution',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('saved_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=15)),
                ('host_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=15)),
                ('notes', models.TextField(blank=True)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('meeting', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='contributions',
                    to='core.meeting',
                )),
                ('member', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='contributions',
                    to='core.familymember',
                )),
            ],
            options={
                'db_table': 'contributions',
                'ordering': ['-date'],
                'unique_together': {('meeting', 'member')},
            },
        ),
    ]
