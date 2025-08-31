#!/usr/bin/env python3
"""
Improved Automatic ZKTeco Data Fetching Service
24/7 background service that properly handles check-in and check-out times
"""

import os
import sys
import django
import logging
import time
import signal
import threading
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Device, CustomUser, Attendance, Office

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/zkteco_auto_fetch_improved.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

try:
    from zk import ZK
except ImportError:
    logger.error("pyzk library not found. Please install it with: pip install pyzk")
    ZK = None

class ImprovedAutoFetchService:
    """Improved automatic ZKTeco data fetching service with proper check-in/check-out handling"""
    
    def __init__(self, interval=30):
        self.interval = interval
        self.running = False
        self.thread = None
        self.devices = []
        self.last_fetch_times = {}
        self.device_connections = {}
        self.last_attendance_data = {}  # Store last known attendance data per device
        
    def start(self):
        """Start the automatic fetching service"""
        if self.running:
            logger.warning("Service is already running")
            return
            
        logger.info("🚀 Starting improved automatic ZKTeco data fetching service...")
        self.running = True
        
        # Get all active ZKTeco devices
        self.devices = list(Device.objects.filter(
            device_type='zkteco',
            is_active=True
        ))
        
        logger.info(f"📱 Found {len(self.devices)} active ZKTeco devices")
        
        # Initialize device connections
        for device in self.devices:
            self.device_connections[device.id] = None
        
        # Start the background thread
        self.thread = threading.Thread(target=self._run_service, daemon=True)
        self.thread.start()
        
        logger.info(f"✅ Service started. Fetching data every {self.interval} seconds")
        
    def stop(self):
        """Stop the automatic fetching service"""
        logger.info("🛑 Stopping improved automatic ZKTeco data fetching service...")
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
                    conn.disconnect()
                    logger.info(f"✅ Disconnected from device {device_id}")
                except:
                    pass
                self.device_connections[device_id] = None
        
    def connect_to_device(self, device):
        """Connect to a ZKTeco device"""
        try:
            if not ZK:
                logger.error("pyzk library not available")
                return None
                
            # Check if we already have a connection
            if self.device_connections.get(device.id):
                return self.device_connections[device.id]
                
            zk = ZK(device.ip_address, port=device.port, timeout=15)
            conn = zk.connect()
            
            if conn:
                self.device_connections[device.id] = conn
                logger.info(f"✅ Connected to {device.name} ({device.ip_address}:{device.port})")
                return conn
            else:
                logger.error(f"❌ Failed to connect to {device.name}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Connection error to {device.name}: {str(e)}")
            return None
    
    def get_device_attendance(self, conn, device):
        """Get attendance records from device"""
        try:
            attendance_logs = conn.get_attendance()
            logger.info(f"📊 Found {len(attendance_logs)} attendance records on {device.name}")
            return attendance_logs
        except Exception as e:
            logger.error(f"❌ Error getting attendance from {device.name}: {str(e)}")
            return []
    
    def process_attendance_records(self, logs, device):
        """Process attendance records with proper check-in/check-out logic"""
        if not logs:
            return 0, 0
            
        synced_count = 0
        error_count = 0
        
        # Group logs by user and date
        user_date_logs = {}
        
        for log in logs:
            user_id = log.user_id
            date = log.timestamp.date()
            key = (user_id, date)
            
            if key not in user_date_logs:
                user_date_logs[key] = []
            user_date_logs[key].append(log)
        
        # Process each user's logs for each date
        for (user_id, date), user_logs in user_date_logs.items():
            try:
                # Find user in database
                try:
                    user = CustomUser.objects.get(employee_id=str(user_id))
                except CustomUser.DoesNotExist:
                    logger.warning(f"⚠️ User with employee_id {user_id} not found")
                    error_count += 1
                    continue
                
                # Sort logs by timestamp
                user_logs.sort(key=lambda x: x.timestamp)
                
                # Get or create attendance record
                attendance, created = Attendance.objects.get_or_create(
                    user=user,
                    date=date,
                    defaults={
                        'status': 'Present',
                        'device': device
                    }
                )
                
                # Process check-in and check-out times
                check_in_time = None
                check_out_time = None
                
                for log in user_logs:
                    timestamp = log.timestamp
                    
                    # Determine if this is check-in or check-out
                    # First log of the day is usually check-in
                    # Last log of the day is usually check-out
                    if len(user_logs) == 1:
                        # Single log - determine by time
                        if timestamp.hour < 12:
                            check_in_time = timestamp
                        else:
                            check_out_time = timestamp
                    else:
                        # Multiple logs - first is check-in, last is check-out
                        if log == user_logs[0]:  # First log
                            check_in_time = timestamp
                        elif log == user_logs[-1]:  # Last log
                            check_out_time = timestamp
                
                # Update attendance record
                updated = False
                
                if check_in_time and not attendance.check_in_time:
                    attendance.check_in_time = check_in_time
                    updated = True
                    logger.info(f"✅ Check-in: {user.get_full_name()} at {check_in_time.strftime('%H:%M')}")
                
                if check_out_time and not attendance.check_out_time:
                    attendance.check_out_time = check_out_time
                    updated = True
                    logger.info(f"✅ Check-out: {user.get_full_name()} at {check_out_time.strftime('%H:%M')}")
                
                if updated:
                    attendance.device = device
                    attendance.save()
                    synced_count += 1
                
            except Exception as e:
                logger.error(f"❌ Error processing attendance for user {user_id}: {str(e)}")
                error_count += 1
        
        return synced_count, error_count
    
    def _run_service(self):
        """Main service loop"""
        logger.info("🔄 Starting main service loop...")
        
        while self.running:
            try:
                self._fetch_all_devices()
                time.sleep(self.interval)
            except KeyboardInterrupt:
                logger.info("Received interrupt signal")
                break
            except Exception as e:
                logger.error(f"Error in service loop: {str(e)}")
                time.sleep(self.interval)
                
    def _fetch_all_devices(self):
        """Fetch data from all devices"""
        current_time = timezone.now()
        
        for device in self.devices:
            try:
                # Check if we should fetch from this device
                last_fetch = self.last_fetch_times.get(device.id)
                if last_fetch and (current_time - last_fetch).seconds < self.interval:
                    continue
                    
                logger.info(f"🔄 Fetching data from device: {device.name} ({device.ip_address})")
                
                # Connect to device
                conn = self.connect_to_device(device)
                if not conn:
                    continue
                
                # Get attendance data
                attendance_logs = self.get_device_attendance(conn, device)
                
                if attendance_logs:
                    # Process attendance records
                    synced_count, error_count = self.process_attendance_records(attendance_logs, device)
                    
                    logger.info(f"📊 {device.name}: {synced_count} synced, {error_count} errors")
                    
                    # Update device last sync time
                    device.last_sync = current_time
                    device.save(update_fields=['last_sync'])
                    
                else:
                    logger.warning(f"⚠️ No data fetched from device {device.name}")
                    
                # Update last fetch time
                self.last_fetch_times[device.id] = current_time
                
            except Exception as e:
                logger.error(f"❌ Error fetching from device {device.name}: {str(e)}")
                
    def get_status(self):
        """Get service status"""
        # Load devices if not loaded
        if not hasattr(self, 'devices') or not self.devices:
            self.devices = list(Device.objects.filter(
                device_type='zkteco',
                is_active=True
            ))
            
        return {
            'running': self.running,
            'devices_count': len(self.devices),
            'last_fetch_times': self.last_fetch_times,
            'interval': self.interval,
            'active_connections': len([conn for conn in self.device_connections.values() if conn])
        }

