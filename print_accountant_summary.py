#!/usr/bin/env python
"""
Focused script to print accountant-specific data summary
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import CustomUser, Attendance, Office

def print_separator(title):
    """Print a separator with title"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def main():
    print_separator("ACCOUNTANT DATA SUMMARY")
    print(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Get accountant user
    try:
        accountant = CustomUser.objects.get(username='sejalmisal')
        print(f"\n👩‍💼 ACCOUNTANT: {accountant.get_full_name()}")
        print(f"   Role: {accountant.role}")
        print(f"   Employee ID: {accountant.employee_id}")
        print(f"   Office: {accountant.office.name if accountant.office else 'N/A'}")
        print(f"   Email: {accountant.email}")
        print(f"   Active: {accountant.is_active}")
    except CustomUser.DoesNotExist:
        print(" Accountant not found!")
        return
    
    # Show all offices the accountant can access
    print_separator("OFFICES ACCESSIBLE TO ACCOUNTANT")
    offices = Office.objects.all()
    print(f"Total Offices: {offices.count()}")
    for office in offices:
        user_count = CustomUser.objects.filter(office=office).count()
        print(f"\n🏢 {office.name}")
        print(f"   Users: {user_count}")
        print(f"   City: {office.city}")
        print(f"   Phone: {office.phone}")
    
    # Show user counts by role across all offices
    print_separator("USER STATISTICS (ALL OFFICES)")
    total_users = CustomUser.objects.count()
    admin_count = CustomUser.objects.filter(role='admin').count()
    manager_count = CustomUser.objects.filter(role='manager').count()
    employee_count = CustomUser.objects.filter(role='employee').count()
    accountant_count = CustomUser.objects.filter(role='accountant').count()
    
    print(f"Total Users: {total_users}")
    print(f"  👑 Admins: {admin_count}")
    print(f"  👨‍💼 Managers: {manager_count}")
    print(f"  👷 Employees: {employee_count}")
    print(f"  👩‍💼 Accountants: {accountant_count}")
    
    # Show recent attendance data
    print_separator("RECENT ATTENDANCE DATA")
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    
    recent_attendance = Attendance.objects.filter(
        date__gte=week_ago
    ).select_related('user', 'user__office').order_by('-date', '-check_in_time')[:20]
    
    print(f"Attendance records from last 7 days: {recent_attendance.count()}")
    
    # Group by date
    attendance_by_date = {}
    for record in recent_attendance:
        date_str = record.date.strftime('%Y-%m-%d')
        if date_str not in attendance_by_date:
            attendance_by_date[date_str] = {'present': 0, 'absent': 0, 'total': 0}
        attendance_by_date[date_str]['total'] += 1
        if record.status == 'present':
            attendance_by_date[date_str]['present'] += 1
        else:
            attendance_by_date[date_str]['absent'] += 1
    
    for date_str in sorted(attendance_by_date.keys(), reverse=True):
        data = attendance_by_date[date_str]
        print(f"\n📅 {date_str}")
        print(f"   Total: {data['total']} | Present: {data['present']} | Absent: {data['absent']}")
    
    # Show accountant's own attendance
    print_separator("ACCOUNTANT'S ATTENDANCE")
    accountant_attendance = Attendance.objects.filter(
        user=accountant,
        date__gte=week_ago
    ).order_by('-date')
    
    print(f"Accountant's attendance (last 7 days): {accountant_attendance.count()} records")
    for record in accountant_attendance:
        status_emoji = "" if record.status == 'present' else ""
        hours = f"({record.total_hours}h)" if record.total_hours else ""
        print(f"   {status_emoji} {record.date}: {record.status} {hours}")
    
    # Show system totals
    print_separator("SYSTEM TOTALS")
    total_attendance = Attendance.objects.count()
    total_offices = Office.objects.count()
    
    print(f"📊 Total Attendance Records: {total_attendance:,}")
    print(f"🏢 Total Offices: {total_offices}")
    print(f"👥 Total Users: {total_users}")
    
    # Show permissions summary
    print_separator("ACCOUNTANT PERMISSIONS")
    print(" Can view all users from all offices")
    print(" Can view all attendance records")
    print(" Can view all offices")
    print(" Can update own profile")
    print(" Cannot create/edit users (Read-only)")
    print(" Cannot create/edit attendance (Read-only)")
    print(" Cannot create/edit offices (Read-only)")
    
    print_separator("END OF SUMMARY")

if __name__ == "__main__":
    main()
