#!/usr/bin/env python3
"""
Script to get admin user credentials
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'attendance_system.settings')
django.setup()

from core.models import CustomUser

def get_admin_users():
    """Get admin users from the database"""
    print("🔍 Admin Users in Database:")
    print("=" * 50)
    
    # Get superusers
    superusers = CustomUser.objects.filter(is_superuser=True)
    print(f"\n👑 Superusers ({superusers.count()}):")
    for user in superusers:
        print(f"  - Username: {user.username}")
        print(f"    Email: {user.email}")
        print(f"    Role: {user.role}")
        print(f"    Is Active: {user.is_active}")
        print(f"    First Name: {user.first_name}")
        print(f"    Last Name: {user.last_name}")
        print()
    
    # Get admin role users
    admin_users = CustomUser.objects.filter(role='admin')
    print(f"👨‍💼 Admin Role Users ({admin_users.count()}):")
    for user in admin_users:
        print(f"  - Username: {user.username}")
        print(f"    Email: {user.email}")
        print(f"    Role: {user.role}")
        print(f"    Is Active: {user.is_active}")
        print(f"    First Name: {user.first_name}")
        print(f"    Last Name: {user.last_name}")
        print()
    
    # Get first few regular users
    regular_users = CustomUser.objects.filter(is_superuser=False, role__in=['employee', 'manager'])[:5]
    print(f"👥 Sample Regular Users ({regular_users.count()}):")
    for user in regular_users:
        print(f"  - Username: {user.username}")
        print(f"    Role: {user.role}")
        print(f"    Is Active: {user.is_active}")
        print()

if __name__ == "__main__":
    get_admin_users()
