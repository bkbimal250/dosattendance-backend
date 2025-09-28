#!/usr/bin/env python3
"""
Database Management Script for Employee Attendance System
This script provides various database operations including backup, restore, and cleanup.
"""

import os
import sys
import subprocess
import pymysql
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'host': '82.25.109.137',
    'user': 'dosadmin',
    'password': 'DishaSolution@8989',
    'database': 'dishasolutionattendance',
    'charset': 'utf8mb4'
}

def get_mysql_path():
    """Get the MySQL executable path"""
    possible_paths = [
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        r"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
        r"C:\xampp\mysql\bin\mysql.exe",
        "mysql"  # If in PATH
    ]
    
    for path in possible_paths:
        if os.path.exists(path) or path == "mysql":
            return path
    
    raise FileNotFoundError("MySQL executable not found. Please install MySQL or add it to PATH.")

def test_connection():
    """Test database connection"""
    try:
        connection = pymysql.connect(**DB_CONFIG)
        print("✅ Database connection successful!")
        connection.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def drop_database():
    """Drop the existing database"""
    try:
        # Connect without specifying database
        config = DB_CONFIG.copy()
        del config['database']
        connection = pymysql.connect(**config)
        
        with connection.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS {DB_CONFIG['database']}")
            print(f"✅ Database '{DB_CONFIG['database']}' dropped successfully!")
        
        connection.close()
        return True
    except Exception as e:
        print(f"❌ Failed to drop database: {e}")
        return False

def create_database():
    """Create a fresh database"""
    try:
        # Connect without specifying database
        config = DB_CONFIG.copy()
        del config['database']
        connection = pymysql.connect(**config)
        
        with connection.cursor() as cursor:
            cursor.execute(f"""
                CREATE DATABASE {DB_CONFIG['database']} 
                CHARACTER SET utf8mb4 
                COLLATE utf8mb4_unicode_ci
            """)
            print(f"✅ Database '{DB_CONFIG['database']}' created successfully!")
        
        connection.close()
        return True
    except Exception as e:
        print(f"❌ Failed to create database: {e}")
        return False

def restore_database(dump_file_path):
    """Restore database from dump file"""
    if not os.path.exists(dump_file_path):
        print(f"❌ Dump file not found: {dump_file_path}")
        return False
    
    try:
        mysql_path = get_mysql_path()
        cmd = [
            mysql_path,
            f"-h{DB_CONFIG['host']}",
            f"-u{DB_CONFIG['user']}",
            f"-p{DB_CONFIG['password']}",
            DB_CONFIG['database']
        ]
        
        print(f"🔄 Restoring database from: {dump_file_path}")
        print("This may take a few minutes...")
        
        with open(dump_file_path, 'r', encoding='utf-8') as dump_file:
            result = subprocess.run(cmd, stdin=dump_file, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Database restored successfully!")
            return True
        else:
            print(f"❌ Database restoration failed:")
            print(f"Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Failed to restore database: {e}")
        return False

def backup_database(backup_file_path):
    """Create a backup of the current database"""
    try:
        mysql_path = get_mysql_path()
        mysqldump_path = mysql_path.replace('mysql.exe', 'mysqldump.exe')
        
        cmd = [
            mysqldump_path,
            f"-h{DB_CONFIG['host']}",
            f"-u{DB_CONFIG['user']}",
            f"-p{DB_CONFIG['password']}",
            "--single-transaction",
            "--routines",
            "--triggers",
            DB_CONFIG['database']
        ]
        
        print(f"🔄 Creating backup: {backup_file_path}")
        
        with open(backup_file_path, 'w', encoding='utf-8') as backup_file:
            result = subprocess.run(cmd, stdout=backup_file, stderr=subprocess.PIPE, text=True)
        
        if result.returncode == 0:
            print("✅ Database backup created successfully!")
            return True
        else:
            print(f"❌ Database backup failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Failed to create backup: {e}")
        return False

def list_tables():
    """List all tables in the database"""
    try:
        connection = pymysql.connect(**DB_CONFIG)
        
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            if tables:
                print("📋 Current tables in database:")
                for table in tables:
                    print(f"  - {table[0]}")
            else:
                print("📋 No tables found in database")
        
        connection.close()
        return True
    except Exception as e:
        print(f"❌ Failed to list tables: {e}")
        return False

def main():
    """Main function with menu options"""
    print("🗄️  Database Management Tool")
    print("=" * 40)
    
    # Test connection first
    if not test_connection():
        print("\nPlease check your database configuration and try again.")
        return
    
    while True:
        print("\nOptions:")
        print("1. List current tables")
        print("2. Create backup")
        print("3. Drop and recreate database")
        print("4. Restore from dump file")
        print("5. Full restore (drop + create + restore)")
        print("6. Exit")
        
        choice = input("\nEnter your choice (1-6): ").strip()
        
        if choice == '1':
            list_tables()
            
        elif choice == '2':
            backup_path = input("Enter backup file path (or press Enter for default): ").strip()
            if not backup_path:
                backup_path = f"backup_{DB_CONFIG['database']}_{Path().cwd().name}.sql"
            backup_database(backup_path)
            
        elif choice == '3':
            confirm = input("⚠️  This will DELETE ALL DATA! Are you sure? (yes/no): ").strip().lower()
            if confirm == 'yes':
                if drop_database():
                    create_database()
            else:
                print("Operation cancelled.")
                
        elif choice == '4':
            dump_path = input("Enter dump file path: ").strip()
            if dump_path:
                restore_database(dump_path)
            else:
                print("❌ No file path provided.")
                
        elif choice == '5':
            dump_path = input("Enter dump file path: ").strip()
            if not dump_path:
                print("❌ No file path provided.")
                continue
                
            confirm = input("⚠️  This will DELETE ALL DATA and restore from dump! Are you sure? (yes/no): ").strip().lower()
            if confirm == 'yes':
                print("\n🔄 Starting full restore process...")
                if drop_database():
                    if create_database():
                        restore_database(dump_path)
            else:
                print("Operation cancelled.")
                
        elif choice == '6':
            print("👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
