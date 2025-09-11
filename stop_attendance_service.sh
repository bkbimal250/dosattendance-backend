#!/bin/bash

# Django Attendance Service Stop Script
# This script stops the automatic attendance fetching service

# Configuration
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

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    log_warn "PID file not found: $PID_FILE"
    log_warn "Service may not be running"
    exit 0
fi

# Read PID from file
PID=$(cat "$PID_FILE")

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
    log_warn "Process with PID $PID is not running"
    log_warn "Removing stale PID file"
    rm -f "$PID_FILE"
    exit 0
fi

# Stop the service
log_info "Stopping Django Attendance Service (PID: $PID)..."

# Send SIGTERM signal
kill -TERM "$PID"

# Wait for graceful shutdown
for i in {1..10}; do
    if ! ps -p "$PID" > /dev/null 2>&1; then
        log_info "Service stopped gracefully"
        rm -f "$PID_FILE"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
log_warn "Service did not stop gracefully, forcing shutdown..."
kill -KILL "$PID"

# Wait a moment and check
sleep 1
if ! ps -p "$PID" > /dev/null 2>&1; then
    log_info "Service force-stopped"
    rm -f "$PID_FILE"
else
    log_error "Failed to stop service"
    exit 1
fi
