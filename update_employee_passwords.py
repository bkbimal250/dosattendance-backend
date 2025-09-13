#!/usr/bin/env python3
"""
Script to update all employee passwords to 'Dos@2026'
Keeps usernames the same, only changes passwords
"""

import os
import sys
import django
from django.contrib.auth.hashers import make_password

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import CustomUser

def update_employee_passwords():
    """Update all employee passwords to 'Dos@2026'"""
    
    # Get all users with employee role
    employees = CustomUser.objects.filter(role='employee')
    
    if not employees.exists():
        print("❌ No employees found in the database")
        return
    
    print(f"📋 Found {employees.count()} employees to update")
    print("🔐 Updating passwords to 'Dos@2026'...")
    
    updated_count = 0
    failed_count = 0
    
    for employee in employees:
        try:
            # Update password
            employee.password = make_password('Dos@2026')
            employee.save()
            
            print(f"✅ Updated password for: {employee.username} ({employee.get_full_name()})")
            updated_count += 1
            
        except Exception as e:
            print(f"❌ Failed to update password for {employee.username}: {str(e)}")
            failed_count += 1
    
    print("\n" + "="*50)
    print("📊 PASSWORD UPDATE SUMMARY")
    print("="*50)
    print(f"✅ Successfully updated: {updated_count} employees")
    print(f"❌ Failed to update: {failed_count} employees")
    print(f"📋 Total employees: {employees.count()}")
    print("="*50)
    
    if updated_count > 0:
        print("🎉 Password update completed successfully!")
        print("🔑 All employees can now login with password: Dos@2026")
    else:
        print("⚠️  No passwords were updated")

if __name__ == "__main__":
    print("🚀 Starting employee password update...")
    print("="*50)
    
    try:
        update_employee_passwords()
    except Exception as e:
        print(f"❌ Error during password update: {str(e)}")
        sys.exit(1)
    
    print("\n✅ Script completed!")
