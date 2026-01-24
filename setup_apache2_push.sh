#!/bin/bash

# Apache2 Push Server Setup Script
# This script sets up Apache2 to handle ZKTeco device push data on port 8081

echo "🔧 Setting up Apache2 Push Server for ZKTeco devices..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo " Please run as root (use sudo)"
    exit 1
fi

# Navigate to project directory
cd /var/www/EmployeeAttendance

# Copy configuration files
echo "📁 Copying Apache2 configuration files..."
cp apache2_push_virtualhost.conf /etc/apache2/sites-available/attendance-push.conf
cp apache2_virtualhost.conf /etc/apache2/sites-available/attendance-system.conf

# Enable required modules
echo "🔌 Enabling Apache2 modules..."
a2enmod wsgi
a2enmod proxy
a2enmod proxy_http
a2enmod rewrite
a2enmod headers
a2enmod ssl

# Enable sites
echo "🌐 Enabling Apache2 sites..."
a2ensite attendance-push.conf
a2ensite attendance-system.conf
a2dissite 000-default.conf

# Test configuration
echo "🧪 Testing Apache2 configuration..."
if apache2ctl configtest; then
    echo " Apache2 configuration is valid"
else
    echo " Apache2 configuration has errors"
    exit 1
fi

# Restart Apache2
echo "🔄 Restarting Apache2..."
systemctl restart apache2

# Check status
echo "📊 Checking Apache2 status..."
systemctl status apache2 --no-pager

# Check if ports are listening
echo "Checking if ports are listening..."
echo "Port 80 (HTTP):"
netstat -tlnp | grep :80 || echo " Port 80 not listening"

echo "Port 8081 (Push):"
netstat -tlnp | grep :8081 || echo " Port 8081 not listening"

# Test endpoints
echo "🧪 Testing endpoints..."
echo "Testing main website (port 80):"
curl -s -o /dev/null -w "%{http_code}" http://localhost/ && echo " " || echo " "

echo "Testing push endpoint (port 8081):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/device/push-attendance/ && echo " " || echo " "

echo ""
echo "🎉 Apache2 Push Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. ZKTeco devices should push to: http://82.25.109.137:8081/api/device/push-attendance/"
echo "2. Web interface available at: http://82.25.109.137/"
echo "3. Check logs: sudo tail -f /var/log/apache2/device_push_access.log"
echo "4. Check errors: sudo tail -f /var/log/apache2/device_push_error.log"
