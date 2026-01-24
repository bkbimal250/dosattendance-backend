#!/bin/bash

# Deployment script for testing files to Ubuntu Apache2 server
# This script uploads all testing files to your production server

echo "============================================================"
echo "DEPLOYING TESTING FILES TO UBUNTU APACHE2 SERVER"
echo "============================================================"

# Configuration
SERVER_USER="root"  # Change to your server username
SERVER_IP="82.25.109.137"  # Your server IP
SERVER_PATH="/var/www/EmployeeAttendance"  # Your Django project path

echo "Server: $SERVER_USER@$SERVER_IP"
echo "Path: $SERVER_PATH"
echo ""

# Check if files exist locally
echo "Checking local files..."
files=(
    "test_push_functionality.py"
    "manual_test_commands.sh"
    "verify_database_records.py"
    "TESTING_GUIDE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo " $file exists"
    else
        echo " $file not found"
        exit 1
    fi
done

echo ""
echo "Uploading files to server..."

# Upload testing files
echo "1. Uploading test_push_functionality.py..."
scp test_push_functionality.py $SERVER_USER@$SERVER_IP:$SERVER_PATH/

echo "2. Uploading manual_test_commands.sh..."
scp manual_test_commands.sh $SERVER_USER@$SERVER_IP:$SERVER_PATH/

echo "3. Uploading verify_database_records.py..."
scp verify_database_records.py $SERVER_USER@$SERVER_IP:$SERVER_PATH/

echo "4. Uploading TESTING_GUIDE.md..."
scp TESTING_GUIDE.md $SERVER_USER@$SERVER_IP:$SERVER_PATH/

echo ""
echo "Setting permissions on server..."

# Set executable permissions
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && chmod +x test_push_functionality.py"
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && chmod +x manual_test_commands.sh"
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && chmod +x verify_database_records.py"

echo ""
echo "Verifying files on server..."

# Verify files were uploaded
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && ls -la test_push_functionality.py manual_test_commands.sh verify_database_records.py TESTING_GUIDE.md"

echo ""
echo "============================================================"
echo "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "============================================================"
echo ""
echo "Files uploaded to: $SERVER_PATH"
echo ""
echo "Next steps on your server:"
echo "1. SSH into your server:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo ""
echo "2. Navigate to project directory:"
echo "   cd $SERVER_PATH"
echo ""
echo "3. Run automated tests:"
echo "   python test_push_functionality.py --production"
echo ""
echo "4. Run database verification:"
echo "   python verify_database_records.py"
echo ""
echo "5. Run manual tests:"
echo "   ./manual_test_commands.sh"
echo ""
echo "6. Check the testing guide:"
echo "   cat TESTING_GUIDE.md"
echo ""
echo "Your push attendance testing suite is now ready on the server! 🎉"
