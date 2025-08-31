#!/usr/bin/env python3
"""
Automatic Attendance Fetching Service
24/7 background service that continuously fetches attendance data from all devices
Prevents duplicates and handles both historical and real-time data
"""

import os
import sys
import django
import logging
import time
import signal
import threading
import json
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction, connection
from django.conf import settings
from django.core.cache import cache

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Device, CustomUser, Attendance, Office, ESSLAttendanceLog

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/auto_fetch_attendance.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

try:
    from zk import ZK
    ZK_AVAILABLE = True
except ImportError:
    ZK_AVAILABLE = False
    logger.warning("pyzk library not available. Install with: pip install pyzk")

class AutoAttendanceService:
    """Automatic attendance fetching service with duplicate prevention"""
    
    def __init__(self, interval=30, max_workers=3):
        self.interval = interval
        self.max_workers = max_workers
        self.running = False
        self.thread = None
        self.devices = []
        self.device_connections = {}
        self.last_fetch_times = {}
        self.last_attendance_hashes = {}  # Store hashes to prevent duplicates
        self.processing_lock = threading.Lock()
        self.stats = {
            'total_fetches': 0,
            'total_records': 0,
            'duplicates_prevented': 0,
            'errors': 0,
            'last_successful_fetch': None
        }
        
    def start(self):
        """Start the automatic attendance fetching service"""
        if self.running:
            logger.warning("Service is already running")
            return
            
        logger.info("🚀 Starting automatic attendance fetching service...")
        self.running = True
        
        # Get all active devices
        self.devices = list(Device.objects.filter(is_active=True))
        logger.info(f"📱 Found {len(self.devices)} active devices")
        
        # Initialize device connections and tracking
        for device in self.devices:
            self.device_connections[device.id] = None
            self.last_fetch_times[device.id] = None
            self.last_attendance_hashes[device.id] = set()
        
        # Start the background thread
        self.thread = threading.Thread(target=self._run_service, daemon=True)
        self.thread.start()
        
        logger.info(f"✅ Service started. Fetching data every {self.interval} seconds")
        
    def stop(self):
        """Stop the automatic attendance fetching service"""
        logger.info("🛑 Stopping automatic attendance fetching service...")
        self.running = False
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
            
        # Cleanup device connections
        self.cleanup_connections()
        logger.info("✅ Service stopped")
        
    def cleanup_connections(self):
        """Clean up all device connections"""
        for device_id, conn in self.device_connections.items():
            if conn:
                try:
                    if hasattr(conn, 'disconnect'):
                        conn.disconnect()
                    logger.info(f"✅ Disconnected from device {device_id}")
                except Exception as e:
                    logger.warning(f"Error disconnecting from device {device_id}: {str(e)}")
                finally:
                    self.device_connections[device_id] = None
                    
    def _run_service(self):
        """Main service loop"""
        logger.info("🔄 Starting main service loop...")
        
        while self.running:
            try:
                with self.processing_lock:
                    self._fetch_all_devices()
                    
                # Update stats
                self.stats['total_fetches'] += 1
                self.stats['last_successful_fetch'] = timezone.now()
                
                # Log periodic stats
                if self.stats['total_fetches'] % 10 == 0:  # Every 10 fetches
                    self._log_stats()
                    
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                logger.info("Received interrupt signal")
                break
            except Exception as e:
                logger.error(f"Error in service loop: {str(e)}")
                self.stats['errors'] += 1
                time.sleep(self.interval)
                
    def _fetch_all_devices(self):
        """Fetch data from all devices"""
        current_time = timezone.now()
        
        for device in self.devices:
            try:
                # Check if device should be fetched (respect device-specific intervals)
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
        device_interval = getattr(device, 'fetch_interval', self.interval)
        
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
        if not ZK_AVAILABLE:
            logger.error("pyzk library not available for ZKTeco device")
            return
            
        conn = None
        try:
            # Connect to device
            conn = self._connect_zkteco_device(device)
            if not conn:
                return
                
            # Get attendance data
            attendance_logs = conn.get_attendance()
            if not attendance_logs:
                logger.info(f"No new attendance data from {device.name}")
                return
                
            # Process attendance records
            self._process_zkteco_attendance(device, attendance_logs)
            
        except Exception as e:
            logger.error(f"Error fetching ZKTeco data from {device.name}: {str(e)}")
            raise
        finally:
            if conn:
                try:
                    conn.disconnect()
                except:
                    pass
                    
    def _connect_zkteco_device(self, device):
        """Connect to ZKTeco device"""
        try:
            zk = ZK(device.ip_address, port=device.port, timeout=10, force_udp=False, verbose=False)
            conn = zk.connect()
            if conn:
                logger.info(f"✅ Connected to ZKTeco device {device.name}")
                return conn
            else:
                logger.error(f"❌ Failed to connect to ZKTeco device {device.name}")
                return None
        except Exception as e:
            logger.error(f"❌ Connection error to ZKTeco device {device.name}: {str(e)}")
            return None
            
    def _process_zkteco_attendance(self, device, attendance_logs):
        """Process ZKTeco attendance records with duplicate prevention"""
        if not attendance_logs:
            return
            
        logger.info(f"📊 Processing {len(attendance_logs)} attendance records from {device.name}")
        
        new_records = 0
        duplicates = 0
        
        for log in attendance_logs:
            try:
                # Create unique hash for this attendance record
                record_hash = self._create_attendance_hash(device.id, log)
                
                # Check if this record already exists
                if record_hash in self.last_attendance_hashes.get(device.id, set()):
                    duplicates += 1
                    continue
                    
                # Process the attendance record
                if self._save_zkteco_attendance(device, log):
                    new_records += 1
                    # Add to hash set to prevent future duplicates
                    if device.id not in self.last_attendance_hashes:
                        self.last_attendance_hashes[device.id] = set()
                    self.last_attendance_hashes[device.id].add(record_hash)
                    
            except Exception as e:
                logger.error(f"Error processing attendance record: {str(e)}")
                
        # Update stats
        self.stats['total_records'] += new_records
        self.stats['duplicates_prevented'] += duplicates
        
        logger.info(f"✅ Processed {new_records} new records, prevented {duplicates} duplicates from {device.name}")
        
    def _create_attendance_hash(self, device_id, log):
        """Create unique hash for attendance record"""
        # Create hash based on device, user, and timestamp
        hash_data = f"{device_id}_{log.user_id}_{log.timestamp}_{log.status}"
        return hash(hash_data)
        
    def _save_zkteco_attendance(self, device, log):
        """Save ZKTeco attendance record to database"""
        try:
            # Find user by biometric ID
            user = CustomUser.objects.filter(biometric_id=str(log.user_id)).first()
            if not user:
                logger.warning(f"User with biometric ID {log.user_id} not found")
                return False
                
            # Make timestamp timezone-aware
            timestamp = log.timestamp
            if timezone.is_naive(timestamp):
                timestamp = timezone.make_aware(timestamp, timezone.get_current_timezone())
                
            # Check if attendance record already exists
            existing_attendance = Attendance.objects.filter(
                user=user,
                date=timestamp.date(),
                check_in_time__hour=timestamp.hour,
                check_in_time__minute=timestamp.minute
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
                check_in_time__minute=timestamp.minute
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
        logger.info(f"📈 Service Stats - Fetches: {self.stats['total_fetches']}, "
                   f"Records: {self.stats['total_records']}, "
                   f"Duplicates Prevented: {self.stats['duplicates_prevented']}, "
                   f"Errors: {self.stats['errors']}")
                   
    def get_stats(self):
        """Get current service statistics"""
        return self.stats.copy()

# Global service instance
auto_attendance_service = AutoAttendanceService()

class Command(BaseCommand):
    help = 'Start automatic attendance fetching service'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=30,
            help='Fetch interval in seconds (default: 30)'
        )
        parser.add_argument(
            '--daemon',
            action='store_true',
            help='Run as daemon process'
        )
        parser.add_argument(
            '--stop',
            action='store_true',
            help='Stop the running service'
        )
        parser.add_argument(
            '--status',
            action='store_true',
            help='Show service status'
        )
        
    def handle(self, *args, **options):
        if options['stop']:
            self._stop_service()
        elif options['status']:
            self._show_status()
        else:
            self._start_service(options)
            
    def _start_service(self, options):
        """Start the automatic attendance fetching service"""
        try:
            interval = options['interval']
            daemon = options['daemon']
            
            logger.info(f"Starting automatic attendance fetching service with {interval}s interval...")
            
            # Initialize service
            auto_attendance_service.interval = interval
            auto_attendance_service.start()
            
            if daemon:
                logger.info("Service started in daemon mode")
                return
            else:
                # Run in foreground
                try:
                    while auto_attendance_service.running:
                        time.sleep(1)
                except KeyboardInterrupt:
                    logger.info("Received interrupt signal")
                    auto_attendance_service.stop()
                    
        except Exception as e:
            logger.error(f"Error starting service: {str(e)}")
            raise CommandError(f"Failed to start service: {str(e)}")
            
    def _stop_service(self):
        """Stop the automatic attendance fetching service"""
        try:
            auto_attendance_service.stop()
            self.stdout.write(
                self.style.SUCCESS('✅ Automatic attendance fetching service stopped')
            )
        except Exception as e:
            logger.error(f"Error stopping service: {str(e)}")
            raise CommandError(f"Failed to stop service: {str(e)}")
            
    def _show_status(self):
        """Show service status"""
        stats = auto_attendance_service.get_stats()
        
        self.stdout.write("📊 Automatic Attendance Fetching Service Status")
        self.stdout.write("=" * 50)
        self.stdout.write(f"Running: {'✅ Yes' if auto_attendance_service.running else '❌ No'}")
        self.stdout.write(f"Interval: {auto_attendance_service.interval} seconds")
        self.stdout.write(f"Total Fetches: {stats['total_fetches']}")
        self.stdout.write(f"Total Records: {stats['total_records']}")
        self.stdout.write(f"Duplicates Prevented: {stats['duplicates_prevented']}")
        self.stdout.write(f"Errors: {stats['errors']}")
        
        if stats['last_successful_fetch']:
            self.stdout.write(f"Last Successful Fetch: {stats['last_successful_fetch']}")
            
        # Show device status
        self.stdout.write("\n📱 Device Status:")
        for device in auto_attendance_service.devices:
            last_fetch = auto_attendance_service.last_fetch_times.get(device.id)
            status = "🟢 Active" if last_fetch else "🔴 Inactive"
            self.stdout.write(f"  {device.name} ({device.device_type}): {status}")
            
        self.stdout.write("=" * 50)
