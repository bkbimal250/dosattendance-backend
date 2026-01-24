#!/usr/bin/env python3
"""
Database verification script for push attendance functionality
This script checks if attendance data is being saved correctly to the database
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Device, CustomUser, Attendance, ESSLAttendanceLog
from django.utils import timezone

def verify_database_records():
    """Verify that push attendance data is being saved to the database"""
    print("=" * 60)
    print("DATABASE VERIFICATION FOR PUSH ATTENDANCE")
    print("=" * 60)
    print()
    
    # Check recent devices
    print("1. RECENT DEVICES:")
    print("-" * 30)
    recent_devices = Device.objects.order_by('-created_at')[:5]
    if recent_devices:
        for device in recent_devices:
            print(f"   - {device.name} ({device.device_type})")
            print(f"     IP: {device.ip_address}:{device.port}")
            print(f"     Device ID: {device.device_id}")
            print(f"     Created: {device.created_at}")
            print(f"     Last Sync: {device.last_sync}")
            print()
    else:
        print("   No devices found")
    print()
    
    # Check recent attendance records
    print("2. RECENT ATTENDANCE RECORDS:")
    print("-" * 30)
    recent_attendance = Attendance.objects.order_by('-created_at')[:10]
    if recent_attendance:
        for att in recent_attendance:
            print(f"   - {att.user.get_full_name()} ({att.user.employee_id})")
            print(f"     Date: {att.date}")
            print(f"     Check-in: {att.check_in_time or 'Not recorded'}")
            print(f"     Check-out: {att.check_out_time or 'Not recorded'}")
            print(f"     Device: {att.device.name if att.device else 'Unknown'}")
            print(f"     Status: {att.status}")
            print(f"     Created: {att.created_at}")
            print()
    else:
        print("   No attendance records found")
    print()
    
    # Check today's attendance
    print("3. TODAY'S ATTENDANCE:")
    print("-" * 30)
    today = timezone.now().date()
    today_attendance = Attendance.objects.filter(date=today).order_by('-check_in_time')
    if today_attendance:
        for att in today_attendance:
            print(f"   - {att.user.get_full_name()}")
            print(f"     Check-in: {att.check_in_time or 'Not recorded'}")
            print(f"     Check-out: {att.check_out_time or 'Not recorded'}")
            print(f"     Device: {att.device.name if att.device else 'Unknown'}")
            print()
    else:
        print("   No attendance records for today")
    print()
    
    # Check ESSL attendance logs
    print("4. RECENT ESSL ATTENDANCE LOGS:")
    print("-" * 30)
    recent_logs = ESSLAttendanceLog.objects.order_by('-timestamp')[:10]
    if recent_logs:
        for log in recent_logs:
            print(f"   - {log.user.get_full_name()}")
            print(f"     Timestamp: {log.timestamp}")
            print(f"     Type: {log.attendance_type}")
            print(f"     Device: {log.device.name if log.device else 'Unknown'}")
            print(f"     Raw Data: {log.raw_data[:100]}..." if len(log.raw_data) > 100 else f"     Raw Data: {log.raw_data}")
            print()
    else:
        print("   No ESSL attendance logs found")
    print()
    
    # Check users with biometric IDs
    print("5. USERS WITH BIOMETRIC IDs:")
    print("-" * 30)
    users_with_biometric = CustomUser.objects.filter(
        biometric_id__isnull=False
    ).exclude(biometric_id='').order_by('employee_id')[:10]
    
    if users_with_biometric:
        for user in users_with_biometric:
            print(f"   - {user.get_full_name()}")
            print(f"     Employee ID: {user.employee_id}")
            print(f"     Biometric ID: {user.biometric_id}")
            print(f"     Office: {user.office.name if user.office else 'No office'}")
            print()
    else:
        print("   No users with biometric IDs found")
        print("   ⚠️  This means push data won't work - users need biometric IDs")
    print()
    
    # Statistics
    print("6. STATISTICS:")
    print("-" * 30)
    total_devices = Device.objects.count()
    active_devices = Device.objects.filter(is_active=True).count()
    total_users = CustomUser.objects.count()
    users_with_biometric_count = CustomUser.objects.filter(
        biometric_id__isnull=False
    ).exclude(biometric_id='').count()
    total_attendance = Attendance.objects.count()
    today_attendance_count = Attendance.objects.filter(date=today).count()
    total_logs = ESSLAttendanceLog.objects.count()
    
    print(f"   Total Devices: {total_devices}")
    print(f"   Active Devices: {active_devices}")
    print(f"   Total Users: {total_users}")
    print(f"   Users with Biometric IDs: {users_with_biometric_count}")
    print(f"   Total Attendance Records: {total_attendance}")
    print(f"   Today's Attendance Records: {today_attendance_count}")
    print(f"   Total ESSL Logs: {total_logs}")
    print()
    
    # Recommendations
    print("7. RECOMMENDATIONS:")
    print("-" * 30)
    
    if users_with_biometric_count == 0:
        print("    CRITICAL: No users have biometric IDs set")
        print("      - Push attendance won't work without biometric IDs")
        print("      - Update user records with biometric_id field")
    elif users_with_biometric_count < total_users * 0.5:
        print("   ⚠️  WARNING: Less than 50% of users have biometric IDs")
        print("      - Consider updating more users with biometric IDs")
    else:
        print("    Good: Most users have biometric IDs set")
    
    if total_devices == 0:
        print("    CRITICAL: No devices configured")
        print("      - Push data will create devices automatically")
    elif active_devices == 0:
        print("   ⚠️  WARNING: No active devices")
        print("      - Check device configurations")
    else:
        print("    Good: Active devices configured")
    
    if today_attendance_count == 0:
        print("   ℹ️  INFO: No attendance records for today")
        print("      - This is normal if no one has checked in yet")
    else:
        print(f"    Good: {today_attendance_count} attendance records for today")
    
    print()
    print("=" * 60)
    print("DATABASE VERIFICATION COMPLETED")
    print("=" * 60)

def test_database_connection():
    """Test database connection and basic operations"""
    print("Testing database connection...")
    try:
        # Test basic query
        user_count = CustomUser.objects.count()
        print(f" Database connection successful - {user_count} users found")
        
        # Test device query
        device_count = Device.objects.count()
        print(f" Device query successful - {device_count} devices found")
        
        # Test attendance query
        attendance_count = Attendance.objects.count()
        print(f" Attendance query successful - {attendance_count} attendance records found")
        
        return True
    except Exception as e:
        print(f" Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting database verification...")
    print()
    
    if test_database_connection():
        print()
        verify_database_records()
    else:
        print("Cannot proceed with verification due to database connection issues.")
        sys.exit(1)
