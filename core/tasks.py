"""
Celery tasks for background processing
"""
from celery import shared_task
from .models import Notification
from .email_service import EmailNotificationService
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_bulk_notification_emails(notification_ids):
    """
    Send emails for bulk notifications in the background
    """
    try:
        notifications = Notification.objects.filter(id__in=notification_ids)
        sent_count = 0
        failed_count = 0
        
        for notification in notifications:
            if notification.user.email and not notification.is_email_sent:
                try:
                    EmailNotificationService.send_notification_email(notification)
                    notification.is_email_sent = True
                    notification.save(update_fields=['is_email_sent'])
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send email for notification {notification.id}: {e}")
                    failed_count += 1
        
        logger.info(f"Email sending completed: {sent_count} sent, {failed_count} failed")
        return {
            'sent': sent_count,
            'failed': failed_count,
            'total': len(notification_ids)
        }
        
    except Exception as e:
        logger.error(f"Error in send_bulk_notification_emails task: {e}")
        return {'error': str(e)}
