#!/bin/bash
# VPS Migration Fix Script
# Run this on the VPS server to fix migration dependencies

echo "🔧 FIXING VPS MIGRATION DEPENDENCIES"
echo "=================================================="

# Step 1: Check current status
echo "1️⃣ Checking current migration status..."
python manage.py showmigrations core

# Step 2: Fake apply missing migrations
echo "2️⃣ Faking missing migrations..."
python manage.py migrate core 0005 --fake
python manage.py migrate core 0006 --fake
python manage.py migrate core 0007 --fake

# Step 3: Apply the new migration
echo "3️⃣ Applying new migration..."
python manage.py migrate core 0008

# Step 4: Check final status
echo "4️⃣ Checking final migration status..."
python manage.py showmigrations core

echo "✅ Migration fix completed!"
echo "You can now run: python manage.py runserver 8002"
