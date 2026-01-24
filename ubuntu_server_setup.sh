#!/bin/bash

# Complete Ubuntu Server Setup for PostgreSQL
# Run this script on your Ubuntu server (82.25.109.137)

echo " Complete Ubuntu Server Setup for PostgreSQL"
echo "=============================================="
echo "⚠️  This script will configure PostgreSQL for remote access"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED} $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Some commands may need adjustment."
fi

# 1. Update system packages
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_status "System packages updated"

# 2. Install PostgreSQL if not already installed
print_info "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    print_info "Installing PostgreSQL..."
    sudo apt install postgresql postgresql-contrib -y
    print_status "PostgreSQL installed"
else
    print_status "PostgreSQL already installed"
fi

# 3. Start and enable PostgreSQL service
print_info "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_status "PostgreSQL service started and enabled"

# 4. Check PostgreSQL status
print_info "Checking PostgreSQL status..."
sudo systemctl status postgresql --no-pager -l

# 5. Configure PostgreSQL for remote access
print_info "Configuring PostgreSQL for remote access..."

# Find PostgreSQL version and config directory
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

print_info "PostgreSQL version: $PG_VERSION"
print_info "Config directory: $PG_CONFIG_DIR"

# Update postgresql.conf
print_info "Updating postgresql.conf..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONFIG_DIR/postgresql.conf"
sudo sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONFIG_DIR/postgresql.conf"
print_status "postgresql.conf updated"

# Update pg_hba.conf
print_info "Updating pg_hba.conf..."
# Remove any existing entries for the database
sudo sed -i '/host.*DishaSolutionAttendance.*dosadmin/d' "$PG_CONFIG_DIR/pg_hba.conf"
# Add new entry
echo "host    DishaSolutionAttendance    dosadmin    0.0.0.0/0    md5" | sudo tee -a "$PG_CONFIG_DIR/pg_hba.conf"
echo "host    all                        all         0.0.0.0/0    md5" | sudo tee -a "$PG_CONFIG_DIR/pg_hba.conf"
print_status "pg_hba.conf updated"

# 6. Configure firewall
print_info "Configuring firewall..."
sudo ufw allow 5432/tcp
sudo ufw --force enable
print_status "Firewall configured to allow port 5432"

# 7. Restart PostgreSQL
print_info "Restarting PostgreSQL service..."
sudo systemctl restart postgresql
sleep 3
print_status "PostgreSQL service restarted"

# 8. Verify PostgreSQL is listening on all interfaces
print_info "Checking if PostgreSQL is listening on all interfaces..."
sudo netstat -tlnp | grep 5432
if sudo netstat -tlnp | grep -q "0.0.0.0:5432"; then
    print_status "PostgreSQL is listening on all interfaces"
else
    print_warning "PostgreSQL may not be listening on all interfaces"
fi

# 9. Test local connection
print_info "Testing local PostgreSQL connection..."
if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
    print_status "Local PostgreSQL connection successful"
else
    print_error "Local PostgreSQL connection failed"
fi

# 10. Show connection information
echo ""
echo "📊 PostgreSQL Configuration Summary:"
echo "=================================="
echo "🌐 Server IP: $(hostname -I | awk '{print $1}')"
echo "🔌 Port: 5432"
echo "🗄️  Database: DishaSolutionAttendance"
echo "👤 User: dosadmin"
echo "🔑 Password: DishaSolution@8989"
echo ""

# 11. Show firewall status
print_info "Firewall status:"
sudo ufw status

# 12. Show PostgreSQL status
print_info "PostgreSQL service status:"
sudo systemctl status postgresql --no-pager

echo ""
print_status "Ubuntu server setup completed!"
echo ""
print_info "Next steps:"
echo "1. Test connection from your local machine"
echo "2. Run Django migrations"
echo "3. Create superuser"
echo "4. Start Django server"
echo ""
print_warning "If you still can't connect:"
echo "1. Check your hosting provider's firewall settings"
echo "2. Verify the server IP address"
echo "3. Check if there are any network restrictions"
