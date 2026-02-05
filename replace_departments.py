import os
import django
import sys

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Department, Designation, CustomUser
from django.db import transaction
from django.db.models import Q

def replace_departments():
    print("--- Replacing Departments ---")
    
    # List of departments we need
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
        'ID' # Was in the list
    ]
    
    # Also handle the BROKEN one specifically if it exists
    try:
        broken = Department.objects.get(name='Administration_BROKEN')
        print("Found Administration_BROKEN. Will process it as Administration.")
    except Department.DoesNotExist:
        broken = None

    for dept_name in required_depts:
        print(f"\nProcessing '{dept_name}'...")
        
        with transaction.atomic():
            # 1. Find Existing/Old Department
            old_dept = None
            if dept_name == 'Administration' and broken:
                 old_dept = broken
            else:
                try:
                    # Filter by name, excluding _OLD ones just in case
                    old_dept = Department.objects.get(name=dept_name)
                except Department.DoesNotExist:
                    print(f"  Old department '{dept_name}' not found. Skipping migrate, will create new.")
                except Department.MultipleObjectsReturned:
                    old_dept = Department.objects.filter(name=dept_name).first()
                    print(f"  Multiple '{dept_name}' found. Using first.")

            # 2. Rename Old
            if old_dept:
                new_old_name = f"{dept_name}_OLD_{old_dept.id.hex[:4]}"
                print(f"  Renaming Old '{old_dept.name}' -> '{new_old_name}'")
                old_dept.name = new_old_name
                old_dept.save()
            
            # 3. Create New
            print(f"  Creating New '{dept_name}'...")
            new_dept = Department.objects.create(name=dept_name, is_active=True)
            
            # 4. Migrate Designations
            if old_dept:
                # Use .update() to be safe against instance cache issues
                count = Designation.objects.filter(department=old_dept).update(department=new_dept)
                print(f"  Migrated {count} designations.")
                
                # 5. Migrate Users
                u_count = CustomUser.objects.filter(department=old_dept).update(department=new_dept)
                print(f"  Migrated {u_count} users.")
                
                # 6. Delete Old
                print(f"  Deleting Old '{old_dept.name}'...")
                old_dept.delete()
            
            # 7. Additional Repair for Designations (from STANDALONE Logic)
            # Re-run the mapping logic for THIS department just to be sure we catch everything
            # (In case designations were orphan)
            # We can run the repair_designations logic globally later.

    print("\nDepartment Replacement Complete.")

if __name__ == "__main__":
    replace_departments()
