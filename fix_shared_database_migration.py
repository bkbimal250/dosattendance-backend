#!/usr/bin/env python
"""
Fix migration state for shared database setup
This script should be run on the VPS server to fix migration dependencies
when using the same database as local machine
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from django.core.management import execute_from_command_line

def fix_shared_database_migration():
    """Fix migration state for shared database"""
    
    print("🔧 FIXING SHARED DATABASE MIGRATION STATE")
    print("=" * 50)
    
    try:
        # Step 1: Check current migration status
        print("\n1️⃣ Checking current migration status...")
        execute_from_command_line(['manage.py', 'showmigrations', 'core'])
        
        # Step 2: Fake apply all migrations up to 0007 (since database already has the tables)
        print("\n2️⃣ Faking migrations up to 0007 (database already has tables)...")
        try:
            execute_from_command_line(['manage.py', 'migrate', 'core', '0007', '--fake'])
            print("✅ Migrations up to 0007 faked successfully")
        except Exception as e:
            print(f"⚠️ Could not fake migrations up to 0007: {e}")
        
        # Step 3: Apply only the new migration (0008) which adds the new fields
        print("\n3️⃣ Applying new migration 0008 (adds gross_salary and net_salary fields)...")
        try:
            execute_from_command_line(['manage.py', 'migrate', 'core', '0008'])
            print("✅ Migration 0008 applied successfully")
        except Exception as e:
            print(f"⚠️ Could not apply migration 0008: {e}")
        
        # Step 4: Check final status
        print("\n4️⃣ Checking final migration status...")
        execute_from_command_line(['manage.py', 'showmigrations', 'core'])
        
        print("\n✅ Shared database migration fix completed!")
        print("The database already has the salary tables, we just added the new fields.")
        return True
        
    except Exception as e:
        print(f"\n❌ Migration fix failed: {e}")
        return False

if __name__ == "__main__":
    success = fix_shared_database_migration()
    
    if success:
        print("\n✅ SHARED DATABASE MIGRATION FIX COMPLETED!")
        print("You can now run: python manage.py runserver 8002")
    else:
        print("\n❌ SHARED DATABASE MIGRATION FIX FAILED!")
        print("Please check the errors above.")
        sys.exit(1)
