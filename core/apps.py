from django.apps import AppConfig
import logging
import threading
import time
from django.conf import settings

logger = logging.getLogger(__name__)

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    
    def ready(self):
        """Called when Django starts up"""
        # Only start the service in production or when explicitly enabled
        if self._should_start_attendance_service():
            self._start_attendance_service()
    
    def _should_start_attendance_service(self):
        """Determine if we should start the attendance service"""
        # Check if we're in production mode
        if hasattr(settings, 'ENVIRONMENT') and settings.ENVIRONMENT == 'production':
            return True
        
        # Check if auto-start is explicitly enabled
        if getattr(settings, 'AUTO_START_ATTENDANCE_SERVICE', False):
            return True
        
        # Don't start in development mode by default
        return False
    
    def _start_attendance_service(self):
        """Start the attendance service in a background thread"""
        try:
            logger.info("Starting automatic attendance service...")
            
            # Import here to avoid circular imports
            from .management.commands.auto_fetch_attendance import AutoAttendanceService
            
            # Create and start the service
            self.attendance_service = AutoAttendanceService(interval=30)
            
            # Start in a separate thread
            def start_service():
                try:
                    self.attendance_service.start()
                    logger.info("Attendance service started successfully")
                    
                    # Keep the service running
                    while self.attendance_service.running:
                        time.sleep(1)
                        
                except Exception as e:
                    logger.error(f"Error in attendance service: {str(e)}")
            
            # Start the service thread
            service_thread = threading.Thread(target=start_service, daemon=True)
            service_thread.start()
            
            logger.info("Attendance service thread started")
            
        except Exception as e:
            logger.error(f"Failed to start attendance service: {str(e)}")
    
    def stop_attendance_service(self):
        """Stop the attendance service"""
        if hasattr(self, 'attendance_service'):
            try:
                self.attendance_service.stop()
                logger.info("Attendance service stopped")
            except Exception as e:
                logger.error(f"Error stopping attendance service: {str(e)}")