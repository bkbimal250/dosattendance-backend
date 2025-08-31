from django.apps import AppConfig
import threading
import logging

logger = logging.getLogger(__name__)

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    
    def ready(self):
        """Initialize the app and start background services"""
        import os
        import sys
        
        # Only start services if not in management command mode and not in test mode
        if (os.environ.get('RUN_MAIN') != 'true' and 
            not self._is_management_command() and 
            not self._is_test_mode()):
            self._start_background_services()
    
    def _is_management_command(self):
        """Check if we're running a management command"""
        import sys
        return len(sys.argv) > 1 and sys.argv[1] in [
            'runserver', 'migrate', 'makemigrations', 'collectstatic',
            'auto_fetch_attendance', 'test', 'shell', 'dbshell'
        ]
    
    def _is_test_mode(self):
        """Check if we're in test mode"""
        import sys
        return 'test' in sys.argv or 'pytest' in sys.argv
    
    def _start_background_services(self):
        """Start background services in a separate thread"""
        try:
            # Use a flag to prevent multiple starts
            if hasattr(self, '_services_started'):
                return
            self._services_started = True
            
            # Start the service in a background thread with delay
            def start_service():
                import time
                time.sleep(5)  # Wait for Django to fully initialize
                try:
                    # Import the service
                    from .management.commands.auto_fetch_attendance import auto_attendance_service
                    
                    logger.info("🚀 Starting automatic attendance fetching service...")
                    auto_attendance_service.start()
                    logger.info("✅ Automatic attendance fetching service started successfully")
                except Exception as e:
                    logger.error(f"❌ Failed to start automatic attendance fetching service: {str(e)}")
            
            # Start in background thread
            service_thread = threading.Thread(target=start_service, daemon=True)
            service_thread.start()
            
        except Exception as e:
            logger.error(f"Error starting background services: {str(e)}")
