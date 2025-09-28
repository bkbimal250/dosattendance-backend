#!/bin/bash

# Quick deployment script for salary system
# Only handles the salary-related changes

echo "🚀 Quick Salary System Deployment"
echo "================================="

# Step 1: Deploy salary system
echo "1. Deploying salary system..."
python deploy_salary_only.py

# Step 2: Add only recent changes to git
echo "2. Adding only recent changes to git..."
chmod +x git_add_recent_changes.sh
./git_add_recent_changes.sh

# Step 3: Show what will be committed
echo "3. Files ready for commit:"
git status --porcelain

echo ""
echo "✅ Ready to commit and push!"
echo ""
echo "Next commands:"
echo "git commit -m 'Add salary management system with auto-calculation'"
echo "git push origin main"
echo ""
echo "Then on VPS:"
echo "git pull origin main"
echo "python manage.py migrate core"
echo "sudo systemctl restart apache2"
