#!/bin/bash

# Copy and paste this command to push salary changes to GitHub

echo "🚀 Running command to push salary changes to GitHub..."

# Add only the salary system files
git add core/models.py core/serializers.py core/urls.py
git add core/salary_views.py core/permissions.py
git add core/migrations/0004_add_salary_models.py 2>/dev/null || true
git add *.sh *.py *.md

# Commit with message
git commit -m "Add salary management system with auto-calculation and role-based permissions"

# Push to GitHub
git push origin main

echo "✅ SUCCESS! Salary system changes pushed to GitHub!"
echo ""
echo "📋 Files pushed:"
git show --name-only --pretty=format: HEAD

echo ""
echo "🚀 Next step: On VPS server, run:"
echo "git pull origin main"
echo "python manage.py migrate core"
echo "sudo systemctl restart apache2"