# Global service instance
improved_auto_fetch_service = ImprovedAutoFetchService()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"Received signal {signum}, shutting down...")
    improved_auto_fetch_service.stop()
    sys.exit(0)

class Command(BaseCommand):
    help = 'Improved automatic ZKTeco data fetching service with proper check-in/check-out handling'
    
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
            help='Run as daemon (background process)'
        )
        parser.add_argument(
            '--status',
            action='store_true',
            help='Show service status'
        )
        parser.add_argument(
            '--stop',
            action='store_true',
            help='Stop the service'
        )
        
    def handle(self, *args, **options):
        # Register signal handlers
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        interval = options['interval']
        daemon_mode = options['daemon']
        show_status = options['status']
        stop_service = options['stop']
        
        if show_status:
            status = improved_auto_fetch_service.get_status()
            self.stdout.write(
                self.style.SUCCESS(f"Service Status: {'Running' if status['running'] else 'Stopped'}")
            )
            self.stdout.write(f"Devices: {status['devices_count']}")
            self.stdout.write(f"Active Connections: {status['active_connections']}")
            self.stdout.write(f"Interval: {status['interval']} seconds")
            return
            
        if stop_service:
            improved_auto_fetch_service.stop()
            self.stdout.write(
                self.style.SUCCESS("Service stopped")
            )
            return
            
        # Configure service
        improved_auto_fetch_service.interval = interval
        
        if daemon_mode:
            # Run as daemon
            import daemon
            with daemon.DaemonContext():
                improved_auto_fetch_service.start()
                try:
                    while improved_auto_fetch_service.running:
                        time.sleep(1)
                except KeyboardInterrupt:
                    improved_auto_fetch_service.stop()
        else:
            # Run in foreground
            self.stdout.write(
                self.style.SUCCESS(f"Starting improved automatic ZKTeco data fetching (interval: {interval}s)")
            )
            self.stdout.write("Press Ctrl+C to stop")
            
            improved_auto_fetch_service.start()
            
            try:
                while improved_auto_fetch_service.running:
                    time.sleep(1)
            except KeyboardInterrupt:
                self.stdout.write("\nStopping service...")
                improved_auto_fetch_service.stop()
                self.stdout.write(
                    self.style.SUCCESS("Service stopped")
                )
