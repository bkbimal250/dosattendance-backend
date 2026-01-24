#!/bin/bash

# Server-side testing script for push attendance functionality
# Run this script directly on your Ubuntu server

echo "============================================================"
echo "PUSH ATTENDANCE SERVER TESTING SCRIPT"
echo "============================================================"
echo ""

# Configuration
PROJECT_PATH="/var/www/EmployeeAttendance"
LOG_FILE="/var/log/push_attendance_test.log"

echo "Project Path: $PROJECT_PATH"
echo "Log File: $LOG_FILE"
echo ""

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "1. CHECKING PREREQUISITES..."
echo "----------------------------------------"

if [ -d "$PROJECT_PATH" ]; then
    log_message " Project directory exists: $PROJECT_PATH"
else
    log_message " Project directory not found: $PROJECT_PATH"
    exit 1
fi

if command_exists python3; then
    log_message " Python3 is installed"
else
    log_message " Python3 not found"
    exit 1
fi

if command_exists curl; then
    log_message " curl is installed"
else
    log_message " curl not found"
    exit 1
fi

if systemctl is-active --quiet apache2; then
    log_message " Apache2 is running"
else
    log_message " Apache2 is not running"
    echo "Starting Apache2..."
    systemctl start apache2
fi

echo ""

# Check if testing files exist
echo "2. CHECKING TESTING FILES..."
echo "----------------------------------------"

cd "$PROJECT_PATH" || exit 1

if [ -f "test_push_functionality.py" ]; then
    log_message " test_push_functionality.py exists"
else
    log_message " test_push_functionality.py not found"
    echo "Please upload the testing files first"
    exit 1
fi

if [ -f "verify_database_records.py" ]; then
    log_message " verify_database_records.py exists"
else
    log_message " verify_database_records.py not found"
    echo "Please upload the testing files first"
    exit 1
fi

if [ -f "manual_test_commands.sh" ]; then
    log_message " manual_test_commands.sh exists"
else
    log_message " manual_test_commands.sh not found"
    echo "Please upload the testing files first"
    exit 1
fi

echo ""

# Check Django configuration
echo "3. CHECKING DJANGO CONFIGURATION..."
echo "----------------------------------------"

if [ -f "manage.py" ]; then
    log_message " manage.py exists"
else
    log_message " manage.py not found"
    exit 1
fi

if [ -f "core/push_views.py" ]; then
    log_message " core/push_views.py exists"
else
    log_message " core/push_views.py not found"
    echo "Please upload the push_views.py file"
    exit 1
fi

# Test Django configuration
echo "Testing Django configuration..."
if python3 manage.py check >/dev/null 2>&1; then
    log_message " Django configuration is valid"
else
    log_message " Django configuration has errors"
    echo "Django check output:"
    python3 manage.py check
    exit 1
fi

echo ""

# Check database connection
echo "4. CHECKING DATABASE CONNECTION..."
echo "----------------------------------------"

if python3 manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('Database connection successful')" >/dev/null 2>&1; then
    log_message " Database connection successful"
else
    log_message " Database connection failed"
    exit 1
fi

echo ""

# Check if server is accessible
echo "5. CHECKING SERVER ACCESSIBILITY..."
echo "----------------------------------------"

# Test health check endpoint
if curl -s -f "http://localhost:8081/api/device/health-check/" >/dev/null; then
    log_message " Health check endpoint is accessible"
else
    log_message " Health check endpoint is not accessible"
    echo "Checking if server is running on port 8081..."
    netstat -tlnp | grep 8081 || echo "Port 8081 not listening"
fi

echo ""

# Run database verification
echo "6. RUNNING DATABASE VERIFICATION..."
echo "----------------------------------------"

if [ -f "verify_database_records.py" ]; then
    echo "Running database verification..."
    python3 verify_database_records.py
    if [ $? -eq 0 ]; then
        log_message " Database verification completed"
    else
        log_message " Database verification failed"
    fi
else
    log_message " Database verification script not found"
fi

echo ""

# Run automated tests
echo "7. RUNNING AUTOMATED TESTS..."
echo "----------------------------------------"

if [ -f "test_push_functionality.py" ]; then
    echo "Running automated push functionality tests..."
    python3 test_push_functionality.py --production
    if [ $? -eq 0 ]; then
        log_message " Automated tests passed"
    else
        log_message " Automated tests failed"
    fi
else
    log_message " Automated test script not found"
fi

echo ""

# Check Apache2 configuration
echo "8. CHECKING APACHE2 CONFIGURATION..."
echo "----------------------------------------"

if apache2ctl configtest >/dev/null 2>&1; then
    log_message " Apache2 configuration is valid"
else
    log_message " Apache2 configuration has errors"
    echo "Apache2 configuration test output:"
    apache2ctl configtest
fi

# Check if push data virtual host is configured
if [ -f "/etc/apache2/sites-available/device_push.conf" ]; then
    log_message " Push data virtual host configuration exists"
else
    log_message "⚠️  Push data virtual host configuration not found"
    echo "You may need to configure Apache2 for port 8081"
fi

echo ""

# Check logs
echo "9. CHECKING LOGS..."
echo "----------------------------------------"

if [ -f "/var/log/apache2/device_push_access.log" ]; then
    log_message " Push data access log exists"
    echo "Recent access log entries:"
    tail -5 /var/log/apache2/device_push_access.log
else
    log_message "⚠️  Push data access log not found"
fi

if [ -f "/var/log/apache2/device_push_error.log" ]; then
    log_message " Push data error log exists"
    echo "Recent error log entries:"
    tail -5 /var/log/apache2/device_push_error.log
else
    log_message "⚠️  Push data error log not found"
fi

echo ""

# Final summary
echo "============================================================"
echo "TESTING SUMMARY"
echo "============================================================"

echo "Log file: $LOG_FILE"
echo ""

echo "To view detailed logs:"
echo "tail -f $LOG_FILE"
echo ""

echo "To run manual tests:"
echo "cd $PROJECT_PATH && ./manual_test_commands.sh"
echo ""

echo "To test with real device:"
echo "1. Configure device with server address: 82.25.109.137:8081"
echo "2. Monitor logs: tail -f /var/log/apache2/device_push_access.log"
echo "3. Check database: python3 verify_database_records.py"
echo ""

echo "Testing completed! Check the log file for detailed results."
echo "============================================================"
