import os
import django
import sys

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Department, Designation, CustomUser
from django.db import transaction

def replace_departments_clean():
    print("--- Replacing & Cleaning Departments ---")
    
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
    
    # Check for Administration_BROKEN and treat it as Administration duplicate
    try:
        Department.objects.filter(name='Administration_BROKEN').update(name='Administration')
        print("Restored Administration_BROKEN to Administration checking pool.")
    except:
        pass

    for dept_name in required_depts:
        print(f"\nProcessing Group: '{dept_name}'")
        
        with transaction.atomic():
            # 1. Find ALL duplicates
            duplicates = list(Department.objects.filter(name=dept_name))
            
            if not duplicates:
                 print(f"  No existing department '{dept_name}'. Will create fresh.")
            else:
                 print(f"  Found {len(duplicates)} copies.")

            # 2. Rename ALL duplicates to free up the name
            for idx, dep in enumerate(duplicates):
                temp_name = f"{dept_name}_OLD_{idx}_{dep.id.hex[:4]}"
                print(f"    Renaming {dep.id.hex[:6]}... -> {temp_name}")
                dep.name = temp_name
                dep.save()
            
            # 3. Create ONE New Department
            print(f"  Creating New '{dept_name}'...")
            new_dept = Department.objects.create(name=dept_name, is_active=True)
            
            # 4. Migrate Data from ALL old copies
            migrated_desigs = 0
            migrated_users = 0
            
            for dep in duplicates:
                # Migrate Designations
                c1 = Designation.objects.filter(department=dep).update(department=new_dept)
                migrated_desigs += c1
                
                # Migrate Users
                c2 = CustomUser.objects.filter(department=dep).update(department=new_dept)
                migrated_users += c2
                
                # Delete Old
                print(f"    Deleting old copy {dep.name}...")
                dep.delete()

            print(f"  Total Migrated: {migrated_desigs} designations, {migrated_users} users.")

    print("\nDeep Cleanup Complete.")

if __name__ == "__main__":
    replace_departments_clean()
