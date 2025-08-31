from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import (
    CustomUser, Attendance, Leave, Document, Notification, AttendanceLog
)


@receiver(post_save, sender=Attendance)
def create_attendance_log(sender, instance, created, **kwargs):
    """Create attendance log when attendance is created or updated"""
    if created:
        action = 'created'
        old_values = None
        new_values = {
            'user': instance.user.get_full_name(),
            'date': instance.date.isoformat(),
            'status': instance.status,
            'check_in_time': instance.check_in_time.isoformat() if instance.check_in_time else None,
            'check_out_time': instance.check_out_time.isoformat() if instance.check_out_time else None,
        }
    else:
        action = 'updated'
        old_values = {
            'user': instance.user.get_full_name(),
            'date': instance.date.isoformat(),
            'status': instance.status,
            'check_in_time': instance.check_in_time.isoformat() if instance.check_in_time else None,
            'check_out_time': instance.check_out_time.isoformat() if instance.check_out_time else None,
        }
        new_values = old_values.copy()
    
    # Get the user who made the change (for now, assume it's the attendance user)
    changed_by = instance.user
    
    AttendanceLog.objects.create(
        attendance=instance,
        action=action,
        old_values=old_values,
        new_values=new_values,
        changed_by=changed_by
    )


@receiver(post_save, sender=Leave)
def create_leave_notification(sender, instance, created, **kwargs):
    """Create notifications for leave requests"""
    if created:
        # Notify manager about new leave request
        if instance.user.office and instance.user.office:
            managers = CustomUser.objects.filter(
                office=instance.user.office,
                role='manager',
                is_active=True
            )
            
            for manager in managers:
                Notification.objects.create(
                    user=manager,
                    title=f"New Leave Request - {instance.user.get_full_name()}",
                    message=f"{instance.user.get_full_name()} has requested {instance.total_days} days of {instance.leave_type} from {instance.start_date} to {instance.end_date}.",
                    notification_type='leave'
                )
    
    elif instance.status in ['approved', 'rejected'] and instance.approved_by:
        # Notify employee about leave approval/rejection
        status_text = "approved" if instance.status == 'approved' else "rejected"
        message = f"Your leave request for {instance.total_days} days of {instance.leave_type} has been {status_text}."
        
        if instance.status == 'rejected' and instance.rejection_reason:
            message += f" Reason: {instance.rejection_reason}"
        
        Notification.objects.create(
            user=instance.user,
            title=f"Leave Request {instance.status.title()}",
            message=message,
            notification_type='leave'
        )


@receiver(post_save, sender=Document)
def create_document_notification(sender, instance, created, **kwargs):
    """Create notifications for document uploads"""
    if created:
        # Notify user about document upload
        Notification.objects.create(
            user=instance.user,
            title=f"Document Uploaded - {instance.title}",
            message=f"Your document '{instance.title}' has been successfully uploaded.",
            notification_type='document'
        )


@receiver(post_save, sender=CustomUser)
def create_welcome_notification(sender, instance, created, **kwargs):
    """Create welcome notification for new users"""
    if created:
        Notification.objects.create(
            user=instance,
            title="Welcome to Attendance System",
            message=f"Welcome {instance.get_full_name()}! Your account has been created successfully. You can now access the system.",
            notification_type='system'
        )


@receiver(post_save, sender=Attendance)
def create_attendance_notification(sender, instance, created, **kwargs):
    """Create notifications for attendance records"""
    if created and instance.status == 'absent':
        # Notify manager about absent employee
        if instance.user.office:
            managers = CustomUser.objects.filter(
                office=instance.user.office,
                role='manager',
                is_active=True
            )
            
            for manager in managers:
                Notification.objects.create(
                    user=manager,
                    title=f"Employee Absent - {instance.user.get_full_name()}",
                    message=f"{instance.user.get_full_name()} was absent on {instance.date}.",
                    notification_type='attendance'
                )
