"""
Production database connection monitor.
This command safely monitors database connections in production.
"""

from django.core.management.base import BaseCommand
from django.db import connections
from core.production_db_manager import production_db_manager
import time
import json

class Command(BaseCommand):
    help = 'Monitor production database connections safely'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=30,
            help='Monitoring interval in seconds (default: 30)'
        )
        parser.add_argument(
            '--duration',
            type=int,
            default=300,
            help='Monitoring duration in seconds (default: 300 = 5 minutes)'
        )
        parser.add_argument(
            '--status',
            action='store_true',
            help='Show current connection status and exit'
        )

    def handle(self, *args, **options):
        if options['status']:
            self.show_status()
            return
        
        interval = options['interval']
        duration = options['duration']
        
        self.stdout.write(
            self.style.SUCCESS('🔍 Starting production database monitoring...')
        )
        self.stdout.write(f"⏰ Monitoring interval: {interval} seconds")
        self.stdout.write(f"⏱️  Monitoring duration: {duration} seconds")
        self.stdout.write("🛑 Press Ctrl+C to stop monitoring")
        
        start_time = time.time()
        check_count = 0
        
        try:
            while time.time() - start_time < duration:
                check_count += 1
                self.stdout.write(f"\n📊 Check #{check_count} - {time.strftime('%H:%M:%S')}")
                
                # Check connection status
                status = production_db_manager.get_connection_status()
                if status.get('connected'):
                    self.stdout.write(self.style.SUCCESS("✅ Database connection: OK"))
                else:
                    self.stdout.write(self.style.ERROR("❌ Database connection: FAILED"))
                    if 'error' in status:
                        self.stdout.write(f"   Error: {status['error']}")
                
                # Test connection
                if production_db_manager.safe_connection_test():
                    self.stdout.write(self.style.SUCCESS("✅ Connection test: PASSED"))
                else:
                    self.stdout.write(self.style.ERROR("❌ Connection test: FAILED"))
                
                # Wait for next check
                if time.time() - start_time < duration:
                    self.stdout.write(f"⏳ Waiting {interval} seconds for next check...")
                    time.sleep(interval)
        
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("\n🛑 Monitoring stopped by user"))
        
        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Monitoring completed. Total checks: {check_count}")
        )

    def show_status(self):
        """Show current connection status."""
        self.stdout.write('\n📊 Production Database Status:')
        self.stdout.write('-' * 50)
        
        status = production_db_manager.get_connection_status()
        
        if status.get('connected'):
            self.stdout.write(self.style.SUCCESS("✅ Connection Status: CONNECTED"))
        else:
            self.stdout.write(self.style.ERROR("❌ Connection Status: DISCONNECTED"))
        
        self.stdout.write(f"🔧 Database: {status.get('database', 'N/A')}")
        self.stdout.write(f"🌐 Host: {status.get('host', 'N/A')}:{status.get('port', 'N/A')}")
        self.stdout.write(f"💾 Vendor: {status.get('vendor', 'N/A')}")
        
        if 'error' in status:
            self.stdout.write(self.style.ERROR(f"❌ Error: {status['error']}"))
        
        # Test connection
        self.stdout.write("\n🧪 Testing connection...")
        if production_db_manager.safe_connection_test():
            self.stdout.write(self.style.SUCCESS("✅ Connection test: PASSED"))
        else:
            self.stdout.write(self.style.ERROR("❌ Connection test: FAILED"))
        
        self.stdout.write('-' * 50)
