#!/bin/bash

# Manual testing commands for push attendance functionality
# Run these commands to test your push attendance system

echo "============================================================"
echo "MANUAL TESTING COMMANDS FOR PUSH ATTENDANCE"
echo "============================================================"

# Configuration
BASE_URL="http://localhost:8081"  # Change to your server URL
PRODUCTION_URL="https://company.d0s369.co.in:8081"

echo "Choose testing environment:"
echo "1. Local development server (localhost:8081)"
echo "2. Production server (company.d0s369.co.in:8081)"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "2" ]; then
    BASE_URL="$PRODUCTION_URL"
fi

echo "Testing against: $BASE_URL"
echo ""

# Test 1: Health Check
echo "============================================================"
echo "TEST 1: Health Check Endpoint"
echo "============================================================"
echo "Command: curl -X GET $BASE_URL/api/device/health-check/"
echo ""
curl -X GET "$BASE_URL/api/device/health-check/" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# Test 2: Basic Push Test
echo "============================================================"
echo "TEST 2: Basic Push Endpoint Test"
echo "============================================================"
echo "Command: curl -X POST $BASE_URL/api/device/push-attendance/"
echo ""
curl -X POST "$BASE_URL/api/device/push-attendance/" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "MANUAL_TEST_001",
    "device_name": "Manual Test Device",
    "attendance_records": []
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# Test 3: Push with Real User Data
echo "============================================================"
echo "TEST 3: Push with Real User Data"
echo "============================================================"
echo "Command: curl -X POST $BASE_URL/api/device/push-attendance/ with user data"
echo ""
curl -X POST "$BASE_URL/api/device/push-attendance/" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "MANUAL_TEST_002",
    "device_name": "Real Data Test Device",
    "attendance_records": [
      {
        "user_id": "5",
        "biometric_id": "5",
        "timestamp": "'$(date '+%Y-%m-%d %H:%M:%S')'",
        "type": "check_in"
      }
    ]
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# Test 4: Check-in and Check-out Flow
echo "============================================================"
echo "TEST 4: Complete Check-in/Check-out Flow"
echo "============================================================"
echo "Sending check-in..."
curl -X POST "$BASE_URL/api/device/push-attendance/" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "FLOW_TEST_DEVICE",
    "device_name": "Flow Test Device",
    "attendance_records": [
      {
        "user_id": "201",
        "biometric_id": "201",
        "timestamp": "'$(date '+%Y-%m-%d %H:%M:%S')'",
        "type": "check_in"
      }
    ]
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

echo "Waiting 3 seconds..."
sleep 3

echo "Sending check-out..."
curl -X POST "$BASE_URL/api/device/push-attendance/" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "FLOW_TEST_DEVICE",
    "device_name": "Flow Test Device",
    "attendance_records": [
      {
        "user_id": "201",
        "biometric_id": "201",
        "timestamp": "'$(date '+%Y-%m-%d %H:%M:%S')'",
        "type": "check_out"
      }
    ]
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# Test 5: Error Handling
echo "============================================================"
echo "TEST 5: Error Handling Test"
echo "============================================================"
echo "Command: curl -X POST $BASE_URL/api/device/push-attendance/ with invalid data"
echo ""
curl -X POST "$BASE_URL/api/device/push-attendance/" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ERROR_TEST_DEVICE",
    "device_name": "Error Test Device",
    "attendance_records": [
      {
        "user_id": "INVALID_USER_999",
        "biometric_id": "INVALID_BIOMETRIC_999",
        "timestamp": "'$(date '+%Y-%m-%d %H:%M:%S')'",
        "type": "check_in"
      }
    ]
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# Test 6: Alternative Endpoint
echo "============================================================"
echo "TEST 6: Alternative Push Endpoint"
echo "============================================================"
echo "Command: curl -X POST $BASE_URL/api/device/receive-attendance/"
echo ""
curl -X POST "$BASE_URL/api/device/receive-attendance/" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ALT_TEST_DEVICE",
    "device_name": "Alternative Endpoint Test",
    "attendance_records": [
      {
        "user_id": "5",
        "biometric_id": "5",
        "timestamp": "'$(date '+%Y-%m-%d %H:%M:%S')'",
        "type": "check_in"
      }
    ]
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

echo "============================================================"
echo "TESTING COMPLETED"
echo "============================================================"
echo ""
echo "Next steps:"
echo "1. Check the Django logs for any errors"
echo "2. Verify attendance records in the database"
echo "3. Check Apache2 logs for request details"
echo ""
echo "To check database records, run:"
echo "python manage.py shell -c \"from core.models import Attendance; print('Recent attendance:', Attendance.objects.order_by('-created_at')[:5])\""
echo ""
echo "To check device creation, run:"
echo "python manage.py shell -c \"from core.models import Device; print('Recent devices:', Device.objects.order_by('-created_at')[:5])\""
