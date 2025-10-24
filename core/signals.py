from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import (
    CustomUser, Attendance, Leave, Document, Notification, AttendanceLog, Resignation, Device
)
from .consumers import broadcast_attendance_update_sync
from .notification_service import (
    notify_attendance_late, notify_employee_absent, notify_leave_request,
    notify_leave_decision, notify_resignation_request, notify_device_offline,
    notify_system_alert, RoleBasedNotificationService
)
import logging

logger = logging.getLogger(__name__)


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
        # Notify managers about new leave request
        notify_leave_request(instance)
    elif instance.status in ['approved', 'rejected'] and instance.approved_by:
        # Notify employee about leave decision
        notify_leave_decision(instance, instance.status == 'approved')


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
        RoleBasedNotificationService.create_role_notification(
            instance,
            'user_registered' if instance.role == 'admin' else 'system_alert',
            user_name=instance.get_full_name()
        )


@receiver(post_save, sender=Resignation)
def create_resignation_notification(sender, instance, created, **kwargs):
    """Create notifications for resignation requests"""
    if created:
        # Notify managers about resignation request
        notify_resignation_request(instance)
    elif instance.status in ['approved', 'rejected'] and instance.approved_by:
        # Notify employee about resignation decision
        RoleBasedNotificationService.create_role_notification(
            instance.user,
            'resignation_approved' if instance.status == 'approved' else 'resignation_rejected',
            resignation_date=instance.resignation_date,
            last_working_date=instance.last_working_date,
            created_by=instance.approved_by
        )


@receiver(post_save, sender=Device)
def create_device_notification(sender, instance, created, **kwargs):
    """Create notifications for device status changes"""
    if not created and instance.device_status == 'offline':
        # Notify managers about device going offline
        notify_device_offline(instance)


@receiver(post_save, sender=Attendance)
def create_attendance_notification(sender, instance, created, **kwargs):
    """Create notifications for attendance records"""
    if created:
        # Notify about late arrival
        if instance.is_late:
            notify_attendance_late(instance)
        
        # Notify managers about absent employee
        if instance.status == 'absent':
            notify_employee_absent(instance)


@receiver(post_save, sender=Attendance)
def attendance_saved(sender, instance, created, **kwargs):
    """
    Signal handler for when an attendance record is saved (created or updated).
    Broadcasts the update to all connected WebSocket clients.
    """
    try:
        # Prepare attendance data for broadcasting
        attendance_data = {
            'id': str(instance.id),
            'user_name': instance.user.get_full_name(),
            'employee_id': instance.user.employee_id,
            'office': instance.user.office.name if instance.user.office else None,
            'date': instance.date.isoformat() if instance.date else None,
            'check_in_time': instance.check_in_time.isoformat() if instance.check_in_time else None,
            'check_out_time': instance.check_out_time.isoformat() if instance.check_out_time else None,
            'status': instance.status,
            'device': instance.device.name if instance.device else None,
            'created_at': instance.created_at.isoformat() if instance.created_at else None,
            'updated_at': instance.updated_at.isoformat() if instance.updated_at else None,
            'action': 'created' if created else 'updated'
        }
        
        # Broadcast the update (only if Redis is available)
        try:
            broadcast_attendance_update_sync(attendance_data)
            logger.info(f"Broadcasted attendance {'creation' if created else 'update'} for user {instance.user.get_full_name()}")
        except Exception as broadcast_error:
            # In development mode, Redis might not be available, so we'll just log and continue
            logger.warning(f"Could not broadcast attendance update (Redis may not be available): {broadcast_error}")
        
    except Exception as e:
        logger.error(f"Error broadcasting attendance update: {e}")


@receiver(post_delete, sender=Attendance)
def attendance_deleted(sender, instance, **kwargs):
    """
    Signal handler for when an attendance record is deleted.
    Broadcasts the deletion to all connected WebSocket clients.
    """
    try:
        # Prepare deletion notification
        deletion_data = {
            'id': str(instance.id),
            'user_name': instance.user.get_full_name(),
            'employee_id': instance.user.employee_id,
            'action': 'deleted'
        }
        
        # Broadcast the deletion (only if Redis is available)
        try:
            broadcast_attendance_update_sync(deletion_data)
            logger.info(f"Broadcasted attendance deletion for user {instance.user.get_full_name()}")
        except Exception as broadcast_error:
            # In development mode, Redis might not be available, so we'll just log and continue
            logger.warning(f"Could not broadcast attendance deletion (Redis may not be available): {broadcast_error}")
        
    except Exception as e:
        logger.error(f"Error broadcasting attendance deletion: {e}")
