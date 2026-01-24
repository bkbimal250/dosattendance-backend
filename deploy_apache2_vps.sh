#!/bin/bash

# Employee Attendance System - Apache2 VPS Deployment Script
# Run this script on your Ubuntu VPS as root or with sudo

set -e  # Exit on any error

echo " Starting Employee Attendance System Deployment on Apache2 VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo"
    exit 1
fi

# Get domain name from user
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    print_error "Domain name is required"
    exit 1
fi

print_status "Deploying for domain: $DOMAIN_NAME"

# Step 1: Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Step 2: Install required packages
print_status "Installing required packages..."
apt install -y python3 python3-pip python3-venv python3-dev
apt install -y apache2 libapache2-mod-wsgi-py3
apt install -y mysql-client redis-server
apt install -y git curl wget unzip

# WeasyPrint dependencies
print_status "Installing WeasyPrint dependencies..."
apt install -y python3-cffi python3-brotli libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0
apt install -y libffi-dev libjpeg-dev libpng-dev libgif-dev librsvg2-dev
apt install -y build-essential libssl-dev libffi-dev

# Step 3: Configure firewall
print_status "Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# Step 4: Setup Redis
print_status "Configuring Redis..."
systemctl enable redis-server
systemctl start redis-server

# Step 5: Create project directory
print_status "Setting up project directory..."
mkdir -p /var/www/EmployeeAttandance
chown -R www-data:www-data /var/www/EmployeeAttandance

# Step 6: Create Python virtual environment
print_status "Creating Python virtual environment..."
cd /var/www/EmployeeAttandance
python3 -m venv venv
chown -R www-data:www-data venv

# Step 7: Install Python dependencies
print_status "Installing Python dependencies..."
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/pip install --upgrade pip
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/pip install -r requirements.txt

# Step 8: Test WeasyPrint installation
print_status "Testing WeasyPrint installation..."
if sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python -c "import weasyprint; print('WeasyPrint version:', weasyprint.__version__)" 2>/dev/null; then
    print_success "WeasyPrint installed successfully!"
else
    print_warning "WeasyPrint installation failed. PDF generation may not work."
fi

# Step 9: Create environment file
print_status "Creating environment configuration..."
cat > /var/www/EmployeeAttandance/.env << EOF
# Django Settings
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=$DOMAIN_NAME,www.$DOMAIN_NAME,localhost

# Database Configuration
DB_ENGINE=django.db.backends.mysql
DB_NAME=u434975676_DOS
DB_USER=u434975676_bimal
DB_PASSWORD=DishaSolution@8989
DB_HOST=193.203.184.215
DB_PORT=3306

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=creatorbimal@gmail.com
EMAIL_HOST_PASSWORD=zdduqixnlkencxsy

# Security Settings
CORS_ALLOWED_ORIGINS=https://$DOMAIN_NAME,https://www.$DOMAIN_NAME

# Static and Media Files
STATIC_ROOT=/var/www/EmployeeAttandance/staticfiles
MEDIA_ROOT=/var/www/EmployeeAttandance/media

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/attendance/django.log
EOF

chown www-data:www-data /var/www/EmployeeAttandance/.env
chmod 600 /var/www/EmployeeAttandance/.env

# Step 10: Run Django setup
print_status "Running Django migrations..."
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py migrate

print_status "Collecting static files..."
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py collectstatic --noinput

