#!/bin/bash

# Quick script to push salary changes to GitHub
echo "🚀 Pushing salary changes to GitHub..."

# Add only the modified/new files
git add core/models.py core/serializers.py core/urls.py
git add core/salary_views.py core/permissions.py
git add core/migrations/0004_add_salary_models.py 2>/dev/null || true
git add *.sh *.py *.md

# Commit
git commit -m "Add salary management system with auto-calculation"

# Push
git push origin main

echo "✅ Pushed to GitHub!"
echo "📋 Files:"
git show --name-only --pretty=format: HEAD

echo ""
echo "🚀 On VPS:"
echo "git pull origin main"
echo "python manage.py migrate core"
echo "sudo systemctl restart apache2"
