#!/usr/bin/env python
"""
Script to print accountant data and system information to console
"""
import os
import sys
import django
from datetime import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import CustomUser, Attendance, Office, Department, Designation
from django.contrib.auth import authenticate

def print_separator(title):
    """Print a separator with title"""
    print("\n" + "="*80)
    print(f" {title}")
    print("="*80)

def print_user_info(user):
    """Print detailed user information"""
    print(f"ID: {user.id}")
    print(f"Username: {user.username}")
    print(f"Full Name: {user.get_full_name()}")
    print(f"Email: {user.email}")
    print(f"Role: {user.role}")
    print(f"Employee ID: {user.employee_id}")
    print(f"Office: {user.office.name if user.office else 'N/A'}")
    print(f"Department: {user.department.name if user.department else 'N/A'}")
    print(f"Designation: {user.designation.name if user.designation else 'N/A'}")
    print(f"Phone: {user.phone or 'N/A'}")
    print(f"Gender: {user.get_gender_display() if user.gender else 'N/A'}")
    print(f"Joining Date: {user.joining_date or 'N/A'}")
    print(f"Salary: {user.salary or 'N/A'}")
    print(f"Is Active: {user.is_active}")
    print(f"Created: {user.created_at}")
    print(f"Updated: {user.updated_at}")

def main():
    print_separator("EMPLOYEE ATTENDANCE SYSTEM - ACCOUNTANT DATA")
    print(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test accountant login
    print_separator("ACCOUNTANT LOGIN TEST")
    try:
        accountant = authenticate(username='sejalmisal', password='Dos@2026')
        if accountant:
            print(" Login successful!")
            print_user_info(accountant)
        else:
            print(" Login failed!")
    except Exception as e:
        print(f" Login error: {e}")
    
    # Print all offices
    print_separator("ALL OFFICES")
    offices = Office.objects.all()
    print(f"Total Offices: {offices.count()}")
    for office in offices:
        print(f"\n🏢 {office.name}")
        print(f"   Address: {office.address}")
        print(f"   City: {office.city}")
        print(f"   Phone: {office.phone}")
        print(f"   Email: {office.email}")
        print(f"   Active: {office.is_active}")
        print(f"   Managers: {office.managers.count()}")
    
    # Print all users by office
    print_separator("ALL USERS BY OFFICE")
    for office in offices:
        users = CustomUser.objects.filter(office=office)
        print(f"\n🏢 {office.name} - {users.count()} users")
        for user in users:
            print(f"   👤 {user.get_full_name()} ({user.role}) - ID: {user.employee_id}")
    
    # Print user statistics
    print_separator("USER STATISTICS")
    total_users = CustomUser.objects.count()
    admin_count = CustomUser.objects.filter(role='admin').count()
    manager_count = CustomUser.objects.filter(role='manager').count()
    employee_count = CustomUser.objects.filter(role='employee').count()
    accountant_count = CustomUser.objects.filter(role='accountant').count()
    
    print(f"Total Users: {total_users}")
    print(f"Admins: {admin_count}")
    print(f"Managers: {manager_count}")
    print(f"Employees: {employee_count}")
    print(f"Accountants: {accountant_count}")
    
    # Print recent attendance records
    print_separator("RECENT ATTENDANCE RECORDS")
    recent_attendance = Attendance.objects.select_related('user', 'user__office').order_by('-date', '-check_in_time')[:10]
    print(f"Showing last 10 attendance records:")
    for record in recent_attendance:
        print(f"\n📅 {record.date}")
        print(f"   👤 {record.user.get_full_name()} ({record.user.office.name if record.user.office else 'N/A'})")
        print(f"   ⏰ Check-in: {record.check_in_time.strftime('%H:%M:%S') if record.check_in_time else 'N/A'}")
        print(f"   ⏰ Check-out: {record.check_out_time.strftime('%H:%M:%S') if record.check_out_time else 'N/A'}")
        print(f"   ⏱️  Total Hours: {record.total_hours or 'N/A'}")
        print(f"   📊 Status: {record.status} ({record.day_status})")
        print(f"   🕐 Late: {record.late_minutes} minutes" if record.is_late else "    On time")
    
    # Print departments and designations
    print_separator("DEPARTMENTS AND DESIGNATIONS")
    departments = Department.objects.all()
    print(f"Total Departments: {departments.count()}")
    for dept in departments:
        designations = Designation.objects.filter(department=dept)
        print(f"\n📁 {dept.name}")
        print(f"   Designations: {designations.count()}")
        for desig in designations:
            print(f"      - {desig.name}")
    
    # Print accountant specific data
    print_separator("ACCOUNTANT SPECIFIC DATA")
    try:
        accountant_user = CustomUser.objects.get(username='sejalmisal')
        print(f"Accountant: {accountant_user.get_full_name()}")
        print(f"Can access all offices: ")
        print(f"Can view all users: ")
        print(f"Can view all attendance: ")
        print(f"Can update own profile: ")
        print(f"Can create/edit users:  (Read-only)")
        print(f"Can create/edit attendance:  (Read-only)")
        
        # Show accountant's own attendance
        accountant_attendance = Attendance.objects.filter(user=accountant_user).order_by('-date')[:5]
        print(f"\nAccountant's recent attendance ({accountant_attendance.count()} records):")
        for record in accountant_attendance:
            print(f"   📅 {record.date}: {record.status} ({record.total_hours or 0} hours)")
            
    except CustomUser.DoesNotExist:
        print(" Accountant user not found!")
    
    print_separator("SYSTEM INFORMATION")
    print(f"Django Version: {django.get_version()}")
    print(f"Database: MySQL")
    print(f"Total Models:")
    print(f"  - Users: {CustomUser.objects.count()}")
    print(f"  - Offices: {Office.objects.count()}")
    print(f"  - Attendance Records: {Attendance.objects.count()}")
    print(f"  - Departments: {Department.objects.count()}")
    print(f"  - Designations: {Designation.objects.count()}")
    
    print_separator("END OF REPORT")

if __name__ == "__main__":
    main()
