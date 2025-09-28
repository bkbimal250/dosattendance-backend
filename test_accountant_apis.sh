#!/bin/bash

# Accountant Dashboard API Testing Script
# Tests all APIs for accountant functionality with the provided credentials

BASE_URL="http://127.0.0.1:8000"
USERNAME="manishayadav"
PASSWORD="Dos@2026"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✓ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}✗ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠ $message${NC}"
            ;;
    esac
}

# Function to make API request
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local url="${BASE_URL}${endpoint}"
    local headers=()
    
    if [ -n "$token" ]; then
        headers+=("-H" "Authorization: Bearer $token")
    fi
    
    if [ -n "$data" ]; then
        headers+=("-H" "Content-Type: application/json")
        headers+=("-d" "$data")
    fi
    
    curl -s -X "$method" "$url" "${headers[@]}"
}

# Function to test login
test_login() {
    print_status "INFO" "Testing login..."
    
    local login_data='{"username":"'$USERNAME'","password":"'$PASSWORD'"}'
    local response=$(make_request "POST" "/api/auth/login/" "$login_data")
    
    if echo "$response" | grep -q '"access"'; then
        local token=$(echo "$response" | grep -o '"access":"[^"]*"' | cut -d'"' -f4)
        print_status "SUCCESS" "Login successful!"
        print_status "INFO" "Token: ${token:0:50}..."
        echo "$token"
    else
        print_status "ERROR" "Login failed: $response"
        echo ""
    fi
}

# Function to test get profile
test_get_profile() {
    local token=$1
    print_status "INFO" "Testing get profile..."
    
    local response=$(make_request "GET" "/api/auth/profile/" "" "$token")
    
    if echo "$response" | grep -q '"username"'; then
        print_status "SUCCESS" "Profile retrieved successfully"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_status "ERROR" "Get profile failed: $response"
    fi
}

# Function to test get my leaves
test_get_my_leaves() {
    local token=$1
    print_status "INFO" "Testing get my leaves..."
    
    local response=$(make_request "GET" "/api/leaves/my/" "" "$token")
    
    if echo "$response" | grep -q '\[.*\]'; then
        local count=$(echo "$response" | jq 'length' 2>/dev/null || echo "unknown")
        print_status "SUCCESS" "Retrieved $count leave records"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_status "ERROR" "Get leaves failed: $response"
    fi
}

# Function to test create leave
test_create_leave() {
    local token=$1
    print_status "INFO" "Testing create leave request..."
    
    local leave_data='{
        "leave_type": "sick",
        "start_date": "2024-02-01",
        "end_date": "2024-02-02",
        "reason": "Medical appointment - API test",
        "emergency_contact": "Test Contact",
        "emergency_phone": "+1234567890"
    }'
    
    local response=$(make_request "POST" "/api/leaves/" "$leave_data" "$token")
    
    if echo "$response" | grep -q '"id"'; then
        print_status "SUCCESS" "Leave request created successfully"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_status "ERROR" "Create leave failed: $response"
    fi
}

# Function to test get my documents
test_get_my_documents() {
    local token=$1
    print_status "INFO" "Testing get my documents..."
    
    local response=$(make_request "GET" "/api/documents/my/" "" "$token")
    
    if echo "$response" | grep -q '\[.*\]'; then
        local count=$(echo "$response" | jq 'length' 2>/dev/null || echo "unknown")
        print_status "SUCCESS" "Retrieved $count document records"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_status "ERROR" "Get documents failed: $response"
    fi
}

# Function to test get my generated documents
test_get_my_generated_documents() {
    local token=$1
    print_status "INFO" "Testing get my generated documents..."
    
    local response=$(make_request "GET" "/api/generated-documents/my_documents/" "" "$token")
    
    if echo "$response" | grep -q '\[.*\]'; then
        local count=$(echo "$response" | jq 'length' 2>/dev/null || echo "unknown")
        print_status "SUCCESS" "Retrieved $count generated document records"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_status "ERROR" "Get generated documents failed: $response"
    fi
}

# Function to test get my resignations
test_get_my_resignations() {
    local token=$1
    print_status "INFO" "Testing get my resignations..."
    
    local response=$(make_request "GET" "/api/resignations/my_resignations/" "" "$token")
    
    if echo "$response" | grep -q '\[.*\]'; then
        local count=$(echo "$response" | jq 'length' 2>/dev/null || echo "unknown")
        print_status "SUCCESS" "Retrieved $count resignation records"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_status "ERROR" "Get resignations failed: $response"
    fi
}

# Function to test create resignation
test_create_resignation() {
    local token=$1
    print_status "INFO" "Testing create resignation request..."
    
    local resignation_data='{
        "resignation_date": "2024-03-15",
        "notice_period_days": 30,
        "reason": "Career growth opportunity - API test",
        "handover_notes": "All current projects documented. Training materials prepared.",
        "feedback": "Great company to work for. Learned a lot during my time here."
    }'
    
    local response=$(make_request "POST" "/api/resignations/" "$resignation_data" "$token")
    
    if echo "$response" | grep -q '"id"'; then
        print_status "SUCCESS" "Resignation request created successfully"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_status "ERROR" "Create resignation failed: $response"
    fi
}

# Function to test get my attendance
test_get_my_attendance() {
    local token=$1
    print_status "INFO" "Testing get my attendance..."
    
    local response=$(make_request "GET" "/api/attendance/my/" "" "$token")
    
    if echo "$response" | grep -q '\[.*\]'; then
        local count=$(echo "$response" | jq 'length' 2>/dev/null || echo "unknown")
        print_status "SUCCESS" "Retrieved $count attendance records"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_status "ERROR" "Get attendance failed: $response"
    fi
}

# Function to test get attendance summary
test_get_attendance_summary() {
    local token=$1
    print_status "INFO" "Testing get attendance summary..."
    
    local response=$(make_request "GET" "/api/attendance/summary/" "" "$token")
    
    if echo "$response" | grep -q '".*"'; then
        print_status "SUCCESS" "Attendance summary retrieved successfully"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        print_status "ERROR" "Get attendance summary failed: $response"
    fi
}

# Main function
main() {
    echo "Accountant Dashboard API Testing Tool"
    echo "======================================"
    echo "Credentials: $USERNAME / $PASSWORD"
    echo "Base URL: $BASE_URL"
    echo "======================================"
    echo
    
    # Test login first
    local token=$(test_login)
    
    if [ -z "$token" ]; then
        print_status "ERROR" "Cannot proceed without authentication token"
        exit 1
    fi
    
    echo
    print_status "INFO" "Running all API tests..."
    echo "======================================"
    
    # Run all tests
    test_get_profile "$token"
    echo
    
    test_get_my_leaves "$token"
    echo
    
    test_create_leave "$token"
    echo
    
    test_get_my_documents "$token"
    echo
    
    test_get_my_generated_documents "$token"
    echo
    
    test_get_my_resignations "$token"
    echo
    
    test_create_resignation "$token"
    echo
    
    test_get_my_attendance "$token"
    echo
    
    test_get_attendance_summary "$token"
    echo
    
    print_status "INFO" "All tests completed!"
}

# Check if required tools are available
if ! command -v curl &> /dev/null; then
    print_status "ERROR" "curl is required but not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_status "WARNING" "jq is not installed - JSON output will not be formatted"
fi

# Run main function
main
