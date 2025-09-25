"""
Notification Service for managing system notifications
"""
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from .models import Notification, CustomUser, Attendance, Leave, Resignation, Document
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Service class for managing notifications"""
    
    @staticmethod
    def create_notification(
        user,
        title,
        message,
        notification_type='system',
        category='info',
        priority='medium',
        action_url=None,
        action_text=None,
        expires_at=None,
        related_object=None,
        created_by=None,
        send_email=True
    ):
        """Create a new notification"""
        try:
            # Determine related object info
            related_object_id = None
            related_object_type = None
            if related_object:
                related_object_id = related_object.id
                related_object_type = related_object.__class__.__name__.lower()
            
            notification = Notification.objects.create(
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                category=category,
                priority=priority,
                action_url=action_url,
                action_text=action_text or '',
                expires_at=expires_at,
                related_object_id=related_object_id,
                related_object_type=related_object_type or '',
                created_by=created_by
            )
            
            logger.info(f"Created notification: {title} for user {user.get_full_name()}")
            
            # Send email notification if requested and user has email
            if send_email and user.email:
                from .email_service import EmailNotificationService
                if priority == 'urgent':
                    EmailNotificationService.send_urgent_notification_email(notification)
                else:
                    EmailNotificationService.send_notification_email(notification)
            
            return notification
            
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            return None
    
    @staticmethod
    def create_bulk_notifications(users, title, message, **kwargs):
        """Create notifications for multiple users"""
        notifications = []
        for user in users:
            notification = NotificationService.create_notification(
                user=user,
                title=title,
                message=message,
                **kwargs
            )
            if notification:
                notifications.append(notification)
        return notifications
    
    @staticmethod
    def get_user_notifications(user, unread_only=False, notification_type=None, limit=None):
        """Get notifications for a user"""
        queryset = Notification.objects.filter(user=user)
        
        if unread_only:
            queryset = queryset.filter(is_read=False)
        
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Filter out expired notifications
        queryset = queryset.filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )
        
        if limit:
            queryset = queryset[:limit]
        
        return queryset
    
    @staticmethod
    def get_unread_count(user):
        """Get unread notification count for a user"""
        return Notification.objects.filter(
            user=user,
            is_read=False
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).count()
    
    @staticmethod
    def mark_as_read(notification_id, user):
        """Mark a notification as read"""
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False
    
    @staticmethod
    def mark_all_as_read(user):
        """Mark all notifications as read for a user"""
        updated = Notification.objects.filter(
            user=user,
            is_read=False
        ).update(is_read=True, updated_at=timezone.now())
        return updated
    
    @staticmethod
    def delete_notification(notification_id, user):
        """Delete a notification"""
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.delete()
            return True
        except Notification.DoesNotExist:
            return False
    
    @staticmethod
    def delete_expired_notifications():
        """Delete expired notifications"""
        expired_count = Notification.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()[0]
        logger.info(f"Deleted {expired_count} expired notifications")
        return expired_count
    
    @staticmethod
    def cleanup_old_notifications(days=30):
        """Clean up old notifications"""
        cutoff_date = timezone.now() - timedelta(days=days)
        old_count = Notification.objects.filter(
            created_at__lt=cutoff_date,
            is_read=True
        ).delete()[0]
        logger.info(f"Deleted {old_count} old notifications")
        return old_count


class RoleBasedNotificationService:
    """Service for creating role-based notifications"""
    
    # Notification templates for different roles
    NOTIFICATION_TEMPLATES = {
        'employee': {
            'attendance_late': {
                'title': 'Late Arrival Alert',
                'message': 'You arrived late today. Please ensure punctuality.',
                'type': 'attendance',
                'category': 'warning',
                'priority': 'medium'
            },
            'leave_approved': {
                'title': 'Leave Request Approved',
                'message': 'Your leave request has been approved.',
                'type': 'leave',
                'category': 'success',
                'priority': 'medium'
            },
            'leave_rejected': {
                'title': 'Leave Request Rejected',
                'message': 'Your leave request has been rejected. Please contact your manager.',
                'type': 'leave',
                'category': 'error',
                'priority': 'high'
            },
            'document_shared': {
                'title': 'New Document Available',
                'message': 'A new document has been shared with you.',
                'type': 'document',
                'category': 'info',
                'priority': 'low'
            },
            'resignation_approved': {
                'title': 'Resignation Approved',
                'message': 'Your resignation has been approved. Please complete handover.',
                'type': 'resignation',
                'category': 'info',
                'priority': 'high'
            }
        },
        'manager': {
            'employee_absent': {
                'title': 'Employee Absent',
                'message': '{employee_name} is absent today.',
                'type': 'attendance',
                'category': 'warning',
                'priority': 'medium'
            },
            'leave_request': {
                'title': 'New Leave Request',
                'message': '{employee_name} has submitted a leave request.',
                'type': 'leave',
                'category': 'info',
                'priority': 'medium'
            },
            'resignation_request': {
                'title': 'Resignation Request',
                'message': '{employee_name} has submitted a resignation request.',
                'type': 'resignation',
                'category': 'warning',
                'priority': 'high'
            },
            'device_offline': {
                'title': 'Device Offline',
                'message': 'Attendance device {device_name} is offline.',
                'type': 'device',
                'category': 'error',
                'priority': 'high'
            }
        },
        'admin': {
            'system_alert': {
                'title': 'System Alert',
                'message': 'System requires attention: {message}',
                'type': 'system',
                'category': 'error',
                'priority': 'urgent'
            },
            'user_registered': {
                'title': 'New User Registered',
                'message': 'New user {user_name} has been registered.',
                'type': 'system',
                'category': 'info',
                'priority': 'low'
            },
            'device_sync_failed': {
                'title': 'Device Sync Failed',
                'message': 'Failed to sync data from device {device_name}.',
                'type': 'device',
                'category': 'error',
                'priority': 'high'
            }
        },
        'accountant': {
            'attendance_summary': {
                'title': 'Monthly Attendance Summary',
                'message': 'Monthly attendance summary is ready for review.',
                'type': 'attendance',
                'category': 'info',
                'priority': 'medium'
            },
            'document_generated': {
                'title': 'Document Generated',
                'message': 'New document has been generated for {employee_name}.',
                'type': 'document',
                'category': 'success',
                'priority': 'low'
            }
        }
    }
    
    @staticmethod
    def create_role_notification(user, template_key, **kwargs):
        """Create notification using role-based template"""
        role = user.role
        if role not in RoleBasedNotificationService.NOTIFICATION_TEMPLATES:
            role = 'employee'  # Default fallback
        
        templates = RoleBasedNotificationService.NOTIFICATION_TEMPLATES[role]
        if template_key not in templates:
            logger.warning(f"Template {template_key} not found for role {role}")
            return None
        
        template = templates[template_key]
        
        # Format message with kwargs
        message = template['message'].format(**kwargs)
        
        return NotificationService.create_notification(
            user=user,
            title=template['title'],
            message=message,
            notification_type=template['type'],
            category=template['category'],
            priority=template['priority']
        )
    
    @staticmethod
    def notify_managers_about_employee(employee, template_key, **kwargs):
        """Notify managers about employee-related events"""
        if not employee.office:
            return []
        
        managers = CustomUser.objects.filter(
            office=employee.office,
            role='manager',
            is_active=True
        )
        
        notifications = []
        for manager in managers:
            notification = RoleBasedNotificationService.create_role_notification(
                manager, template_key, employee_name=employee.get_full_name(), **kwargs
            )
            if notification:
                notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def notify_admins_about_system(template_key, **kwargs):
        """Notify admins about system events"""
        admins = CustomUser.objects.filter(
            role='admin',
            is_active=True
        )
        
        notifications = []
        for admin in admins:
            notification = RoleBasedNotificationService.create_role_notification(
                admin, template_key, **kwargs
            )
            if notification:
                notifications.append(notification)
        
        return notifications


# Convenience functions for common notification scenarios
def notify_attendance_late(attendance):
    """Notify employee about late arrival"""
    if attendance.is_late and attendance.late_minutes > 0:
        return RoleBasedNotificationService.create_role_notification(
            attendance.user,
            'attendance_late',
            late_minutes=attendance.late_minutes
        )
    return None

def notify_employee_absent(attendance):
    """Notify managers about absent employee"""
    if attendance.status == 'absent':
        return RoleBasedNotificationService.notify_managers_about_employee(
            attendance.user,
            'employee_absent'
        )
    return []

def notify_leave_request(leave):
    """Notify managers about leave request"""
    return RoleBasedNotificationService.notify_managers_about_employee(
        leave.user,
        'leave_request',
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date
    )

def notify_leave_decision(leave, approved=True):
    """Notify employee about leave decision"""
    template_key = 'leave_approved' if approved else 'leave_rejected'
    return RoleBasedNotificationService.create_role_notification(
        leave.user,
        template_key,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date
    )

def notify_resignation_request(resignation):
    """Notify managers about resignation request"""
    return RoleBasedNotificationService.notify_managers_about_employee(
        resignation.user,
        'resignation_request',
        resignation_date=resignation.resignation_date,
        notice_period=resignation.notice_period_days
    )

def notify_device_offline(device):
    """Notify managers about device offline"""
    if device.office:
        managers = CustomUser.objects.filter(
            office=device.office,
            role='manager',
            is_active=True
        )
        
        notifications = []
        for manager in managers:
            notification = RoleBasedNotificationService.create_role_notification(
                manager,
                'device_offline',
                device_name=device.name
            )
            if notification:
                notifications.append(notification)
        
        return notifications
    return []

def notify_system_alert(message, priority='high'):
    """Notify admins about system alerts"""
    return RoleBasedNotificationService.notify_admins_about_system(
        'system_alert',
        message=message
    )
