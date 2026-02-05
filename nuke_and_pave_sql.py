import os
import django
import sys
import uuid
from django.db import connection

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Department

def nuke_and_pave_sql():
    print("--- SQL Nuke and Pave Departments ---")
    
    required_depts = [
        'Account',
        'Administration',
        'Back Office',
        'Digital Marketing',
        'House Keeping',
        'Human Resources',
        'IT(information Technology)',
        'Management and Administration',
        'Manager',
        'SEO',
        'Vision',
        'ID'
    ]
    
    # Also handle BROKEN name
    extra_targets = ['Administration_BROKEN']

    for dept_name in required_depts:
        print(f"\nProcessing Group: '{dept_name}'")
        
        # 1. Create New Dept (Standardized via Django logic)
        # We assume Django ORM inserts Dashed ID now based on logs.
        try:
            # We use a temp name first to avoid collision with existing
            temp_name = f"FINAL_{dept_name}_{uuid.uuid4().hex[:4]}"
            new_dept = Department.objects.create(name=temp_name, is_active=True)
            print(f"  Created New '{new_dept.name}' (ID: {new_dept.id})")
            
            with connection.cursor() as cursor:
                # 2. Find Victims (Old IDs)
                # Ensure we strictly match name (and account for BROKEN if Admin)
                target_names = [dept_name]
                if dept_name == 'Administration':
                    target_names.append('Administration_BROKEN')
                
                placeholders = ','.join(['%s'] * len(target_names))
                query = f"SELECT id FROM core_department WHERE name IN ({placeholders}) AND id != %s"
                params = target_names + [str(new_dept.id)] # new_dept.id is UUID obj, str() gives dashes
                
                cursor.execute(query, params)
                victim_rows = cursor.fetchall()
                print(f"  Found {len(victim_rows)} victims via SQL.")
                
                for r in victim_rows:
                    old_id = r[0] # This could be bytes or string
                    # Helper to handle byte-string conversion if needed
                    # But passing it back to SQL param usually works fine if it's what DB returned.
                    
                    print(f"    Migrating from ID: {old_id}...")
                    
                    # Migrate Designations
                    cursor.execute(
                        "UPDATE core_designation SET department_id = %s WHERE department_id = %s",
                        [str(new_dept.id), old_id]
                    )
                    
                    # Migrate Users
                    cursor.execute(
                        "UPDATE core_customuser SET department_id = %s WHERE department_id = %s",
                        [str(new_dept.id), old_id]
                    )
                    
                    # Delete Victim
                    print(f"    Deleting Victim ID: {old_id}")
                    cursor.execute(
                        "DELETE FROM core_department WHERE id = %s",
                        [old_id]
                    )
            
            # 3. Rename New to Final
            print(f"  Renaming '{temp_name}' -> '{dept_name}'")
            new_dept.name = dept_name
            new_dept.save()
            print("  SUCCESS.")
            
        except Exception as e:
            print(f"  FAILURE: {e}")

    print("\nSQL Pave Complete.")

if __name__ == "__main__":
    nuke_and_pave_sql()
