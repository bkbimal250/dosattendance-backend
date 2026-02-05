from core.models import Department, Designation
from django.db.models import Q

def repair_designations():
    print("Starting Designation Repair...")
    
    # 1. Fetch Departments
    depts = {d.name: d for d in Department.objects.all()}
    print(f"Found {len(depts)} departments.")
    
    # Mapping Rules (Designation Name Substring/Exact -> Department Name)
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
        'Team Leader': 'Manager' # Defaulting to Manager dept
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
            
            # Only update if currently orphaned or wrong (optional: we can force update)
            # Checking if it has NO department (orphaned)
            try:
                if desig.department_id is None: # This check might fail if strict Foreign Key, but Django usually allows object access with Null
                     pass 
            except:
                pass # Accessing .department might raise error if related object missing but ID present?

            # We will just force assign to be sure
            print(f"Linking '{desig.name}' -> '{target_dept.name}'")
            desig.department = target_dept
            desig.save()
            updated_count += 1
        else:
            print(f"Skipping '{desig.name}' - No matching rule found or Department missing.")

    print(f"\nRepair Complete. Updated {updated_count} designations.")

if __name__ == "__main__":
    repair_designations()
