from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from decimal import Decimal


class FamilyMember(models.Model):
    """A family member who can optionally be a host."""

    name = models.CharField(max_length=255)
    email = models.EmailField(null=True, blank=True)
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
    hosts = models.ManyToManyField(
        FamilyMember,
        related_name='hosting_meetings',
        blank=True,
    )
    SAVINGS_PER_MEMBER = Decimal('200.00')

    payments = GenericRelation('Payment')

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
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
        """Sum of each member's savings portion (min of what they paid vs Ksh 200)."""
        member_totals = self.payments.values('member_id').annotate(total=models.Sum('amount'))
        return sum(
            (min(row['total'], self.SAVINGS_PER_MEMBER) for row in member_totals),
            Decimal('0.00'),
        )

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
    """An individual payment made by a member towards a meeting's or welfare event's contribution."""

    class Method(models.TextChoices):
        CASH = 'cash', 'Cash'
        MPESA = 'mpesa', 'MPESA'

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name='+')
    object_id = models.PositiveIntegerField()
    target = GenericForeignKey('content_type', 'object_id')
    member = models.ForeignKey(FamilyMember, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    method = models.CharField(max_length=10, choices=Method.choices, default=Method.CASH)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['created_at']
        indexes = [models.Index(fields=['content_type', 'object_id'])]

    def __str__(self):
        return f"{self.member.name} – {self.method} {self.amount} @ {self.target}"


class WelfareEvent(models.Model):
    """A wedding, graduation, or death recorded for a family member."""

    class EventType(models.TextChoices):
        WEDDING = 'wedding', 'Wedding'
        GRADUATION = 'graduation', 'Graduation'
        DEATH = 'death', 'Death'

    member = models.ForeignKey(FamilyMember, on_delete=models.PROTECT, related_name='welfare_events')
    event_type = models.CharField(max_length=20, choices=EventType.choices)
    date = models.DateField()
    contribution_expected = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    contributions = GenericRelation(Payment)

    class Meta:
        db_table = 'welfare_events'
        ordering = ['-date']

    def __str__(self):
        return f"{self.get_event_type_display()} – {self.member.name} ({self.date})"

    @property
    def total_contributed(self) -> Decimal:
        result = self.contributions.aggregate(total=models.Sum('amount'))['total']
        return result or Decimal('0.00')


class Payout(models.Model):
    """A disbursement from joint savings towards a welfare event, at most one per event."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PAID = 'paid', 'Paid'

    welfare_event = models.OneToOneField(WelfareEvent, on_delete=models.CASCADE, related_name='payout')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    paid_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payouts'

    def __str__(self):
        return f"Payout {self.amount} – {self.welfare_event}"
