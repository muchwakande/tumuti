from django.contrib import admin

from .models import FamilyMember, Meeting


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
