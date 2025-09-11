#!/bin/bash

# Django Attendance Service Startup Script
# This script starts the automatic attendance fetching service

# Configuration
PROJECT_DIR="/path/to/your/django/project"
VENV_DIR="/path/to/your/venv"
SERVICE_NAME="attendance_service"
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="/tmp/attendance_service.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please do not run this script as root"
    exit 1
fi

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    log_error "Virtual environment not found: $VENV_DIR"
    exit 1
fi

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Check if service is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        log_warn "Service is already running (PID: $PID)"
        echo "Use 'stop_attendance_service.sh' to stop it first"
        exit 1
    else
        log_warn "Stale PID file found, removing..."
        rm -f "$PID_FILE"
    fi
fi

# Start the service
log_info "Starting Django Attendance Service..."

# Set environment variables
export DJANGO_SETTINGS_MODULE=attendance_system.settings
export ENVIRONMENT=production
export AUTO_START_ATTENDANCE_SERVICE=true

# Start the service in background
nohup python manage.py start_attendance_service --daemon > "$LOG_DIR/attendance_service.out" 2> "$LOG_DIR/attendance_service.err" &

# Get the PID
SERVICE_PID=$!

# Save PID to file
echo "$SERVICE_PID" > "$PID_FILE"

# Wait a moment and check if service started successfully
sleep 2

if ps -p "$SERVICE_PID" > /dev/null 2>&1; then
    log_info "Service started successfully (PID: $SERVICE_PID)"
    log_info "Logs: $LOG_DIR/attendance_service.out"
    log_info "Errors: $LOG_DIR/attendance_service.err"
    log_info "PID file: $PID_FILE"
else
    log_error "Failed to start service"
    rm -f "$PID_FILE"
    exit 1
fi

log_info "Attendance service is now running in the background"
log_info "Use 'stop_attendance_service.sh' to stop the service"
