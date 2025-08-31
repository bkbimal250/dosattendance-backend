from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid
from django.core.exceptions import ValidationError


class Office(models.Model):
    """Office model for multi-office support"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    address = models.TextField()
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    description = models.TextField(blank=True)
    manager = models.ForeignKey('CustomUser', on_delete=models.SET_NULL, null=True, blank=True, 
                               related_name='managed_office', limit_choices_to={'role': 'manager'})
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Offices"
        ordering = ['name']

    def __str__(self):
        return self.name

    def clean(self):
        """Validate that manager is actually a manager role"""
        if self.manager and self.manager.role != 'manager':
            raise ValidationError('Only users with manager role can be assigned as office managers.')
        
        # Ensure manager is not already assigned to another office
        if self.manager:
            existing_office = Office.objects.filter(manager=self.manager).exclude(id=self.id).first()
            if existing_office:
                raise ValidationError(f'Manager {self.manager.get_full_name()} is already assigned to office {existing_office.name}.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class CustomUser(AbstractUser):
    """Custom User model with role-based access"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]
    
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='employee')
    office = models.ForeignKey(Office, on_delete=models.CASCADE, null=True, blank=True)
    
    # Personal Information
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    
    # Employment Information
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    biometric_id = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Biometric ID from ESSL device")
    joining_date = models.DateField(null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)
    
    # Bank Details
    account_holder_name = models.CharField(max_length=200, blank=True, help_text="Name as it appears on bank account")
    bank_name = models.CharField(max_length=200, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    ifsc_code = models.CharField(max_length=20, blank=True, help_text="IFSC Code of the bank branch")
    bank_branch_name = models.CharField(max_length=200, blank=True)
    
    # System Fields
    is_active = models.BooleanField(default=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ['username']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    def clean(self):
        """Validate user data"""
        super().clean()
        # Ensure managers have an office assigned
        if self.role == 'manager' and not self.office:
            raise ValidationError('Managers must be assigned to an office.')
        
        # Ensure admins don't have office restrictions
        if self.role == 'admin' and self.office:
            # Admin can have office but it's not required
            pass

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_manager(self):
        return self.role == 'manager'

    @property
    def is_employee(self):
        return self.role == 'employee'


class Device(models.Model):
    """Biometric device model for attendance tracking"""
    DEVICE_TYPE_CHOICES = [
        ('essl', 'ESSL'),
        ('zkteco', 'ZKTeco'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    device_type = models.CharField(max_length=10, choices=DEVICE_TYPE_CHOICES)
    ip_address = models.GenericIPAddressField()
    port = models.IntegerField(default=4370)
    serial_number = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=200, blank=True)
    office = models.ForeignKey(Office, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    
    # ESSL Device Specific Fields
    device_id = models.CharField(max_length=50, blank=True, help_text="Device ID from ESSL device")
    firmware_version = models.CharField(max_length=50, blank=True)
    device_status = models.CharField(max_length=20, default='online', choices=[
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('error', 'Error'),
    ])
    sync_interval = models.IntegerField(default=5, help_text="Sync interval in minutes")
    last_attendance_sync = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.device_type})"


class DeviceUser(models.Model):
    """Model to map users from ZKTeco devices to system users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='device_users')
    device_user_id = models.CharField(max_length=50, help_text="User ID from the device")
    device_user_name = models.CharField(max_length=100, help_text="Name from the device")
    device_user_privilege = models.CharField(max_length=20, default='user', choices=[
        ('user', 'User'),
        ('admin', 'Admin'),
        ('super_admin', 'Super Admin'),
    ])
    device_user_password = models.CharField(max_length=50, blank=True, help_text="Password from device (if available)")
    device_user_group = models.CharField(max_length=50, blank=True, help_text="Group from device")
    device_user_card = models.CharField(max_length=50, blank=True, help_text="Card number from device")
    
    # Mapping to system user
    system_user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='device_mappings')
    is_mapped = models.BooleanField(default=False, help_text="Whether this device user is mapped to a system user")
    mapping_notes = models.TextField(blank=True, help_text="Notes about the mapping")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['device', 'device_user_id']
        ordering = ['device', 'device_user_id']

    def __str__(self):
        return f"{self.device.name} - {self.device_user_name} ({self.device_user_id})"

    def map_to_system_user(self, system_user):
        """Map this device user to a system user"""
        self.system_user = system_user
        self.is_mapped = True
        self.save()


class Attendance(models.Model):
    """Attendance model for tracking employee attendance"""
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('half_day', 'Half Day'),
        ('leave', 'Leave'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    date = models.DateField()
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    total_hours = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present')
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date', '-check_in_time']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.date} ({self.status})"

    def calculate_total_hours(self):
        """Calculate total working hours"""
        if self.check_in_time and self.check_out_time:
            # Make both times timezone-aware for comparison
            from django.utils import timezone
            
            check_in = self.check_in_time
            check_out = self.check_out_time
            
            # If check_in is naive, make it timezone-aware
            if timezone.is_naive(check_in):
                check_in = timezone.make_aware(check_in, timezone.get_current_timezone())
            
            # If check_out is naive, make it timezone-aware
            if timezone.is_naive(check_out):
                check_out = timezone.make_aware(check_out, timezone.get_current_timezone())
            
            duration = check_out - check_in
            return round(duration.total_seconds() / 3600, 2)
        return None

    def save(self, *args, **kwargs):
        if self.check_in_time and self.check_out_time:
            self.total_hours = self.calculate_total_hours()
        super().save(*args, **kwargs)


class Leave(models.Model):
    """Leave model for employee leave management"""
    LEAVE_TYPE_CHOICES = [
        ('casual', 'Casual Leave'),
        ('sick', 'Sick Leave'),
        ('annual', 'Annual Leave'),
        ('maternity', 'Maternity Leave'),
        ('paternity', 'Paternity Leave'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.IntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_leaves'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.leave_type} ({self.status})"


class Document(models.Model):
    """Document model for file management"""
    DOCUMENT_TYPE_CHOICES = [
        ('salary_slip', 'Salary Slip'),
        ('offer_letter', 'Offer Letter'),
        ('id_proof', 'ID Proof'),
        ('address_proof', 'Address Proof'),
        ('aadhar_card', 'Aadhar Card'),
        ('pan_card', 'PAN Card'),
        ('voter_id', 'Voter ID'),
        ('driving_license', 'Driving License'),
        ('passport', 'Passport'),
        ('birth_certificate', 'Birth Certificate'),
        ('educational_certificate', 'Educational Certificate'),
        ('experience_certificate', 'Experience Certificate'),
        ('medical_certificate', 'Medical Certificate'),
        ('bank_statement', 'Bank Statement'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='documents/')
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='uploaded_documents'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.get_full_name()}"


class Notification(models.Model):
    """Notification model for system notifications"""
    NOTIFICATION_TYPE_CHOICES = [
        ('attendance', 'Attendance'),
        ('leave', 'Leave'),
        ('system', 'System'),
        ('document', 'Document'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.get_full_name()}"


class SystemSettings(models.Model):
    """System settings model for configuration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "System Settings"
        ordering = ['key']

    def __str__(self):
        return f"{self.key}: {self.value}"


class AttendanceLog(models.Model):
    """Log model for tracking attendance changes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)  # 'created', 'updated', 'deleted'
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    changed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} - {self.attendance}"


class ESSLAttendanceLog(models.Model):
    """Raw attendance log from ESSL devices"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    biometric_id = models.CharField(max_length=50)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    punch_time = models.DateTimeField()
    punch_type = models.CharField(max_length=10, choices=[
        ('in', 'Check In'),
        ('out', 'Check Out'),
    ])
    is_processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-punch_time']
        indexes = [
            models.Index(fields=['biometric_id', 'punch_time']),
            models.Index(fields=['device', 'punch_time']),
        ]

    def __str__(self):
        return f"{self.biometric_id} - {self.punch_time} ({self.punch_type})"


class WorkingHoursSettings(models.Model):
    """Settings for working hours and attendance rules"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    office = models.ForeignKey(Office, on_delete=models.CASCADE)
    standard_hours = models.DecimalField(max_digits=4, decimal_places=2, default=9.0, help_text="Standard working hours per day")
    start_time = models.TimeField(default='09:00:00', help_text="Standard start time")
    end_time = models.TimeField(default='18:00:00', help_text="Standard end time")
    late_threshold = models.IntegerField(default=15, help_text="Minutes after start time to consider late")
    half_day_threshold = models.IntegerField(default=240, help_text="Minutes to consider half day (4 hours)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Working Hours Settings"
        unique_together = ['office']

    def __str__(self):
        return f"{self.office.name} - {self.standard_hours} hours"