# Step 11: Create Apache virtual host
print_status "Creating Apache virtual host configuration..."
cat > /etc/apache2/sites-available/employee-attendance.conf << EOF
<VirtualHost *:80>
    ServerName $DOMAIN_NAME
    ServerAlias www.$DOMAIN_NAME
    DocumentRoot /var/www/EmployeeAttandance

    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN_NAME
    ServerAlias www.$DOMAIN_NAME
    DocumentRoot /var/www/EmployeeAttandance

    # SSL Configuration (will be updated by Let's Encrypt)
    SSLEngine on
    # SSLCertificateFile /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem
    # SSLCertificateKeyFile /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem

    # Security Headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Django Application
    WSGIDaemonProcess EmployeeAttandance python-home=/var/www/EmployeeAttandance/venv python-path=/var/www/EmployeeAttandance
    WSGIProcessGroup EmployeeAttandance
    WSGIScriptAlias / /var/www/EmployeeAttandance/attendance_system/wsgi.py

    # Static Files
    Alias /static/ /var/www/EmployeeAttandance/staticfiles/
    <Directory /var/www/EmployeeAttandance/staticfiles>
        Require all granted
    </Directory>

    # Media Files
    Alias /media/ /var/www/EmployeeAttandance/media/
    <Directory /var/www/EmployeeAttandance/media>
        Require all granted
    </Directory>

    # Django Application Directory
    <Directory /var/www/EmployeeAttandance/attendance_system>
        <Files wsgi.py>
            Require all granted
        </Files>
    </Directory>

    # Logging
    ErrorLog \${APACHE_LOG_DIR}/employee_attendance_error.log
    CustomLog \${APACHE_LOG_DIR}/employee_attendance_access.log combined

    # Security
    ServerTokens Prod
    ServerSignature Off
</VirtualHost>
EOF

# Step 12: Enable Apache modules and site
print_status "Configuring Apache..."
a2enmod ssl
a2enmod rewrite
a2enmod headers
a2enmod wsgi

a2ensite employee-attendance.conf
a2dissite 000-default.conf

# Test Apache configuration
if apache2ctl configtest; then
    print_success "Apache configuration is valid"
else
    print_error "Apache configuration has errors"
    exit 1
fi

# Step 13: Create attendance service
print_status "Creating attendance service..."
cat > /etc/systemd/system/attendance-service.service << EOF
[Unit]
Description=Employee Attendance Auto-Fetch Service
After=network.target mysql.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/EmployeeAttandance
Environment=PATH=/var/www/EmployeeAttandance/venv/bin
ExecStart=/var/www/EmployeeAttandance/venv/bin/python manage.py start_attendance_service
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Step 14: Create log directory
print_status "Setting up logging..."
mkdir -p /var/log/attendance
chown www-data:www-data /var/log/attendance

# Step 15: Enable and start services
print_status "Starting services..."
systemctl daemon-reload
systemctl enable attendance-service
systemctl restart apache2
systemctl enable apache2

# Step 16: Install Certbot for SSL
print_status "Installing Certbot for SSL certificates..."
apt install -y certbot python3-certbot-apache

# Step 17: Final checks
print_status "Running final checks..."

# Check Django
if sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py check --deploy > /dev/null 2>&1; then
    print_success "Django deployment check passed"
else
    print_warning "Django deployment check failed - check manually"
fi

# Check services
if systemctl is-active --quiet apache2; then
    print_success "Apache2 is running"
else
    print_error "Apache2 is not running"
fi

if systemctl is-active --quiet redis-server; then
    print_success "Redis is running"
else
    print_error "Redis is not running"
fi

# Step 18: Create superuser
print_status "Creating Django superuser..."
print_warning "You need to create a superuser manually:"
echo "sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py createsuperuser"

# Step 19: SSL Certificate
print_status "Setting up SSL certificate..."
print_warning "To complete SSL setup, run:"
echo "certbot --apache -d $DOMAIN_NAME -d www.$DOMAIN_NAME"

# Final summary
print_success "Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Upload your project files to /var/www/EmployeeAttandance/"
echo "2. Create Django superuser: sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py createsuperuser"
echo "3. Setup SSL certificate: certbot --apache -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
echo "4. Start attendance service: systemctl start attendance-service"
echo "5. Access your application at: http://$DOMAIN_NAME"
echo ""
echo "📁 Important paths:"
echo "- Project directory: /var/www/EmployeeAttandance/"
echo "- Logs: /var/log/apache2/employee_attendance_error.log"
echo "- Django logs: /var/log/attendance/django.log"
echo "- Environment file: /var/www/EmployeeAttandance/.env"
echo ""
print_success "🎉 Employee Attendance System is ready for deployment!"
