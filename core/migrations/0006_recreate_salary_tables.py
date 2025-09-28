# Generated manually to recreate salary tables with simplified structure

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_final_salary_system'),
    ]

    operations = [
        # Create simplified Salary model
        migrations.CreateModel(
            name='Salary',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('basic_pay', models.DecimalField(decimal_places=2, help_text='Basic salary amount', max_digits=10)),
                ('increment', models.DecimalField(decimal_places=2, default=0, help_text='Increment amount', max_digits=10)),
                ('total_days', models.PositiveIntegerField(default=30, help_text='Total working days in the month')),
                ('worked_days', models.PositiveIntegerField(default=30, help_text='Days actually worked')),
                ('deduction', models.DecimalField(decimal_places=2, default=0, help_text='Total deductions', max_digits=10)),
                ('balance_loan', models.DecimalField(decimal_places=2, default=0, help_text='Outstanding loan balance', max_digits=10)),
                ('remaining_pay', models.DecimalField(decimal_places=2, default=0, help_text='Remaining pay after deductions', max_digits=10)),
                ('salary_month', models.DateField(help_text='Salary month (first day of the month)')),
                ('pay_date', models.DateField(blank=True, help_text='Scheduled pay date', null=True)),
                ('paid_date', models.DateField(blank=True, help_text='Actual payment date', null=True)),
                ('payment_method', models.CharField(choices=[('bank_transfer', 'Bank Transfer'), ('cash', 'Cash'), ('cheque', 'Cheque')], default='bank_transfer', max_length=20)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('pending', 'Pending'), ('approved', 'Approved'), ('paid', 'Paid'), ('rejected', 'Rejected')], default='draft', max_length=20)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, help_text='Additional notes or comments')),
                ('rejection_reason', models.TextField(blank=True, help_text='Reason for rejection if applicable')),
                ('is_auto_calculated', models.BooleanField(default=False, help_text='Whether salary was auto-calculated from attendance')),
                ('attendance_based', models.BooleanField(default=True, help_text='Whether salary is based on attendance')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('approved_by', models.ForeignKey(blank=True, limit_choices_to={'role__in': ['admin', 'manager']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_salaries', to=settings.AUTH_USER_MODEL)),
                ('created_by', models.ForeignKey(blank=True, limit_choices_to={'role__in': ['admin', 'manager', 'accountant']}, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_salaries', to=settings.AUTH_USER_MODEL)),
                ('employee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='salaries', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Salary',
                'verbose_name_plural': 'Salaries',
                'ordering': ['-salary_month', 'employee__username'],
            },
        ),
        
        # Create simplified SalaryTemplate model
        migrations.CreateModel(
            name='SalaryTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('name', models.CharField(help_text='Template name', max_length=200)),
                ('designation_name', models.CharField(help_text='Designation name', max_length=200, default='Default Designation')),
                ('office_name', models.CharField(help_text='Office name', max_length=200, default='Default Office')),
                ('basic_pay', models.DecimalField(decimal_places=2, max_digits=10)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Salary Template',
                'verbose_name_plural': 'Salary Templates',
                'ordering': ['designation_name', 'office_name'],
            },
        ),
        
        # Add unique constraint for SalaryTemplate
        migrations.AddConstraint(
            model_name='salarytemplate',
            constraint=models.UniqueConstraint(fields=('designation_name', 'office_name'), name='unique_designation_office_name'),
        ),
    ]
