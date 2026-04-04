from django.contrib import admin

from .models import FamilyMember, Meeting, Contribution


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'is_host', 'is_active', 'parent', 'created_at')
    list_filter = ('is_host', 'is_active')
    search_fields = ('name', 'email', 'phone')
    raw_id_fields = ('parent',)


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'date', 'host', 'status', 'savings_percentage', 'created_at')
    list_filter = ('status', 'month', 'year')
    search_fields = ('host__name', 'notes')
    date_hierarchy = 'date'


@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ('member', 'meeting', 'amount', 'saved_amount', 'host_amount', 'date')
    list_filter = ('meeting__year', 'meeting__month')
    search_fields = ('member__name', 'notes')
    date_hierarchy = 'date'
