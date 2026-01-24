#!/bin/bash

# Simple script to push only salary system changes
echo " Pushing salary system changes to GitHub..."

# Add only the files we modified/created
git add core/models.py core/serializers.py core/urls.py
git add core/salary_views.py core/permissions.py
git add core/migrations/0004_add_salary_models.py 2>/dev/null || true
git add deploy_salary_only.py quick_deploy.sh push_salary_changes.sh
git add DEPLOYMENT_CHECKLIST.md SALARY_SYSTEM_DOCUMENTATION.md

# Commit with descriptive message
git commit -m "Add salary management system with auto-calculation and role-based permissions"

# Push to GitHub
git push origin main

echo " Salary system changes pushed to GitHub!"
echo "📋 Files pushed:"
git show --name-only --pretty=format: HEAD

echo ""
echo " On VPS server, run:"
echo "git pull origin main"
echo "python manage.py migrate core"
echo "sudo systemctl restart apache2"
