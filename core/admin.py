from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import (
    CustomUser, Office, Device, DeviceUser, Attendance, Leave, Document, 
    Notification, SystemSettings, AttendanceLog, ESSLAttendanceLog, 
    WorkingHoursSettings
)


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'address', 'email', 'phone']
    ordering = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'office', 'is_active', 'last_login']
    list_filter = ['role', 'office', 'is_active', 'department', 'created_at']
    search_fields = ['username', 'first_name', 'last_name', 'email', 'employee_id']
    ordering = ['username']
    readonly_fields = ['id', 'last_login', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone', 'address', 'date_of_birth', 'gender', 'profile_picture')}),
        ('Employment', {'fields': ('role', 'office', 'employee_id', 'biometric_id', 'joining_date', 'department', 'designation', 'salary')}),
        ('Emergency Contact', {'fields': ('emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship')}),
        ('Bank Details', {'fields': ('account_holder_name', 'bank_name', 'account_number', 'ifsc_code', 'bank_branch_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'office'),
        }),
    )


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ['name', 'device_type', 'ip_address', 'office', 'is_active', 'last_sync']
    list_filter = ['device_type', 'office', 'is_active', 'created_at']
    search_fields = ['name', 'ip_address', 'serial_number', 'location']
    ordering = ['name']
    readonly_fields = ['id', 'last_sync', 'created_at', 'updated_at']


@admin.register(DeviceUser)
class DeviceUserAdmin(admin.ModelAdmin):
    list_display = ['device_user_name', 'device_user_id', 'device', 'is_mapped', 'system_user', 'created_at']
    list_filter = ['device', 'is_mapped', 'device_user_privilege', 'created_at']
    search_fields = ['device_user_name', 'device_user_id', 'device__name']
    ordering = ['device', 'device_user_id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('device', 'device_user_id', 'device_user_name')}),
        ('Device User Details', {'fields': ('device_user_privilege', 'device_user_password', 'device_user_group', 'device_user_card')}),
        ('System Mapping', {'fields': ('system_user', 'is_mapped', 'mapping_notes')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'check_in_time', 'check_out_time', 'total_hours', 'status', 'device']
    list_filter = ['status', 'date', 'device', 'user__office']
    search_fields = ['user__first_name', 'user__last_name', 'user__employee_id', 'notes']
    ordering = ['-date', '-check_in_time']
    readonly_fields = ['id', 'total_hours', 'created_at', 'updated_at']
    date_hierarchy = 'date'


@admin.register(Leave)
class LeaveAdmin(admin.ModelAdmin):
    list_display = ['user', 'leave_type', 'start_date', 'end_date', 'total_days', 'status', 'approved_by']
    list_filter = ['leave_type', 'status', 'start_date', 'end_date', 'user__office']
    search_fields = ['user__first_name', 'user__last_name', 'reason']
    ordering = ['-created_at']
    readonly_fields = ['id', 'approved_at', 'created_at', 'updated_at']
    date_hierarchy = 'start_date'
    
    actions = ['approve_leaves', 'reject_leaves']
    
    def approve_leaves(self, request, queryset):
        updated = queryset.update(status='approved', approved_by=request.user)
        self.message_user(request, f'{updated} leave requests approved.')
    approve_leaves.short_description = "Approve selected leave requests"
    
    def reject_leaves(self, request, queryset):
        updated = queryset.update(status='rejected', approved_by=request.user)
        self.message_user(request, f'{updated} leave requests rejected.')
    reject_leaves.short_description = "Reject selected leave requests"


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'document_type', 'uploaded_by', 'created_at']
    list_filter = ['document_type', 'created_at', 'user__office']
    search_fields = ['title', 'description', 'user__first_name', 'user__last_name']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at', 'user__office']
    search_fields = ['title', 'message', 'user__first_name', 'user__last_name']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at']
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = "Mark selected notifications as unread"


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'description', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['key', 'description']
    ordering = ['key']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(AttendanceLog)
class AttendanceLogAdmin(admin.ModelAdmin):
    list_display = ['attendance', 'action', 'changed_by', 'created_at']
    list_filter = ['action', 'created_at', 'attendance__user__office']
    search_fields = ['attendance__user__first_name', 'attendance__user__last_name', 'action']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ESSLAttendanceLog)
class ESSLAttendanceLogAdmin(admin.ModelAdmin):
    list_display = ['biometric_id', 'device', 'user', 'punch_time', 'punch_type', 'is_processed']
    list_filter = ['device', 'punch_type', 'is_processed', 'created_at']
    search_fields = ['biometric_id', 'device__name', 'user__first_name', 'user__last_name']
    ordering = ['-punch_time']
    readonly_fields = ['id', 'created_at']
    list_editable = ['is_processed']


@admin.register(WorkingHoursSettings)
class WorkingHoursSettingsAdmin(admin.ModelAdmin):
    list_display = ['office', 'standard_hours', 'start_time', 'end_time', 'late_threshold']
    list_filter = ['office', 'created_at']
    search_fields = ['office__name']
    ordering = ['office__name']
    readonly_fields = ['id', 'created_at', 'updated_at']


# Customize admin site
admin.site.site_header = "Attendance System Administration"
admin.site.site_title = "Attendance System Admin"
admin.site.index_title = "Welcome to Attendance System Administration"
