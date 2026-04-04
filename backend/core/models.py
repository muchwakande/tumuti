from django.db import models
from decimal import Decimal


class FamilyMember(models.Model):
    """A family member who can optionally be a host."""

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20)
    is_host = models.BooleanField(default=False)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
    )
    spouse = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='spouse_of',
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def spouse_name(self) -> 'str | None':
        return self.spouse.name if self.spouse_id else None

    class Meta:
        db_table = 'family_members'
        ordering = ['name']

    def __str__(self):
        return self.name


class Meeting(models.Model):
    """A family reunion meeting held in April, August, or December."""

    class Month(models.IntegerChoices):
        APRIL = 4, 'April'
        AUGUST = 8, 'August'
        DECEMBER = 12, 'December'

    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    year = models.IntegerField()
    month = models.IntegerField(choices=Month.choices)
    date = models.DateField()
    host = models.ForeignKey(
        FamilyMember,
        on_delete=models.PROTECT,
        related_name='hosted_meetings',
        limit_choices_to={'is_host': True},
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    savings_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('30.00'))
    expected_contribution = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('1000.00'))
    notes = models.TextField(blank=True)
    minutes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meetings'
        ordering = ['-year', '-month']
        unique_together = ('year', 'month')

    def __str__(self):
        return f"{self.get_month_display()} {self.year}"

    @property
    def total_collected(self) -> Decimal:
        result = self.payments.aggregate(total=models.Sum('amount'))['total']
        return result or Decimal('0.00')

    @property
    def total_saved(self) -> Decimal:
        return (self.total_collected * self.savings_percentage / Decimal('100')).quantize(Decimal('0.01'))

    @property
    def total_to_host(self) -> Decimal:
        return self.total_collected - self.total_saved


class Attendance(models.Model):
    """Records whether a family member attended a specific meeting."""

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='attendances')
    member = models.ForeignKey(FamilyMember, on_delete=models.CASCADE, related_name='attendances')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance'
        unique_together = ('meeting', 'member')

    def __str__(self):
        return f"{self.member.name} @ {self.meeting}"


class Payment(models.Model):
    """An individual payment made by a member towards a meeting's contribution."""

    class Method(models.TextChoices):
        CASH = 'cash', 'Cash'
        MPESA = 'mpesa', 'MPESA'

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='payments')
    member = models.ForeignKey(FamilyMember, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    method = models.CharField(max_length=10, choices=Method.choices, default=Method.CASH)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.member.name} – {self.method} {self.amount} @ {self.meeting}"
