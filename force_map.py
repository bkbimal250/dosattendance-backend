import os
import django
import sys
from django.db import transaction

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Designation, Department

def force_map():
    print("--- Force Mapping ---")
    
    try:
        admin_dept = Department.objects.get(name='Administration')
        print(f"Target: Administration ({admin_dept.id})")
        
        # 1. Operation executive
        count = Designation.objects.filter(name='Operation executive').update(department=admin_dept)
        print(f"Updated {count} 'Operation executive' to Administration.")
        
        # 2. Head Manager
        count = Designation.objects.filter(name='Head Manager').update(department=admin_dept)
        print(f"Updated {count} 'Head Manager' to Administration.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    force_map()
