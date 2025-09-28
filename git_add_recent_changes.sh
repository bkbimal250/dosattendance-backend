#!/bin/bash

# Script to add only recently changed files for salary system
# This will only add the files we modified/created for the salary system

echo "🔧 Adding only recent salary system changes to git..."

# Add only the specific files we created/modified for salary system
git add core/models.py
git add core/serializers.py
git add core/salary_views.py
git add core/permissions.py
git add core/urls.py

# Add migration files if they exist
if [ -f "core/migrations/0004_add_salary_models.py" ]; then
    git add core/migrations/0004_add_salary_models.py
fi

# Add deployment and test scripts
git add deploy_salary_system.py
git add test_salary_local.py
git add fix_salary_migration_local.py
git add DEPLOYMENT_CHECKLIST.md
git add SALARY_SYSTEM_DOCUMENTATION.md
git add SALARY_DEPLOYMENT_FIX.md

# Add test script if it exists
if [ -f "test_salary_system.py" ]; then
    git add test_salary_system.py
fi

# Check what files are staged
echo "📋 Files staged for commit:"
git status --porcelain

echo "✅ Only salary system files added to git!"
echo ""
echo "Next steps:"
echo "1. git commit -m 'Add comprehensive salary management system'"
echo "2. git push origin main"
