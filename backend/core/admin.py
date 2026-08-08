from django.contrib import admin

from .models import FamilyMember, Meeting, WelfareEvent, Payout


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'is_host', 'is_active', 'parent', 'created_at')
    list_filter = ('is_host', 'is_active')
    search_fields = ('name', 'email', 'phone')
    raw_id_fields = ('parent',)


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'date', 'status', 'created_at')
    list_filter = ('status', 'month', 'year')
    search_fields = ('notes',)
    date_hierarchy = 'date'


@admin.register(WelfareEvent)
class WelfareEventAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'member', 'event_type', 'date', 'contribution_expected')
    list_filter = ('event_type',)
    search_fields = ('member__name', 'notes')
    date_hierarchy = 'date'


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ('welfare_event', 'amount', 'status', 'paid_date')
    list_filter = ('status',)
