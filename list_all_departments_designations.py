#!/usr/bin/env python3
"""
List all departments and designations
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import Department, Designation

def list_all():
    """List all departments and designations"""
    print("🔍 All Departments and Designations...")
    
    try:
        # List all departments
        print(f"\n📋 All Departments ({Department.objects.count()}):")
        for dept in Department.objects.all():
            print(f"   {dept.id}: {dept.name}")
            
        # List all designations
        print(f"\n📋 All Designations ({Designation.objects.count()}):")
        for desig in Designation.objects.all():
            dept_name = desig.department.name if desig.department else "None"
            print(f"   {desig.id}: {desig.name} (Dept: {dept_name})")
            
        # Check if there are any designations for IT department
        print(f"\n📋 IT Department Designations:")
        try:
            it_dept = Department.objects.get(name__icontains='IT')
            print(f"   IT Department ID: {it_dept.id}")
            it_designations = Designation.objects.filter(department=it_dept)
            print(f"   IT Designations ({it_designations.count()}):")
            for desig in it_designations:
                print(f"      {desig.id}: {desig.name}")
        except Department.DoesNotExist:
            print("   No IT department found")
        except Exception as e:
            print(f"   Error: {e}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    list_all()

