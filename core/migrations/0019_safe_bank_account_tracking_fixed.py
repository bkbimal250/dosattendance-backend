# Safe migration to add bank account tracking
# This handles the case where bank_account_updated_at column already exists

from django.db import migrations, models
import django.db.models.deletion
import uuid


def safe_add_bank_account_updated_at(apps, schema_editor):
    """Safely add bank_account_updated_at field if it doesn't exist"""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check if column exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'core_customuser'
            AND COLUMN_NAME = 'bank_account_updated_at'
        """)
        exists = cursor.fetchone()[0] > 0
        
        if not exists:
            # Add the column if it doesn't exist
            cursor.execute("""
                ALTER TABLE core_customuser 
                ADD COLUMN bank_account_updated_at DATETIME(6) NULL
            """)


def safe_reverse_bank_account_updated_at(apps, schema_editor):
    """Remove bank_account_updated_at field if it exists"""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'core_customuser'
            AND COLUMN_NAME = 'bank_account_updated_at'
        """)
        exists = cursor.fetchone()[0] > 0
        
        if exists:
            cursor.execute("""
                ALTER TABLE core_customuser 
                DROP COLUMN bank_account_updated_at
            """)




def safe_drop_bank_account_history_table(apps, schema_editor):
    """Drop BankAccountHistory table if it exists"""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check if table exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'core_bankaccounthistory'
        """)
        exists = cursor.fetchone()[0] > 0
        
        if exists:
            # Drop foreign keys first, then table
            try:
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                cursor.execute("DROP TABLE IF EXISTS core_bankaccounthistory")
                cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            except Exception as e:
                # If drop fails, try without foreign key checks
                cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                cursor.execute("DROP TABLE IF EXISTS core_bankaccounthistory")
                cursor.execute("SET FOREIGN_KEY_CHECKS = 1")


def create_bank_account_history_table(apps, schema_editor):
    """Create BankAccountHistory table with raw SQL to ensure correct foreign key types"""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check if table exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'core_bankaccounthistory'
        """)
        exists = cursor.fetchone()[0] > 0
        
        if not exists:
            # Get the actual column type of CustomUser.id
            cursor.execute("""
                SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'core_customuser'
                AND COLUMN_NAME = 'id'
            """)
            user_id_info = cursor.fetchone()
            
            # Determine the foreign key column type
            if user_id_info:
                user_id_type = user_id_info[0]  # e.g., 'char(36)' or 'binary(16)'
                # Extract just the type (remove length if present for FK)
                if 'char' in user_id_type.lower():
                    fk_type = 'CHAR(36)'
                elif 'binary' in user_id_type.lower():
                    fk_type = 'BINARY(16)'
                else:
                    fk_type = 'CHAR(36)'  # Default for UUID
            else:
                fk_type = 'CHAR(36)'  # Default for UUID
            
            # Create table with matching foreign key types
            cursor.execute(f"""
                CREATE TABLE core_bankaccounthistory (
                    id {fk_type} NOT NULL PRIMARY KEY,
                    action VARCHAR(50) NOT NULL,
                    old_values JSON NULL,
                    new_values JSON NULL,
                    change_reason LONGTEXT NOT NULL,
                    is_verified BOOLEAN NOT NULL DEFAULT 0,
                    verified_at DATETIME(6) NULL,
                    created_at DATETIME(6) NOT NULL,
                    user_id {fk_type} NOT NULL,
                    changed_by_id {fk_type} NULL,
                    verified_by_id {fk_type} NULL,
                    INDEX core_bankac_user_id_idx (user_id, created_at DESC),
                    INDEX core_bankac_is_veri_idx (is_verified, created_at DESC),
                    CONSTRAINT core_bankaccounthistory_user_id_fk 
                        FOREIGN KEY (user_id) REFERENCES core_customuser (id) ON DELETE CASCADE,
                    CONSTRAINT core_bankaccounthistory_changed_by_id_fk 
                        FOREIGN KEY (changed_by_id) REFERENCES core_customuser (id) ON DELETE SET NULL,
                    CONSTRAINT core_bankaccounthistory_verified_by_id_fk 
                        FOREIGN KEY (verified_by_id) REFERENCES core_customuser (id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)


def safe_drop_bank_account_history_model(apps, schema_editor):
    """Drop BankAccountHistory table if it exists"""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'core_bankaccounthistory'
        """)
        exists = cursor.fetchone()[0] > 0
        
        if exists:
            cursor.execute("DROP TABLE core_bankaccounthistory")


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_ghost_sync'),
    ]

    operations = [
        # Safely add bank_account_updated_at field (checks if exists first)
        migrations.RunPython(
            safe_add_bank_account_updated_at,
            safe_reverse_bank_account_updated_at
        ),
        
        # Use SeparateDatabaseAndState to handle DB and state separately
        migrations.SeparateDatabaseAndState(
            database_operations=[
                # Drop existing table if it exists
                migrations.RunPython(
                    safe_drop_bank_account_history_table,
                    lambda apps, schema_editor: None
                ),
                # Create table with raw SQL to ensure correct foreign key types
                migrations.RunPython(
                    create_bank_account_history_table,
                    safe_drop_bank_account_history_table
                ),
            ],
            state_operations=[
                # Register model in Django's state (table already exists in DB)
                migrations.CreateModel(
                    name='BankAccountHistory',
                    fields=[
                        ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ('action', models.CharField(max_length=50)),
                        ('old_values', models.JSONField(blank=True, help_text='Previous bank account values', null=True)),
                        ('new_values', models.JSONField(blank=True, help_text='New bank account values', null=True)),
                        ('change_reason', models.TextField(blank=True, help_text='Optional reason for the change')),
                        ('is_verified', models.BooleanField(default=False, help_text='Whether accountant has verified this change')),
                        ('verified_at', models.DateTimeField(blank=True, null=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('changed_by', models.ForeignKey(blank=True, help_text='User who made this change', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='bank_account_changes_made', to='core.customuser')),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bank_account_history', to='core.customuser')),
                        ('verified_by', models.ForeignKey(blank=True, help_text='Accountant who verified this change', limit_choices_to={'role': 'accountant'}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='bank_account_verifications', to='core.customuser')),
                    ],
                    options={
                        'verbose_name': 'Bank Account History',
                        'verbose_name_plural': 'Bank Account Histories',
                        'ordering': ['-created_at'],
                    },
                ),
                migrations.AddIndex(
                    model_name='bankaccounthistory',
                    index=models.Index(fields=['user', '-created_at'], name='core_bankac_user_id_idx'),
                ),
                migrations.AddIndex(
                    model_name='bankaccounthistory',
                    index=models.Index(fields=['is_verified', '-created_at'], name='core_bankac_is_veri_idx'),
                ),
            ],
        ),
    ]

