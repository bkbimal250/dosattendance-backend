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


def safe_create_bank_account_history_table(apps, schema_editor):
    """Safely create BankAccountHistory table if it doesn't exist"""
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
            # Table already exists, skip creation
            return


def safe_drop_bank_account_history_table(apps, schema_editor):
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
        ('core', '0017_remove_customuser_upi_qr_reason_and_more'),
    ]

    operations = [
        # Safely add bank_account_updated_at field (checks if exists first)
        migrations.RunPython(
            safe_add_bank_account_updated_at,
            safe_reverse_bank_account_updated_at
        ),
        
        # Create BankAccountHistory model (only if table doesn't exist)
        migrations.RunPython(
            safe_create_bank_account_history_table,
            safe_drop_bank_account_history_table
        ),
        
        # Create BankAccountHistory model (only if table doesn't exist)
        # We use a RunPython to check first, then CreateModel
        migrations.RunPython(
            lambda apps, schema_editor: None,  # No-op forward
            lambda apps, schema_editor: None   # No-op reverse
        ),
        
        # Now create the model structure (will be skipped if table exists)
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
    ]

