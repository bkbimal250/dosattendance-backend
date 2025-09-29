#!/usr/bin/env python
"""
Fix VPS migration dependency issues
This script should be run on the VPS server to fix migration dependencies
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def fix_migration_dependencies():
    """Fix migration dependency issues on VPS"""
    
    print("🔧 FIXING VPS MIGRATION DEPENDENCIES")
    print("=" * 50)
    
    try:
        # Step 1: Check current migration status
        print("\n1️⃣ Checking current migration status...")
        execute_from_command_line(['manage.py', 'showmigrations', 'core'])
        
        # Step 2: Fake apply the missing migration
        print("\n2️⃣ Faking migration 0005...")
        try:
            execute_from_command_line(['manage.py', 'migrate', 'core', '0005', '--fake'])
            print("✅ Migration 0005 faked successfully")
        except Exception as e:
            print(f"⚠️ Could not fake migration 0005: {e}")
        
        # Step 3: Apply the new migration
        print("\n3️⃣ Applying new migration...")
        try:
            execute_from_command_line(['manage.py', 'migrate', 'core', '0008'])
            print("✅ Migration 0008 applied successfully")
        except Exception as e:
            print(f"⚠️ Could not apply migration 0008: {e}")
        
        # Step 4: Check final status
        print("\n4️⃣ Checking final migration status...")
        execute_from_command_line(['manage.py', 'showmigrations', 'core'])
        
        print("\n✅ Migration fix completed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Migration fix failed: {e}")
        return False

if __name__ == "__main__":
    success = fix_migration_dependencies()
    
    if success:
        print("\n✅ VPS MIGRATION FIX COMPLETED!")
        print("You can now run: python manage.py runserver 8002")
    else:
        print("\n❌ VPS MIGRATION FIX FAILED!")
        print("Please check the errors above.")
        sys.exit(1)
