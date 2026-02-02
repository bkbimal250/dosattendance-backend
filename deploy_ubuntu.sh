#!/bin/bash

# Employee Attendance System - Ubuntu VPS Deployment Script
# Run this script as root or with sudo privileges

set -e  # Exit on any error

echo " Starting deployment of Employee Attendance System..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
apt install -y python3 python3-pip python3-venv python3-dev
apt install -y mysql-server mysql-client libmysqlclient-dev
apt install -y apache2 libapache2-mod-wsgi-py3
apt install -y redis-server
apt install -y nginx  # For reverse proxy (optional)
apt install -y git curl wget unzip

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p /var/www/attendance
cd /var/www/attendance

# Clone or copy your application here
# If you have a git repository:
# git clone https://your-repo-url.git .
# Or copy files manually to this directory

# Create virtual environment
echo "🐍 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
echo "⚙️ Creating environment configuration..."
cat > .env << 'EOF'
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')

# Database Configuration
DB_ENGINE=django.db.backends.mysql
DB_NAME=attendance_db
DB_USER=attendance_user
DB_PASSWORD=$(openssl rand -base64 32)
DB_HOST=localhost
DB_PORT=3306

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Security Settings
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost,http://127.0.0.1

# Static and Media Files
STATIC_ROOT=/var/www/attendance/staticfiles
MEDIA_ROOT=/var/www/attendance/media

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/attendance/django.log
EOF

# Setup MySQL database
echo "🗄️ Setting up MySQL database..."
mysql -e "CREATE DATABASE IF NOT EXISTS attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'attendance_user'@'localhost' IDENTIFIED BY '$(grep DB_PASSWORD .env | cut -d'=' -f2)';"
mysql -e "GRANT ALL PRIVILEGES ON attendance_db.* TO 'attendance_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Setup Redis
echo " Configuring Redis..."
systemctl enable redis-server
systemctl start redis-server

# Create necessary directories
echo "📂 Creating necessary directories..."
mkdir -p /var/log/attendance
mkdir -p /var/www/attendance/staticfiles
mkdir -p /var/www/attendance/media
mkdir -p /var/www/attendance/logs

# Set permissions
echo "🔐 Setting proper permissions..."
chown -R www-data:www-data /var/www/attendance
chmod -R 755 /var/www/attendance
chmod 660 .env

# Run Django migrations
echo " Running Django migrations..."
source venv/bin/activate
python manage.py collectstatic --noinput
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
echo "👤 Creating superuser..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell

# Setup Apache configuration
echo "🌐 Setting up Apache configuration..."
cat > /etc/apache2/sites-available/attendance.conf << 'EOF'
<VirtualHost *:80>
    ServerName localhost
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/attendance

    Alias /static/ /var/www/attendance/staticfiles/
    Alias /media/ /var/www/attendance/media/

    <Directory /var/www/attendance/staticfiles>
        Require all granted
    </Directory>

    <Directory /var/www/attendance/media>
        Require all granted
    </Directory>

    WSGIDaemonProcess attendance python-path=/var/www/attendance:/var/www/attendance/venv/lib/python3.9/site-packages
    WSGIProcessGroup attendance
    WSGIScriptAlias / /var/www/attendance/attendance_system/wsgi.py

    <Directory /var/www/attendance/attendance_system>
        <Files wsgi.py>
            Require all granted
        </Files>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/attendance_error.log
    CustomLog ${APACHE_LOG_DIR}/attendance_access.log combined
</VirtualHost>
EOF

# Enable site and modules
echo "🔌 Enabling Apache site and modules..."
a2ensite attendance.conf
a2enmod wsgi
a2enmod rewrite

# Setup systemd service for attendance fetching
echo "⚙️ Setting up systemd service for attendance fetching..."
cat > /etc/systemd/system/attendance-fetcher.service << 'EOF'
[Unit]
Description=Attendance Fetching Service
After=network.target mysql.service redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/attendance
Environment=PATH=/var/www/attendance/venv/bin
ExecStart=/var/www/attendance/venv/bin/python manage.py auto_fetch_attendance
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
echo " Starting services..."
systemctl daemon-reload
systemctl enable attendance-fetcher
systemctl start attendance-fetcher
systemctl restart apache2

# Setup firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo " Deployment completed successfully!"
echo ""
echo "🌐 Your application should be accessible at: http://your-server-ip"
echo "👤 Default admin credentials: admin / admin123"
echo "📁 Application directory: /var/www/attendance"
echo "📋 Check logs at: /var/log/attendance/"
echo ""
echo "🔧 Next steps:"
echo "1. Update .env file with your domain and email settings"
echo "2. Configure SSL certificate with Let's Encrypt"
echo "3. Update ALLOWED_HOSTS in .env with your domain"
echo "4. Test the application thoroughly"
echo ""
echo "📚 Useful commands:"
echo "- Check service status: systemctl status attendance-fetcher"
echo "- View logs: tail -f /var/log/attendance/django.log"
echo "- Restart services: systemctl restart apache2 attendance-fetcher"
