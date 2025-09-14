from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import (
    CustomUser, Office, Device, DeviceUser, Attendance, Leave, Document, 
    Notification, SystemSettings, AttendanceLog, ESSLAttendanceLog, 
    WorkingHoursSettings, Resignation, DocumentTemplate, GeneratedDocument,
    Department, Designation
)


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'address', 'email', 'phone']
    ordering = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active', 'designation_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('name', 'description', 'is_active')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    actions = ['activate_departments', 'deactivate_departments']
    
    def designation_count(self, obj):
        """Show count of designations for this department"""
        count = obj.designations.count()
        return format_html(
            '<span style="color: blue;">{}</span> designations' if count > 0 
            else '<span style="color: gray;">No designations</span>',
            count
        )
    designation_count.short_description = "Designations"
    designation_count.admin_order_field = 'designations__count'
    
    def activate_departments(self, request, queryset):
        """Activate selected departments"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} departments activated.')
    activate_departments.short_description = "Activate selected departments"
    
    def deactivate_departments(self, request, queryset):
        """Deactivate selected departments"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} departments deactivated.')
    deactivate_departments.short_description = "Deactivate selected departments"


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'description', 'is_active', 'created_at']
    list_filter = ['department', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'department__name']
    ordering = ['department__name', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('name', 'department', 'description', 'is_active')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    actions = ['activate_designations', 'deactivate_designations']
    
    def get_queryset(self, request):
        """Optimize queryset with select_related for department"""
        return super().get_queryset(request).select_related('department')
    
    def activate_designations(self, request, queryset):
        """Activate selected designations"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} designations activated.')
    activate_designations.short_description = "Activate selected designations"
    
    def deactivate_designations(self, request, queryset):
        """Deactivate selected designations"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} designations deactivated.')
    deactivate_designations.short_description = "Deactivate selected designations"


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'office', 'aadhaar_card', 'pan_card', 'is_active', 'last_login']
    list_filter = ['role', 'office', 'is_active', 'department', 'created_at']
    search_fields = ['username', 'first_name', 'last_name', 'email', 'employee_id', 'aadhaar_card', 'pan_card']
    ordering = ['username']
    readonly_fields = ['id', 'last_login', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone', 'address', 'date_of_birth', 'gender', 'profile_picture')}),
        ('Government ID', {'fields': ('aadhaar_card', 'pan_card')}),
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
    list_display = ['user', 'date', 'check_in_time', 'check_out_time', 'total_hours', 'status', 'day_status', 'is_late', 'device']
    list_filter = ['status', 'day_status', 'is_late', 'date', 'device', 'user__office']
    search_fields = ['user__first_name', 'user__last_name', 'user__employee_id', 'notes']
    ordering = ['-date', '-check_in_time']
    readonly_fields = ['id', 'total_hours', 'day_status', 'is_late', 'late_minutes', 'created_at', 'updated_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        (None, {'fields': ('user', 'date', 'device')}),
        ('Time Records', {'fields': ('check_in_time', 'check_out_time', 'total_hours')}),
        ('Status Information', {'fields': ('status', 'day_status', 'is_late', 'late_minutes')}),
        ('Additional Info', {'fields': ('notes',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


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
    list_display = ['office', 'standard_hours', 'start_time', 'end_time', 'late_threshold', 'half_day_threshold', 'late_coming_threshold']
    list_filter = ['office', 'created_at']
    search_fields = ['office__name']
    ordering = ['office__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('office',)}),
        ('Working Hours', {'fields': ('standard_hours', 'start_time', 'end_time')}),
        ('Attendance Rules', {'fields': ('late_threshold', 'half_day_threshold', 'late_coming_threshold')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(Resignation)
class ResignationAdmin(admin.ModelAdmin):
    list_display = ['user', 'resignation_date', 'notice_period_days', 'status', 'approved_by', 'created_at']
    list_filter = ['status', 'resignation_date', 'created_at', 'user__office']
    search_fields = ['user__first_name', 'user__last_name', 'reason', 'approved_by__first_name', 'approved_by__last_name']
    ordering = ['-created_at']
    readonly_fields = ['id', 'last_working_date', 'approved_at', 'created_at', 'updated_at']
    date_hierarchy = 'resignation_date'
    
    fieldsets = (
        (None, {'fields': ('user', 'resignation_date', 'notice_period_days')}),
        ('Resignation Details', {'fields': ('reason', 'handover_notes', 'is_handover_completed')}),
        ('Approval Information', {'fields': ('status', 'approved_by', 'approved_at', 'rejection_reason')}),
        ('Calculated Fields', {'fields': ('last_working_date',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    actions = ['approve_resignations', 'reject_resignations']
    
    def approve_resignations(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status='pending').update(
            status='approved', 
            approved_by=request.user,
            approved_at=timezone.now()
        )
        self.message_user(request, f'{updated} resignation requests approved.')
    approve_resignations.short_description = "Approve selected resignation requests"
    
    def reject_resignations(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status='pending').update(
            status='rejected', 
            approved_by=request.user,
            approved_at=timezone.now()
        )
        self.message_user(request, f'{updated} resignation requests rejected.')
    reject_resignations.short_description = "Reject selected resignation requests"


@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'document_type', 'is_active', 'created_by', 'created_at']
    list_filter = ['document_type', 'is_active', 'created_at', 'created_by']
    search_fields = ['name', 'description', 'content']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('name', 'document_type', 'is_active')}),
        ('Template Content', {'fields': ('description', 'content')}),
        ('Template Data', {'fields': ('template_data',)}),
        ('Metadata', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(GeneratedDocument)
class GeneratedDocumentAdmin(admin.ModelAdmin):
    list_display = ['document_type', 'employee_name', 'employee', 'generated_at', 'has_pdf_file', 'is_sent']
    list_filter = ['document_type', 'generated_at', 'is_sent', 'employee__office']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id', 'document_type', 'title']
    ordering = ['-generated_at']
    readonly_fields = ['id', 'generated_at', 'pdf_file_size', 'pdf_file_exists']
    date_hierarchy = 'generated_at'
    
    fieldsets = (
        (None, {'fields': ('employee', 'template', 'document_type', 'title')}),
        ('Document Content', {'fields': ('content',)}),
        ('Document Data', {'fields': ('offer_data', 'increment_data', 'salary_data')}),
        ('PDF File', {'fields': ('pdf_file', 'pdf_file_size', 'pdf_file_exists')}),
        ('Email Status', {'fields': ('is_sent', 'sent_at', 'generated_by')}),
        ('Timestamps', {'fields': ('generated_at',)}),
    )
    
    def employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}" if obj.employee else "No Employee"
    employee_name.short_description = "Employee Name"
    employee_name.admin_order_field = 'employee__first_name'
    
    def has_pdf_file(self, obj):
        if obj.pdf_file:
            return format_html(
                '<span style="color: green;">✓ PDF Available</span>' if obj.pdf_file.size > 0 
                else '<span style="color: red;">✗ Empty File</span>'
            )
        return format_html('<span style="color: gray;">No PDF</span>')
    has_pdf_file.short_description = "PDF Status"
    
    def pdf_file_size(self, obj):
        if obj.pdf_file and obj.pdf_file.size > 0:
            size_kb = obj.pdf_file.size / 1024
            return f"{size_kb:.1f} KB"
        return "N/A"
    pdf_file_size.short_description = "PDF Size"
    
    def pdf_file_exists(self, obj):
        if obj.pdf_file:
            import os
            from django.conf import settings
            file_path = os.path.join(settings.MEDIA_ROOT, obj.pdf_file.name)
            exists = os.path.exists(file_path)
            return format_html(
                '<span style="color: green;">✓ Exists</span>' if exists 
                else '<span style="color: red;">✗ Missing</span>'
            )
        return format_html('<span style="color: gray;">No File</span>')
    pdf_file_exists.short_description = "File Exists"
    
    actions = ['regenerate_pdf', 'cleanup_orphaned_files']
    
    def regenerate_pdf(self, request, queryset):
        """Regenerate PDF files for selected documents"""
        from core.document_views import GeneratedDocumentViewSet
        viewset = GeneratedDocumentViewSet()
        count = 0
        
        for document in queryset:
            try:
                # Clear existing PDF file to force regeneration
                document.pdf_file = None
                document.save(update_fields=['pdf_file'])
                count += 1
            except Exception as e:
                self.message_user(request, f'Error regenerating PDF for document {document.id}: {e}', level='ERROR')
        
        self.message_user(request, f'{count} documents marked for PDF regeneration.')
    regenerate_pdf.short_description = "Regenerate PDF files"
    
    def cleanup_orphaned_files(self, request, queryset):
        """Clean up orphaned file references"""
        from core.document_views import GeneratedDocumentViewSet
        viewset = GeneratedDocumentViewSet()
        count = 0
        
        for document in queryset:
            if viewset.cleanup_orphaned_files(document):
                count += 1
        
        self.message_user(request, f'{count} orphaned file references cleaned up.')
    cleanup_orphaned_files.short_description = "Clean up orphaned files"


# Customize admin site
admin.site.site_header = "Attendance System Administration"
admin.site.site_title = "Attendance System Admin"
admin.site.index_title = "Welcome to Attendance System Administration"
