# Employee Attendance System - Apache2 VPS Deployment Guide

##  Complete VPS Deployment Guide for Ubuntu Server

### Prerequisites
- Ubuntu 20.04+ VPS with root/sudo access
- Domain name pointing to your VPS IP
- MySQL database (remote or local)
- Minimum 2GB RAM, 20GB storage

---

## 📋 Pre-Deployment Checklist

###  Project Status
- [x] **WeasyPrint Only**: PDF generation configured for Ubuntu
- [x] **ReportLab Removed**: Clean WeasyPrint-only implementation
- [x] **Auto Attendance Service**: Background service for device fetching
- [x] **Document Generator**: Professional PDF generation with HTML fallback
- [x] **Push Attendance**: ZKTeco device push data reception
- [x] **WebSocket Support**: Real-time updates
- [x] **Role-based Access**: Admin, Manager, Employee roles
- [x] **Multi-office Support**: Office-based data filtering

###  Security Features
- [x] JWT Authentication
- [x] CORS Configuration
- [x] Security Headers
- [x] Environment Variables
- [x] Database Connection Security

---

## 🛠️ Step 1: Server Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Required Packages
```bash
# Core packages
sudo apt install -y python3 python3-pip python3-venv python3-dev
sudo apt install -y apache2 libapache2-mod-wsgi-py3
sudo apt install -y mysql-client redis-server
sudo apt install -y git curl wget unzip

# WeasyPrint dependencies
sudo apt install -y python3-cffi python3-brotli libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0
sudo apt install -y libffi-dev libjpeg-dev libpng-dev libgif-dev librsvg2-dev

# Additional system dependencies
sudo apt install -y build-essential libssl-dev libffi-dev
```

### 1.3 Configure Firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🗄️ Step 2: Database Setup

### 2.1 MySQL Configuration (if using local MySQL)
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE u434975676_DOS CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'u434975676_bimal'@'localhost' IDENTIFIED BY 'DishaSolution@8989';
GRANT ALL PRIVILEGES ON u434975676_DOS.* TO 'u434975676_bimal'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Redis Configuration
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

---

## 📁 Step 3: Project Deployment

### 3.1 Upload Project Files
```bash
# Create project directory
sudo mkdir -p /var/www/EmployeeAttandance
sudo chown -R www-data:www-data /var/www/EmployeeAttandance

# Upload your project files (replace with your method)
# Option 1: SCP from local machine
scp -r /path/to/EmployeeAttandance/* root@your-vps-ip:/var/www/EmployeeAttandance/

# Option 2: Git clone
cd /var/www/EmployeeAttandance
sudo git clone https://github.com/your-repo/EmployeeAttandance.git .

# Option 3: Upload via FTP/SFTP
```

### 3.2 Set Permissions
```bash
sudo chown -R www-data:www-data /var/www/EmployeeAttandance
sudo chmod -R 755 /var/www/EmployeeAttandance
sudo chmod +x /var/www/EmployeeAttandance/*.sh
```

---

## 🐍 Step 4: Python Environment

### 4.1 Create Virtual Environment
```bash
cd /var/www/EmployeeAttandance
sudo python3 -m venv venv
sudo chown -R www-data:www-data venv
```

### 4.2 Install Dependencies
```bash
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/pip install --upgrade pip
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/pip install -r requirements.txt

# Install WeasyPrint system dependencies
sudo apt install -y python3-cffi python3-brotli libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0
```

### 4.3 Test WeasyPrint Installation
```bash
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python -c "import weasyprint; print('WeasyPrint version:', weasyprint.__version__)"
```

---

## ⚙️ Step 5: Environment Configuration

### 5.1 Create Environment File
```bash
sudo nano /var/www/EmployeeAttandance/.env
```

```env
# Django Settings
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-super-secret-key-here-change-this-in-production
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your-vps-ip

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
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Static and Media Files
STATIC_ROOT=/var/www/EmployeeAttandance/staticfiles
MEDIA_ROOT=/var/www/EmployeeAttandance/media

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/attendance/django.log
```

### 5.2 Set Environment File Permissions
```bash
sudo chown www-data:www-data /var/www/EmployeeAttandance/.env
sudo chmod 600 /var/www/EmployeeAttandance/.env
```

---

## 🗃️ Step 6: Database Migration

### 6.1 Run Migrations
```bash
cd /var/www/EmployeeAttandance
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py migrate
```

### 6.2 Create Superuser
```bash
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py createsuperuser
```

### 6.3 Collect Static Files
```bash
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py collectstatic --noinput
```

---

## 🌐 Step 7: Apache2 Configuration

