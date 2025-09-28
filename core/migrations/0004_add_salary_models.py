# Generated manually to fix foreign key constraint issues

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_generateddocument_id_card_data_and_more'),
    ]

    operations = [
        # Create Salary model first
        migrations.CreateModel(
            name='Salary',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('basic_pay', models.DecimalField(decimal_places=2, help_text='Basic salary amount', max_digits=10)),
                ('increment', models.DecimalField(decimal_places=2, default=0, help_text='Increment amount', max_digits=10)),
                ('total_days', models.PositiveIntegerField(default=30, help_text='Total working days in the month')),
                ('worked_days', models.PositiveIntegerField(default=30, help_text='Days actually worked')),
                ('deduction', models.DecimalField(decimal_places=2, default=0, help_text='Total deductions', max_digits=10)),
                ('balance_loan', models.DecimalField(decimal_places=2, default=0, help_text='Outstanding loan balance', max_digits=10)),
                ('remaining_pay', models.DecimalField(decimal_places=2, default=0, help_text='Remaining pay after deductions', max_digits=10)),
                ('house_rent_allowance', models.DecimalField(decimal_places=2, default=0, help_text='House Rent Allowance', max_digits=10)),
                ('transport_allowance', models.DecimalField(decimal_places=2, default=0, help_text='Transport Allowance', max_digits=10)),
                ('medical_allowance', models.DecimalField(decimal_places=2, default=0, help_text='Medical Allowance', max_digits=10)),
                ('other_allowances', models.DecimalField(decimal_places=2, default=0, help_text='Other Allowances', max_digits=10)),
                ('provident_fund', models.DecimalField(decimal_places=2, default=0, help_text='Provident Fund deduction', max_digits=10)),
                ('professional_tax', models.DecimalField(decimal_places=2, default=0, help_text='Professional Tax', max_digits=10)),
                ('income_tax', models.DecimalField(decimal_places=2, default=0, help_text='Income Tax (TDS)', max_digits=10)),
                ('other_deductions', models.DecimalField(decimal_places=2, default=0, help_text='Other Deductions', max_digits=10)),
                ('salary_month', models.DateField(help_text='Salary month (first day of the month)')),
                ('pay_date', models.DateField(blank=True, help_text='Scheduled pay date', null=True)),
                ('paid_date', models.DateField(blank=True, help_text='Actual payment date', null=True)),
                ('payment_method', models.CharField(choices=[('bank_transfer', 'Bank Transfer'), ('cash', 'Cash'), ('cheque', 'Cheque'), ('other', 'Other')], default='bank_transfer', max_length=20)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('pending', 'Pending'), ('approved', 'Approved'), ('paid', 'Paid'), ('cancelled', 'Cancelled')], default='draft', max_length=20)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, help_text='Additional notes or comments')),
                ('rejection_reason', models.TextField(blank=True, help_text='Reason for rejection if applicable')),
                ('is_auto_calculated', models.BooleanField(default=False, help_text='Whether salary was auto-calculated from attendance')),
                ('attendance_based', models.BooleanField(default=True, help_text='Whether salary is based on attendance')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('employee', models.ForeignKey(limit_choices_to={'role': 'employee'}, on_delete=models.CASCADE, related_name='salaries', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Salary',
                'verbose_name_plural': 'Salaries',
                'ordering': ['-salary_month', '-created_at'],
            },
        ),
        # Add foreign key constraints for Salary model
        migrations.AddField(
            model_name='salary',
            name='approved_by',
            field=models.ForeignKey(blank=True, limit_choices_to={'role__in': ['admin', 'manager']}, null=True, on_delete=models.SET_NULL, related_name='approved_salaries', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='salary',
            name='created_by',
            field=models.ForeignKey(blank=True, limit_choices_to={'role__in': ['admin', 'manager', 'accountant']}, null=True, on_delete=models.SET_NULL, related_name='created_salaries', to=settings.AUTH_USER_MODEL),
        ),
        # Add indexes for Salary model
        migrations.AddIndex(
            model_name='salary',
            index=models.Index(fields=['employee', 'salary_month'], name='core_salary_employee_idx'),
        ),
        migrations.AddIndex(
            model_name='salary',
            index=models.Index(fields=['status', 'salary_month'], name='core_salary_status_idx'),
        ),
        migrations.AddIndex(
            model_name='salary',
            index=models.Index(fields=['approved_by', 'approved_at'], name='core_salary_approved_idx'),
        ),
        # Add unique constraint for Salary model
        migrations.AlterUniqueTogether(
            name='salary',
            unique_together={('employee', 'salary_month')},
        ),
        # Create SalaryTemplate model
        migrations.CreateModel(
            name='SalaryTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='Template name', max_length=200)),
                ('basic_pay', models.DecimalField(decimal_places=2, max_digits=10)),
                ('house_rent_allowance', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('transport_allowance', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('medical_allowance', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('other_allowances', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('provident_fund_percentage', models.DecimalField(decimal_places=2, default=12.0, max_digits=5)),
                ('professional_tax', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Salary Template',
                'verbose_name_plural': 'Salary Templates',
                'ordering': ['designation__name', 'office__name'],
            },
        ),
        # Add foreign key constraints for SalaryTemplate model
        migrations.AddField(
            model_name='salarytemplate',
            name='designation',
            field=models.ForeignKey(on_delete=models.CASCADE, related_name='salary_templates', to='core.designation'),
        ),
        migrations.AddField(
            model_name='salarytemplate',
            name='office',
            field=models.ForeignKey(on_delete=models.CASCADE, related_name='salary_templates', to='core.office'),
        ),
        # Add unique constraint for SalaryTemplate model
        migrations.AlterUniqueTogether(
            name='salarytemplate',
            unique_together={('designation', 'office')},
        ),
    ]
