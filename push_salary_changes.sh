#!/bin/bash

# Script to add only recent salary system changes and push to GitHub
# This will only commit the files we modified/created for the salary system

echo "🚀 Adding and pushing only recent salary system changes..."
echo "========================================================"

# Step 1: Add only the specific files we created/modified for salary system
echo "1. Adding salary system files to git..."

# Core Django files (modified)
git add core/models.py
git add core/serializers.py
git add core/urls.py

# New files created
git add core/salary_views.py
git add core/permissions.py

# Migration files (if they exist)
if [ -f "core/migrations/0004_add_salary_models.py" ]; then
    git add core/migrations/0004_add_salary_models.py
    echo "   ✅ Added migration file"
fi

# Deployment scripts
git add deploy_salary_only.py
git add git_add_recent_changes.sh
git add quick_deploy.sh
git add push_salary_changes.sh

# Documentation
git add DEPLOYMENT_CHECKLIST.md
git add SALARY_SYSTEM_DOCUMENTATION.md
git add SALARY_DEPLOYMENT_FIX.md

# Test scripts
if [ -f "test_salary_local.py" ]; then
    git add test_salary_local.py
fi

if [ -f "test_salary_system.py" ]; then
    git add test_salary_system.py
fi

echo "2. Files staged for commit:"
git status --porcelain

# Step 2: Commit the changes
echo "3. Committing changes..."
git commit -m "Add comprehensive salary management system

- Add Salary and SalaryTemplate models with auto-calculation
- Add salary serializers for API operations
- Add salary views with role-based permissions
- Add custom permissions for salary access control
- Add salary API endpoints to URLs
- Add deployment and testing scripts
- Add comprehensive documentation

Features:
- Auto-calculation from attendance data
- Role-based permissions (Admin/Manager/Accountant/Employee)
- Approval workflow (Draft → Approved → Paid)
- Bulk salary creation and processing
- Salary templates for different designations
- Comprehensive reporting and statistics"

# Step 3: Push to GitHub
echo "4. Pushing to GitHub..."
git push origin main

echo ""
echo "✅ SUCCESS! Salary system changes pushed to GitHub!"
echo ""
echo "📋 What was pushed:"
echo "✅ core/models.py (updated with Salary models)"
echo "✅ core/serializers.py (updated with Salary serializers)"
echo "✅ core/salary_views.py (new salary views)"
echo "✅ core/permissions.py (new permissions)"
echo "✅ core/urls.py (updated with Salary URLs)"
echo "✅ Migration files (new)"
echo "✅ Deployment scripts"
echo "✅ Documentation"
echo ""
echo "🚀 Next step: Pull changes on VPS server"
echo "   git pull origin main"
echo "   python manage.py migrate core"
echo "   sudo systemctl restart apache2"