### 7.1 Create Apache Virtual Host
```bash
sudo nano /etc/apache2/sites-available/employee-attendance.conf
```

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/EmployeeAttandance

    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/EmployeeAttandance

    # SSL Configuration (replace with your SSL certificate paths)
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/your-domain.crt
    SSLCertificateKeyFile /etc/ssl/private/your-domain.key
    SSLCertificateChainFile /etc/ssl/certs/your-domain-chain.crt

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
    ErrorLog ${APACHE_LOG_DIR}/employee_attendance_error.log
    CustomLog ${APACHE_LOG_DIR}/employee_attendance_access.log combined

    # Security
    ServerTokens Prod
    ServerSignature Off
</VirtualHost>
```

### 7.2 Enable Site and Modules
```bash
# Enable required Apache modules
sudo a2enmod ssl
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod wsgi

# Enable the site
sudo a2ensite employee-attendance.conf

# Disable default site
sudo a2dissite 000-default.conf

# Test configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
sudo systemctl enable apache2
```

---

## 🔧 Step 8: System Services

### 8.1 Create Attendance Service
```bash
sudo nano /etc/systemd/system/attendance-service.service
```

```ini
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
```

### 8.2 Enable and Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable attendance-service
sudo systemctl start attendance-service
sudo systemctl status attendance-service
```

---

## 🔒 Step 9: SSL Certificate (Let's Encrypt)

### 9.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-apache
```

### 9.2 Obtain SSL Certificate
```bash
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

---

## 📊 Step 10: Monitoring and Logging

### 10.1 Create Log Directory
```bash
sudo mkdir -p /var/log/attendance
sudo chown www-data:www-data /var/log/attendance
```

### 10.2 Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/attendance
```

```
/var/log/attendance/*.log {
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
```

---

##  Step 11: Final Verification

### 11.1 Test Django Application
```bash
cd /var/www/EmployeeAttandance
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py check --deploy
```

### 11.2 Test WeasyPrint
```bash
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python -c "
import weasyprint
print(' WeasyPrint version:', weasyprint.__version__)
print(' WeasyPrint is working correctly!')
"
```

### 11.3 Test Services
```bash
# Check Apache status
sudo systemctl status apache2

# Check attendance service
sudo systemctl status attendance-service

# Check Redis
sudo systemctl status redis-server

# Check logs
sudo tail -f /var/log/apache2/employee_attendance_error.log
sudo tail -f /var/log/attendance/django.log
```

---

##  Step 12: Frontend Deployment

### 12.1 Build Frontend
```bash
cd /var/www/EmployeeAttandance/frontend/AdminDashboard
npm install
npm run build
```

### 12.2 Configure Frontend
Update the frontend API base URL to point to your domain:
```javascript
// In frontend configuration
const API_BASE_URL = 'https://your-domain.com/api';
```

---

## 📋 Post-Deployment Checklist

###  Application Tests
- [ ] Django admin accessible
- [ ] API endpoints responding
- [ ] User authentication working
- [ ] Document generation working
- [ ] PDF download working (WeasyPrint)
- [ ] Attendance service running
- [ ] WebSocket connections working
- [ ] Static files serving correctly
- [ ] Media files accessible

###  Security Tests
- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] CORS configured correctly
- [ ] Environment variables secure
- [ ] Database connections encrypted

###  Performance Tests
- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] Static files cached
- [ ] Memory usage stable
- [ ] CPU usage normal

---

## 🔧 Troubleshooting

### Common Issues

#### 1. WeasyPrint Installation Issues
```bash
# Install missing dependencies
sudo apt install -y python3-cffi python3-brotli libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0

# Reinstall WeasyPrint
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/pip uninstall weasyprint
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/pip install weasyprint
```

#### 2. Permission Issues
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/EmployeeAttandance
sudo chmod -R 755 /var/www/EmployeeAttandance
```

#### 3. Database Connection Issues
```bash
# Test database connection
sudo -u www-data /var/www/EmployeeAttandance/venv/bin/python manage.py dbshell
```

#### 4. Apache Configuration Issues
```bash
# Test Apache configuration
sudo apache2ctl configtest

# Check error logs
sudo tail -f /var/log/apache2/error.log
```

---

## 📞 Support

If you encounter any issues during deployment:

1. Check the logs: `/var/log/apache2/employee_attendance_error.log`
2. Check Django logs: `/var/log/attendance/django.log`
3. Verify service status: `sudo systemctl status attendance-service`
4. Test WeasyPrint: `python -c "import weasyprint; print(weasyprint.__version__)"`

---

## 🎉 Deployment Complete!

Your Employee Attendance System is now deployed on Apache2 VPS with:
-  WeasyPrint PDF generation
-  Auto attendance fetching
-  Push data reception
-  WebSocket support
-  SSL security
-  Production optimizations

Access your application at: `https://your-domain.com`
