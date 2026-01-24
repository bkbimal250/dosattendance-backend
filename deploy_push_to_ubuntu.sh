#!/bin/bash

# Deployment script for Push Data Reception on Ubuntu Apache2 Server
# This script sets up the Django application to receive pushed attendance data

echo "============================================================"
echo "DEPLOYING PUSH DATA RECEPTION TO UBUNTU APACHE2 SERVER"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/EmployeeAttendance"
APACHE_SITES_DIR="/etc/apache2/sites-available"
APACHE_SITES_ENABLED="/etc/apache2/sites-enabled"
DOMAIN="company.d0s369.co.in"

echo -e "${YELLOW}Step 1: Updating Django application files...${NC}"

# Copy new files to the server
echo "Copying push_views.py..."
# cp core/push_views.py $PROJECT_DIR/core/

echo "Updating urls.py..."
# cp core/urls.py $PROJECT_DIR/core/

echo -e "${GREEN} Django files updated${NC}"

echo -e "${YELLOW}Step 2: Installing Apache2 configuration...${NC}"

# Copy Apache2 configuration
sudo cp apache2_push_virtualhost.conf $APACHE_SITES_DIR/employee-attendance-push.conf

# Enable the new site
sudo a2ensite employee-attendance-push.conf

# Enable required Apache2 modules
echo "Enabling required Apache2 modules..."
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod wsgi

echo -e "${GREEN} Apache2 configuration installed${NC}"

echo -e "${YELLOW}Step 3: Configuring firewall for port 8081...${NC}"

# Configure UFW firewall
sudo ufw allow 8081/tcp
echo "Port 8081 opened in firewall"

echo -e "${GREEN} Firewall configured${NC}"

echo -e "${YELLOW}Step 4: Updating Django settings for production...${NC}"

# Create production settings if needed
cat > $PROJECT_DIR/production_push_settings.py << EOF
# Production settings for push data reception
import os
from .settings import *

# Override settings for push data reception
DEBUG = False
ALLOWED_HOSTS = ['company.d0s369.co.in', 'www.company.d0s369.co.in', '82.25.109.137', 'localhost', '127.0.0.1']

# Database configuration (keep your existing database settings)
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.mysql',
#         'NAME': 'your_database_name',
#         'USER': 'your_database_user',
#         'PASSWORD': 'your_database_password',
#         'HOST': 'localhost',
#         'PORT': '3306',
#     }
# }

# Logging configuration for push data
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'push_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/push_data.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'core.push_views': {
            'handlers': ['push_file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# CORS settings for device communication
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://82.25.109.137:8081",
    "https://company.d0s369.co.in:8081",
]

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
EOF

echo -e "${GREEN} Production settings created${NC}"

echo -e "${YELLOW}Step 5: Creating log directory...${NC}"

# Create log directory
sudo mkdir -p /var/log/django
sudo chown www-data:www-data /var/log/django
sudo chmod 755 /var/log/django

echo -e "${GREEN} Log directory created${NC}"

echo -e "${YELLOW}Step 6: Installing Python dependencies...${NC}"

# Activate virtual environment and install dependencies
cd $PROJECT_DIR
source venv/bin/activate

# Install any new dependencies
pip install django-cors-headers

echo -e "${GREEN} Dependencies installed${NC}"

echo -e "${YELLOW}Step 7: Running Django migrations...${NC}"

# Run migrations
python manage.py migrate

echo -e "${GREEN} Migrations completed${NC}"

echo -e "${YELLOW}Step 8: Collecting static files...${NC}"

# Collect static files
python manage.py collectstatic --noinput

echo -e "${GREEN} Static files collected${NC}"

echo -e "${YELLOW}Step 9: Testing Apache2 configuration...${NC}"

# Test Apache2 configuration
sudo apache2ctl configtest

if [ $? -eq 0 ]; then
    echo -e "${GREEN} Apache2 configuration is valid${NC}"
else
    echo -e "${RED} Apache2 configuration has errors${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 10: Restarting services...${NC}"

# Restart Apache2
sudo systemctl restart apache2

# Enable Apache2 to start on boot
sudo systemctl enable apache2

echo -e "${GREEN} Apache2 restarted${NC}"

echo "============================================================"
echo "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "============================================================"

echo -e "${GREEN}Push Data Reception is now configured on your Ubuntu server!${NC}"
echo ""
echo "Server Configuration:"
echo "  - Domain: $DOMAIN"
echo "  - Port: 8081"
echo "  - Push Endpoint: https://$DOMAIN:8081/api/device/push-attendance/"
echo "  - Health Check: https://$DOMAIN:8081/api/device/health-check/"
echo ""
echo "Device Configuration (already done):"
echo "  - Server Mode: ADMS"
echo "  - Server Address: 82.25.109.137"
echo "  - Server Port: 8081"
echo "  - Enable Domain Name: NO"
echo "  - Enable Proxy Server: NO"
echo ""
echo "Logs:"
echo "  - Push Data: /var/log/apache2/device_push_access.log"
echo "  - Errors: /var/log/apache2/device_push_error.log"
echo "  - Django: /var/log/django/push_data.log"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test the health check endpoint: curl https://$DOMAIN:8081/api/device/health-check/"
echo "2. Configure your biometric devices to push to: https://$DOMAIN:8081/api/device/push-attendance/"
echo "3. Monitor the logs for incoming data"
echo ""
echo -e "${GREEN}Your attendance system is ready to receive pushed data! 🎉${NC}"
