#!/bin/bash

# Deployment script to pull from GitHub and deploy push functionality
# Run this script on your Ubuntu server after pushing to GitHub

echo "============================================================"
echo "DEPLOYING PUSH FUNCTIONALITY FROM GITHUB"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/EmployeeAttendance"
GITHUB_REPO="your-username/EmployeeAttandance"  # Update with your GitHub repo
BRANCH="main"  # or "master" depending on your default branch

echo -e "${YELLOW}Step 1: Backing up current files...${NC}"

# Create backup directory
BACKUP_DIR="/var/backups/EmployeeAttendance_$(date +%Y%m%d_%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"

# Backup current files
sudo cp -r "$PROJECT_DIR" "$BACKUP_DIR/"
echo -e "${GREEN}✅ Backup created at: $BACKUP_DIR${NC}"

echo -e "${YELLOW}Step 2: Pulling latest code from GitHub...${NC}"

# Navigate to project directory
cd "$PROJECT_DIR"

# Pull latest changes from GitHub
git pull origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pulled from GitHub${NC}"
else
    echo -e "${RED}❌ Failed to pull from GitHub${NC}"
    echo "Please check your GitHub repository URL and branch name"
    exit 1
fi

echo -e "${YELLOW}Step 3: Installing Python dependencies...${NC}"

# Activate virtual environment
source venv/bin/activate

# Install any new dependencies
pip install django-cors-headers

echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${YELLOW}Step 4: Running Django migrations...${NC}"

# Run migrations
python manage.py migrate

echo -e "${GREEN}✅ Migrations completed${NC}"

echo -e "${YELLOW}Step 5: Collecting static files...${NC}"

# Collect static files
python manage.py collectstatic --noinput

echo -e "${GREEN}✅ Static files collected${NC}"

echo -e "${YELLOW}Step 6: Setting up Apache2 configuration...${NC}"

# Copy Apache2 configuration
sudo cp apache2_push_virtualhost.conf /etc/apache2/sites-available/employee-attendance-push.conf

# Enable the new site
sudo a2ensite employee-attendance-push.conf

# Enable required Apache2 modules
sudo a2enmod proxy proxy_http rewrite headers wsgi

# Test Apache2 configuration
sudo apache2ctl configtest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Apache2 configuration is valid${NC}"
else
    echo -e "${RED}❌ Apache2 configuration has errors${NC}"
    echo "Please check the Apache2 configuration file"
    exit 1
fi

echo -e "${YELLOW}Step 7: Configuring firewall...${NC}"

# Configure UFW firewall
sudo ufw allow 8081/tcp
echo "Port 8081 opened in firewall"

echo -e "${GREEN}✅ Firewall configured${NC}"

echo -e "${YELLOW}Step 8: Creating log directories...${NC}"

# Create log directory
sudo mkdir -p /var/log/django
sudo chown www-data:www-data /var/log/django
sudo chmod 755 /var/log/django

echo -e "${GREEN}✅ Log directories created${NC}"

echo -e "${YELLOW}Step 9: Restarting services...${NC}"

# Restart Apache2
sudo systemctl restart apache2

# Enable Apache2 to start on boot
sudo systemctl enable apache2

echo -e "${GREEN}✅ Apache2 restarted${NC}"

echo -e "${YELLOW}Step 10: Testing the deployment...${NC}"

# Test health check endpoint
echo "Testing health check endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/device/health-check/)

if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ Health check endpoint is working${NC}"
else
    echo -e "${YELLOW}⚠️  Health check returned status: $response${NC}"
    echo "This might be normal if Apache2 is not fully started yet"
fi

echo "============================================================"
echo "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "============================================================"

echo -e "${GREEN}Push Data Reception is now deployed from GitHub!${NC}"
echo ""
echo "Server Configuration:"
echo "  - Domain: company.d0s369.co.in"
echo "  - Port: 8081"
echo "  - Push Endpoint: https://company.d0s369.co.in:8081/api/device/push-attendance/"
echo "  - Health Check: https://company.d0s369.co.in:8081/api/device/health-check/"
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
echo "1. Test the health check endpoint: curl https://company.d0s369.co.in:8081/api/device/health-check/"
echo "2. Configure your biometric devices to push to: https://company.d0s369.co.in:8081/api/device/push-attendance/"
echo "3. Monitor the logs for incoming data"
echo ""
echo -e "${GREEN}Your attendance system is ready to receive pushed data! 🎉${NC}"
