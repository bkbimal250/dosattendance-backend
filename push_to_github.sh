#!/bin/bash

# Script to push salary system changes to GitHub
# Run this first, then pull on VPS

echo "🚀 Pushing salary system changes to GitHub..."
echo "============================================="

# Step 1: Check current git status
echo "1. Checking git status..."
git status --short

# Step 2: Add only the salary system files
echo "2. Adding salary system files..."

# Core Django files (modified)
git add core/models.py
git add core/serializers.py  
git add core/urls.py

# New files created
git add core/salary_views.py
git add core/permissions.py

# Migration files
if [ -f "core/migrations/0004_add_salary_models.py" ]; then
    git add core/migrations/0004_add_salary_models.py
    echo "   ✅ Added migration file"
fi

# Deployment scripts
git add deploy_salary_only.py
git add quick_deploy.sh
git add push_salary_changes.sh
git add simple_push.sh
git add push_to_github.sh

# Documentation
git add DEPLOYMENT_CHECKLIST.md
git add SALARY_SYSTEM_DOCUMENTATION.md
git add SALARY_DEPLOYMENT_FIX.md

echo "3. Files staged for commit:"
git status --porcelain

# Step 3: Commit changes
echo "4. Committing changes..."
git commit -m "Add comprehensive salary management system

Features added:
- Salary and SalaryTemplate models with auto-calculation
- Salary serializers for API operations  
- Salary views with role-based permissions
- Custom permissions for salary access control
- Salary API endpoints
- Auto-calculation from attendance data
- Approval workflow (Draft → Approved → Paid)
- Bulk salary creation and processing
- Salary templates for different designations
- Comprehensive reporting and statistics

API Endpoints:
- GET/POST /api/salaries/ - List/Create salaries
- GET/PUT/PATCH/DELETE /api/salaries/{id}/ - Salary details
- PATCH /api/salaries/{id}/approve/ - Approve salary
- PATCH /api/salaries/{id}/payment/ - Mark as paid
- POST /api/salaries/bulk-create/ - Bulk create
- POST /api/salaries/auto-calculate/ - Auto-calculate from attendance
- GET /api/salaries/reports/ - Salary reports
- GET /api/salary-templates/ - Salary templates"

# Step 4: Push to GitHub
echo "5. Pushing to GitHub..."
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
echo "   ssh root@your-vps-ip"
echo "   cd /var/www/EmployeeAttendance"
echo "   git pull origin main"
echo "   source venv/bin/activate"
echo "   python manage.py migrate core"
echo "   sudo systemctl restart apache2"
