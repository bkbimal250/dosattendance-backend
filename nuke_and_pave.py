import os
import django
import sys
import uuid

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Department, Designation, CustomUser
from django.db import transaction

def nuke_and_pave():
    print("--- Nuke and Pave Departments ---")
    
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
    
    # 1. Handle Known Broken ID explicitly
    broken_id = '8b0ae5c0-d345-4aab-ba31-8e9a7ca2223c'
    print(f"Checking for broken ID {broken_id}...")
    try:
        # We need to manually link these to something else temporarily or just let them be fixed by the loop
        pass 
    except:
        pass

    for dept_name in required_depts:
        print(f"\nProcessing Group: '{dept_name}'")
        
        # Define New Temp Dept
        temp_name = f"TEMP_{dept_name}_{uuid.uuid4().hex[:8]}"
        print(f"  Creating Temp Dept '{temp_name}'...")
        new_dept = Department.objects.create(name=temp_name, is_active=True)
        
        # Determine Victims (Old Departments)
        # Match exact name, or the BROKEN one if this is Administration
        victims = list(Department.objects.filter(name=dept_name))
        
        # Special case for Administration
        if dept_name == 'Administration':
            try:
                b = Department.objects.get(id=broken_id)
                if b not in victims:
                    victims.append(b)
            except Department.DoesNotExist:
                pass
            
            # Also catch duplicate names if any (case insensitive check via python?)
            # victims already covers exact match.
        
        print(f"  Found {len(victims)} victims to replace.")
        
        # Migrate Data
        for v in victims:
            print(f"    Migrating from '{v.name}' ({v.id})...")
            
            # Designations
            start_count = Designation.objects.filter(department=v).count()
            Designation.objects.filter(department=v).update(department=new_dept)
            end_count = Designation.objects.filter(department=new_dept).count()
            # Note: update returns rows matched.
            
            # Users
            CustomUser.objects.filter(department=v).update(department=new_dept)
            
        # Delete Victims
        for v in victims:
            print(f"    Deleting '{v.name}'...")
            try:
                v.delete()
            except Exception as e:
                print(f"      Error deleting: {e}")
                
        # Rename New Dept to Final Name
        print(f"  Renaming '{new_dept.name}' -> '{dept_name}'")
        new_dept.name = dept_name
        new_dept.save()
        
    print("\nNuke and Pave Complete.")

if __name__ == "__main__":
    nuke_and_pave()
