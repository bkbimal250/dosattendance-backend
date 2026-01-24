#!/bin/bash

# WebSocket Production Setup Script for Employee Attendance System
# This script configures Apache2 and systemd for WebSocket support

set -e  # Exit on any error

echo " Setting up WebSocket support for Employee Attendance System"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_header "1. Installing required Apache2 modules"
# Enable required Apache2 modules
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod rewrite
a2enmod headers
a2enmod ssl

print_status "Apache2 modules enabled successfully"

print_header "2. Installing Daphne (ASGI server)"
# Install Daphne in the virtual environment
PROJECT_DIR="/var/www/EmployeeAttendance"
VENV_DIR="$PROJECT_DIR/venv"

if [ -d "$VENV_DIR" ]; then
    print_status "Installing Daphne in virtual environment..."
    $VENV_DIR/bin/pip install daphne
    print_status "Daphne installed in virtual environment"
else
    print_error "Virtual environment not found at $VENV_DIR"
    print_status "Creating virtual environment..."
    python3 -m venv $VENV_DIR
    $VENV_DIR/bin/pip install daphne
    print_status "Virtual environment created and Daphne installed"
fi

print_header "3. Configuring Apache2 Virtual Host"
# Backup existing configuration
if [ -f "/etc/apache2/sites-available/employee-attendance.conf" ]; then
    print_status "Backing up existing Apache2 configuration..."
    cp /etc/apache2/sites-available/employee-attendance.conf /etc/apache2/sites-available/employee-attendance.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copy new configuration
print_status "Installing new Apache2 configuration with WebSocket support..."
cp apache2_websocket_virtualhost.conf /etc/apache2/sites-available/employee-attendance.conf

# Update domain name in configuration
print_status "Updating domain configuration..."
sed -i 's/your-domain.com/company.d0s369.co.in/g' /etc/apache2/sites-available/employee-attendance.conf

print_header "4. Configuring systemd service for ASGI"
# Copy systemd service file
print_status "Installing systemd service for Django ASGI..."
cp django-asgi.service /etc/systemd/system/

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable django-asgi.service

print_header "5. Setting up Redis for WebSocket channels"
# Install Redis if not installed
if ! command -v redis-server &> /dev/null; then
    print_status "Installing Redis..."
    apt update
    apt install -y redis-server
fi

# Start and enable Redis
systemctl start redis-server
systemctl enable redis-server

print_status "Redis is running and enabled"

print_header "6. Configuring firewall"
# Allow WebSocket ports
ufw allow 8001/tcp comment "Django ASGI WebSocket"
ufw allow 6379/tcp comment "Redis"

print_status "Firewall rules added"

print_header "7. Setting up environment variables"
# Create environment file if it doesn't exist
ENV_FILE="/var/www/EmployeeAttendance/.env"
if [ ! -f "$ENV_FILE" ]; then
    print_status "Creating environment file..."
    cat > "$ENV_FILE" << EOF
# Django Settings
ENVIRONMENT=production
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=company.d0s369.co.in,www.company.d0s369.co.in

# Database
DB_NAME=employee_attendance
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# SSL
SSL_CERT_PATH=/etc/ssl/certs/company.d0s369.co.in.crt
SSL_KEY_PATH=/etc/ssl/private/company.d0s369.co.in.key
SSL_CHAIN_PATH=/etc/ssl/certs/company.d0s369.co.in-chain.crt
EOF
    print_warning "Please update the environment file with your actual values: $ENV_FILE"
fi

print_header "8. Setting permissions"
# Set proper permissions
chown -R www-data:www-data /var/www/EmployeeAttendance
chmod -R 755 /var/www/EmployeeAttendance

print_status "Permissions set correctly"

print_header "9. Testing configuration"
# Test Apache2 configuration
print_status "Testing Apache2 configuration..."
apache2ctl configtest

if [ $? -eq 0 ]; then
    print_status "Apache2 configuration is valid"
else
    print_error "Apache2 configuration has errors. Please fix them before proceeding."
    exit 1
fi

print_header "10. Starting services"
# Start Django ASGI service
print_status "Starting Django ASGI service..."
systemctl start django-asgi.service

# Restart Apache2
print_status "Restarting Apache2..."
systemctl restart apache2

# Check service status
print_status "Checking service status..."
systemctl status django-asgi.service --no-pager -l
systemctl status apache2 --no-pager -l

print_header "11. Final verification"
# Test WebSocket endpoint
print_status "Testing WebSocket connectivity..."
sleep 5  # Wait for services to start

# Check if services are running
if systemctl is-active --quiet django-asgi.service; then
    print_status " Django ASGI service is running"
else
    print_error " Django ASGI service is not running"
fi

if systemctl is-active --quiet apache2; then
    print_status " Apache2 service is running"
else
    print_error " Apache2 service is not running"
fi

if systemctl is-active --quiet redis-server; then
    print_status " Redis service is running"
else
    print_error " Redis service is not running"
fi

echo ""
echo "🎉 WebSocket setup completed!"
echo "=============================="
echo ""
echo "📋 Next Steps:"
echo "1. Update your SSL certificates in the Apache2 configuration"
echo "2. Update environment variables in /var/www/EmployeeAttandance/.env"
echo "3. Test WebSocket connection from your frontend"
echo "4. Monitor logs:"
echo "   - Apache2: tail -f /var/log/apache2/employee_attendance_error.log"
echo "   - Django ASGI: journalctl -u django-asgi.service -f"
echo "   - Redis: tail -f /var/log/redis/redis-server.log"
echo ""
echo "🔧 WebSocket Endpoint: wss://company.d0s369.co.in/ws/attendance/"
echo "🔧 WebSocket Endpoint: wss://company.d0s369.co.in/ws/resignations/"
echo ""
echo "📊 Service Management:"
echo "   - Start ASGI: sudo systemctl start django-asgi.service"
echo "   - Stop ASGI: sudo systemctl stop django-asgi.service"
echo "   - Restart ASGI: sudo systemctl restart django-asgi.service"
echo "   - View ASGI logs: sudo journalctl -u django-asgi.service -f"
echo ""
echo "⚠️  Important: Make sure your SSL certificates are properly configured!"
echo "   Update the certificate paths in /etc/apache2/sites-available/employee-attendance.conf"
