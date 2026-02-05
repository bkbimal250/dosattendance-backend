import os
import django
import sys

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Department, Designation

def repair_designations():
    print("Starting Designation Repair (Direct Update Mode)...")
    
    # 1. Fetch Departments
    depts = {d.name: d for d in Department.objects.all()}
    print(f"Found {len(depts)} departments.")
    for name, d in depts.items():
        print(f"  - {name}: {d.id}")
    
    # Mapping Rules
    mapping_rules = {
        'Accountant': 'Account',
        'Admin': 'Administration',
        'Head Manager': 'Administration',
        'Operation executive': 'Administration',
        'Back Office Executive': 'Back Office',
        'Data Entry Operator': 'Back Office',
        'Customer Support Executive': 'Back Office',
        'Digital Marketing': 'Digital Marketing',
        'Content Writer': 'Digital Marketing',
        'Social Media': 'Digital Marketing',
        'SEO': 'SEO',
        'Software': 'IT(information Technology)',
        'Web Developer': 'IT(information Technology)',
        'Application Analyst': 'IT(information Technology)',
        'Recruitment Officer': 'Human Resources',
        'Senior HR': 'Human Resources',
        'House Keeper': 'House Keeping',
        'Surveillance': 'Vision',
        'Real-Time Surveillance': 'Vision',
        'Team Leader': 'Manager' 
    }

    # Fetch all designations
    all_desigs = Designation.objects.all()
    updated_count = 0 
    
    for desig in all_desigs:
        target_dept_name = None
        
        # Determine target department based on name
        for keyword, dept_name in mapping_rules.items():
            if keyword in desig.name:
                target_dept_name = dept_name
                break
        
        if target_dept_name and target_dept_name in depts:
            target_dept = depts[target_dept_name]
            
            print(f"Linking '{desig.name}' (ID: {desig.id}) -> '{target_dept.name}' (ID: {target_dept.id})")
            
            try:
                # Use update() to bypass model validation and overhead
                Designation.objects.filter(id=desig.id).update(department=target_dept)
                updated_count += 1
            except Exception as e:
                 print(f"  ERROR updating '{desig.name}': {e}")
                 
        else:
            print(f"Skipping '{desig.name}' - No matching rule found or Department missing.")

    print(f"\nRepair Complete. Updated {updated_count} designations.")

if __name__ == "__main__":
    repair_designations()
