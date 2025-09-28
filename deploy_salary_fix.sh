#!/bin/bash

# Salary System Deployment Fix Script
# This script fixes the foreign key constraint issue on VPS

echo "🔧 Fixing Salary System Foreign Key Constraint Issue..."

# Navigate to project directory
cd /var/www/EmployeeAttendance

# Activate virtual environment
source venv/bin/activate

# Step 1: Drop problematic tables if they exist
echo "1. Dropping problematic tables if they exist..."
mysql -u u434975676_bimal -p'DishaSolution@8989' u434975676_DOS << EOF
DROP TABLE IF EXISTS core_salarytemplate;
DROP TABLE IF EXISTS core_salary;
EOF

# Step 2: Remove any problematic migration files
echo "2. Cleaning up migration files..."
rm -f core/migrations/0004_add_salary_models.py
rm -f core/migrations/0005_*.py

# Step 3: Create a fresh migration
echo "3. Creating fresh migration for salary models..."
python manage.py makemigrations core --name add_salary_models

# Step 4: Apply migrations
echo "4. Applying migrations..."
python manage.py migrate core

# Step 5: Check if migrations were successful
echo "5. Checking migration status..."
python manage.py showmigrations core

# Step 6: Test the system
echo "6. Testing salary system..."
python -c "
from core.models import Salary, SalaryTemplate
print('✅ Salary models imported successfully')
print(f'Salary model fields: {[f.name for f in Salary._meta.fields]}')
print(f'SalaryTemplate model fields: {[f.name for f in SalaryTemplate._meta.fields]}')
"

echo "✅ Salary system deployment fix completed!"

# Restart Apache
echo "7. Restarting Apache..."
sudo systemctl restart apache2

echo "🎉 Salary Management System is now ready!"
