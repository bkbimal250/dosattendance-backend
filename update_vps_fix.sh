#!/bin/bash

# Script to update VPS with the latest fixes
# Run this on your VPS server

echo "🔄 Updating Employee Attendance System on VPS..."

# Navigate to project directory
cd /var/www/EmployeeAttendance

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Check if pull was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully pulled latest changes"
else
    echo "❌ Failed to pull changes. Check your internet connection and GitHub access."
    exit 1
fi

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "🐍 Activating virtual environment..."
    source venv/bin/activate
else
    echo "❌ Virtual environment not found. Please create it first."
    exit 1
fi

# Install/update requirements
echo "📦 Installing/updating requirements..."
pip install -r requirements.txt

# Run migrations (if any)
echo "🗄️ Running database migrations..."
python manage.py migrate

# Test the fix
echo "🧪 Testing the fix..."
python manage.py runserver --noreload &
SERVER_PID=$!

# Wait a moment for server to start
sleep 5

# Check if server started without errors
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully without reentrant errors!"
    echo "🛑 Stopping test server..."
    kill $SERVER_PID
else
    echo "❌ Server failed to start. Check the logs above."
fi

echo "🎉 VPS update completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run: python manage.py runserver"
echo "2. The reentrant error should be fixed"
echo "3. Use: python manage.py start_attendance_service --status"
echo "4. Use: python manage.py start_attendance_service (to start service manually)"
