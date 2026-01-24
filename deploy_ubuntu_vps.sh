#!/bin/bash

# Employee Attendance System - Ubuntu VPS Deployment Script
# This script sets up the Django application on Ubuntu VPS with Apache2

set -e  # Exit on any error

echo " Starting Employee Attendance System Deployment on Ubuntu VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="EmployeeAttandance"
PROJECT_DIR="/var/www/$PROJECT_NAME"
DOMAIN_NAME="your-domain.com"
DB_NAME="u434975676_DOS"
DB_USER="u434975676_bimal"
DB_PASSWORD="DishaSolution@8989"
DB_HOST="193.203.184.215"
DB_PORT="3306"

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    apache2 \
    libapache2-mod-wsgi-py3 \
    mysql-client \
    redis-server \
    git \
    curl \
    wget \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Python packages
print_status "Installing Python packages..."
pip3 install --upgrade pip
pip3 install \
    django \
    djangorestframework \
    djangorestframework-simplejwt \
    django-cors-headers \
    channels \
    channels-redis \
    mysqlclient \
    redis \
    celery \
    python-dotenv \
    gunicorn

# Create project directory
print_status "Creating project directory..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Copy project files (assuming they're in current directory)
print_status "Copying project files..."
cp -r /path/to/your/project/* $PROJECT_DIR/

# Create virtual environment
print_status "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install project dependencies
print_status "Installing project dependencies..."
pip install -r requirements.txt

# Set up environment variables
print_status "Setting up environment variables..."
cat > .env << EOF
ENVIRONMENT=production
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=$DOMAIN_NAME,www.$DOMAIN_NAME
DB_ENGINE=django.db.backends.mysql
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
CORS_ALLOWED_ORIGINS=https://$DOMAIN_NAME,https://www.$DOMAIN_NAME
LOG_LEVEL=INFO
LOG_FILE=$PROJECT_DIR/logs/django.log
STATIC_ROOT=$PROJECT_DIR/staticfiles
MEDIA_ROOT=$PROJECT_DIR/media
EOF

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs media staticfiles

# Set proper permissions
print_status "Setting proper permissions..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 775 logs media

# Run Django migrations
print_status "Running Django migrations..."
source venv/bin/activate
python manage.py migrate

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser (optional)
print_warning "You may want to create a superuser account:"
print_warning "Run: python manage.py createsuperuser"

# Configure Apache2
print_status "Configuring Apache2..."

# Enable required modules
a2enmod ssl
a2enmod rewrite
a2enmod headers
a2enmod wsgi

# Copy virtual host configuration
cp apache2_virtualhost.conf /etc/apache2/sites-available/$PROJECT_NAME.conf

# Update virtual host with correct domain
sed -i "s/your-domain.com/$DOMAIN_NAME/g" /etc/apache2/sites-available/$PROJECT_NAME.conf

# Enable the site
a2ensite $PROJECT_NAME.conf
a2dissite 000-default.conf

# Configure systemd service for attendance fetcher
print_status "Configuring systemd service..."
cp attendance_fetcher.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable attendance_fetcher.service

# Start services
print_status "Starting services..."
systemctl start redis-server
systemctl enable redis-server
systemctl start attendance_fetcher.service
systemctl restart apache2

# Configure firewall
print_status "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Set up SSL certificate (Let's Encrypt)
print_status "Setting up SSL certificate..."
apt install -y certbot python3-certbot-apache
certbot --apache -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME

# Create log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/employee-attendance << EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload apache2
    endscript
}
EOF

# Create backup script
print_status "Creating backup script..."
cat > $PROJECT_DIR/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/employee-attendance"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup media files
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz media/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x $PROJECT_DIR/backup.sh

# Set up cron job for backups
print_status "Setting up backup cron job..."
echo "0 2 * * * $PROJECT_DIR/backup.sh" | crontab -u www-data -

# Final status check
print_status "Checking service status..."
systemctl status apache2 --no-pager
systemctl status attendance_fetcher.service --no-pager
systemctl status redis-server --no-pager

print_status "🎉 Deployment completed successfully!"
print_status "Your application should be available at: https://$DOMAIN_NAME"
print_status "Admin panel: https://$DOMAIN_NAME/admin/"
print_status "API endpoints: https://$DOMAIN_NAME/api/"

print_warning "Don't forget to:"
print_warning "1. Update your domain DNS to point to this server"
print_warning "2. Create a superuser account: python manage.py createsuperuser"
print_warning "3. Configure your frontend to use the production API URL"
print_warning "4. Test the attendance fetching service"

echo "Deployment script completed!"
