#!/usr/bin/env python3
"""
Continuous Attendance Fetcher Service
Standalone service that runs independently of Django to fetch attendance data
Handles both old and new data, prevents duplicates, and runs continuously
"""

import os
import sys
import time
import logging
import signal
import threading
from datetime import datetime, timedelta
from pathlib import Path

# Add Django project to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')

# Import Django after setting environment
import django
django.setup()

from django.utils import timezone
from django.db import transaction
from core.models import Device, CustomUser, Attendance, ESSLAttendanceLog
from core.zkteco_service_improved import improved_zkteco_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/continuous_attendance_fetcher.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ContinuousAttendanceFetcher:
    """Continuous attendance fetching service with duplicate prevention"""
    
    def __init__(self, fetch_interval=30):
        self.fetch_interval = fetch_interval
        self.running = False
        self.thread = None
        self.devices = []
        self.last_fetch_times = {}
        self.processed_hashes = set()  # Store hashes of processed records
        self.stats = {
            'total_fetches': 0,
            'total_records': 0,
            'duplicates_prevented': 0,
            'errors': 0,
            'last_successful_fetch': None,
            'start_time': timezone.now()
        }
        
    def start(self):
        """Start the continuous attendance fetching service"""
        if self.running:
            logger.warning("Service is already running")
            return
            
        logger.info("🚀 Starting continuous attendance fetching service...")
        self.running = True
        
        # Get all active devices
        self.devices = list(Device.objects.filter(is_active=True))
        logger.info(f"📱 Found {len(self.devices)} active devices")
        
        # Initialize device tracking
        for device in self.devices:
            self.last_fetch_times[device.id] = None
        
        # Start the background thread
        self.thread = threading.Thread(target=self._run_service, daemon=True)
        self.thread.start()
        
        logger.info(f"✅ Service started. Fetching data every {self.fetch_interval} seconds")
        
    def stop(self):
        """Stop the continuous attendance fetching service"""
        logger.info("🛑 Stopping continuous attendance fetching service...")
        self.running = False
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
            
        logger.info("✅ Service stopped")
        
    def _run_service(self):
        """Main service loop"""
        logger.info("🔄 Starting main service loop...")
        
        while self.running:
            try:
                self._fetch_all_devices()
                
                # Update stats
                self.stats['total_fetches'] += 1
                self.stats['last_successful_fetch'] = timezone.now()
                
                # Log periodic stats
                if self.stats['total_fetches'] % 10 == 0:  # Every 10 fetches
                    self._log_stats()
                    
                time.sleep(self.fetch_interval)
                
            except KeyboardInterrupt:
                logger.info("Received interrupt signal")
                break
            except Exception as e:
                logger.error(f"Error in service loop: {str(e)}")
                self.stats['errors'] += 1
                time.sleep(self.fetch_interval)
                
    def _fetch_all_devices(self):
        """Fetch data from all devices"""
        current_time = timezone.now()
        
        for device in self.devices:
            try:
                # Check if device should be fetched
                if self._should_fetch_device(device, current_time):
                    self._fetch_device_data(device)
                    
            except Exception as e:
                logger.error(f"Error fetching from device {device.name}: {str(e)}")
                self.stats['errors'] += 1
                
    def _should_fetch_device(self, device, current_time):
        """Check if device should be fetched based on last fetch time"""
        last_fetch = self.last_fetch_times.get(device.id)
        
        if not last_fetch:
            return True
            
        # Device-specific fetch interval (default 30 seconds)
        device_interval = getattr(device, 'sync_interval', 5) * 60  # Convert minutes to seconds
        
        return (current_time - last_fetch).total_seconds() >= device_interval
        
    def _fetch_device_data(self, device):
        """Fetch data from a specific device"""
        try:
            logger.info(f"📥 Fetching data from {device.name} ({device.device_type})")
            
            if device.device_type == 'zkteco':
                self._fetch_zkteco_data(device)
            elif device.device_type == 'essl':
                self._fetch_essl_data(device)
            else:
                logger.warning(f"Unknown device type: {device.device_type}")
                
            # Update last fetch time
            self.last_fetch_times[device.id] = timezone.now()
            
        except Exception as e:
            logger.error(f"Error fetching data from {device.name}: {str(e)}")
            raise
            
    def _fetch_zkteco_data(self, device):
        """Fetch data from ZKTeco device"""
        try:
            # Get attendance data from device
            attendance_data = improved_zkteco_service.fetch_attendance_from_device(
                device.ip_address, device.port
            )
            
            if attendance_data:
                self._process_zkteco_attendance(device, attendance_data)
            else:
                logger.info(f"No new attendance data from {device.name}")
                
        except Exception as e:
            logger.error(f"Error fetching ZKTeco data from {device.name}: {str(e)}")
            raise
            
    def _process_zkteco_attendance(self, device, attendance_data):
        """Process ZKTeco attendance records with duplicate prevention"""
        if not attendance_data:
            return
            
        logger.info(f"📊 Processing {len(attendance_data)} attendance records from {device.name}")
        
        new_records = 0
        duplicates = 0
        
        for record in attendance_data:
            try:
                # Create unique hash for this attendance record
                record_hash = self._create_attendance_hash(device.id, record)
                
                # Check if this record already exists
                if record_hash in self.processed_hashes:
                    duplicates += 1
                    continue
                    
                # Process the attendance record
                if self._save_zkteco_attendance(device, record):
                    new_records += 1
                    # Add to hash set to prevent future duplicates
                    self.processed_hashes.add(record_hash)
                    
            except Exception as e:
                logger.error(f"Error processing attendance record: {str(e)}")
                
        # Update stats
        self.stats['total_records'] += new_records
        self.stats['duplicates_prevented'] += duplicates
        
        logger.info(f"✅ Processed {new_records} new records, prevented {duplicates} duplicates from {device.name}")
        
    def _create_attendance_hash(self, device_id, record):
        """Create unique hash for attendance record"""
        # Create hash based on device, user, timestamp, and punch type
        hash_data = f"{device_id}_{record['user_id']}_{record['punch_time']}_{record['punch_type']}"
        return hash(hash_data)
        
    def _save_zkteco_attendance(self, device, record):
        """Save ZKTeco attendance record to database"""
        try:
            # Find user by biometric ID
            user = CustomUser.objects.filter(biometric_id=str(record['user_id'])).first()
            if not user:
                logger.warning(f"User with biometric ID {record['user_id']} not found")
                return False
                
            # Make timestamp timezone-aware
            timestamp = record['punch_time']
            if timezone.is_naive(timestamp):
                timestamp = timezone.make_aware(timestamp, timezone.get_current_timezone())
                
            # Check if attendance record already exists
            existing_attendance = Attendance.objects.filter(
                user=user,
                date=timestamp.date(),
                check_in_time__hour=timestamp.hour,
                check_in_time__minute=timestamp.minute,
                device=device
            ).first()
            
            if existing_attendance:
                # Update existing record if needed
                if not existing_attendance.check_out_time and timestamp > existing_attendance.check_in_time:
                    existing_attendance.check_out_time = timestamp
                    existing_attendance.save()
                    logger.info(f"Updated check-out time for {user.get_full_name()}")
                return True
            else:
                # Create new attendance record
                attendance = Attendance.objects.create(
                    user=user,
                    date=timestamp.date(),
                    check_in_time=timestamp,
                    status='present',
                    device=device
                )
                logger.info(f"Created new attendance record for {user.get_full_name()}")
                return True
                
        except Exception as e:
            logger.error(f"Error saving attendance record: {str(e)}")
            return False
            
    def _fetch_essl_data(self, device):
        """Fetch data from ESSL device"""
        try:
            # Import ESSL service
            from core.essl_service import essl_service
            
            # Get attendance data from ESSL device
            attendance_data = essl_service.get_device_attendance(device)
            
            if attendance_data:
                self._process_essl_attendance(device, attendance_data)
            else:
                logger.info(f"No new attendance data from ESSL device {device.name}")
                
        except Exception as e:
            logger.error(f"Error fetching ESSL data from {device.name}: {str(e)}")
            raise
            
    def _process_essl_attendance(self, device, attendance_data):
        """Process ESSL attendance records"""
        logger.info(f"📊 Processing {len(attendance_data)} ESSL attendance records from {device.name}")
        
        new_records = 0
        
        for record in attendance_data:
            try:
                if self._save_essl_attendance(device, record):
                    new_records += 1
            except Exception as e:
                logger.error(f"Error processing ESSL attendance record: {str(e)}")
                
        self.stats['total_records'] += new_records
        logger.info(f"✅ Processed {new_records} new ESSL records from {device.name}")
        
    def _save_essl_attendance(self, device, record):
        """Save ESSL attendance record to database"""
        try:
            # Find user by employee ID or biometric ID
            user = CustomUser.objects.filter(
                employee_id=record.get('employee_id')
            ).first()
            
            if not user:
                logger.warning(f"User with employee ID {record.get('employee_id')} not found")
                return False
                
            # Parse timestamp
            timestamp_str = record.get('timestamp')
            if not timestamp_str:
                return False
                
            try:
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                if timezone.is_naive(timestamp):
                    timestamp = timezone.make_aware(timestamp, timezone.get_current_timezone())
            except:
                logger.error(f"Invalid timestamp format: {timestamp_str}")
                return False
                
            # Check for existing record
            existing_attendance = Attendance.objects.filter(
                user=user,
                date=timestamp.date(),
                check_in_time__hour=timestamp.hour,
                check_in_time__minute=timestamp.minute,
                device=device
            ).first()
            
            if existing_attendance:
                # Update existing record
                if not existing_attendance.check_out_time and timestamp > existing_attendance.check_in_time:
                    existing_attendance.check_out_time = timestamp
                    existing_attendance.save()
                return True
            else:
                # Create new record
                attendance = Attendance.objects.create(
                    user=user,
                    date=timestamp.date(),
                    check_in_time=timestamp,
                    status='present',
                    device=device
                )
                return True
                
        except Exception as e:
            logger.error(f"Error saving ESSL attendance record: {str(e)}")
            return False
            
    def _log_stats(self):
        """Log service statistics"""
        uptime = timezone.now() - self.stats['start_time']
        logger.info(f"📈 Service Stats - Uptime: {uptime}, Fetches: {self.stats['total_fetches']}, "
                   f"Records: {self.stats['total_records']}, Duplicates Prevented: {self.stats['duplicates_prevented']}, "
                   f"Errors: {self.stats['errors']}")
                   
    def get_stats(self):
        """Get current service statistics"""
        return self.stats.copy()

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    if fetcher:
        fetcher.stop()
    sys.exit(0)

if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and start the fetcher
    fetcher = ContinuousAttendanceFetcher(fetch_interval=30)
    
    try:
        fetcher.start()
        
        # Keep the main thread alive
        while fetcher.running:
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
        fetcher.stop()
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        fetcher.stop()
        sys.exit(1)
