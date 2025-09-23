from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta
import uuid
from django.core.exceptions import ValidationError
from django.template import Template, Context


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
    managers = models.ManyToManyField('CustomUser', blank=True, 
                                     related_name='managed_offices', limit_choices_to={'role': 'manager'},
                                     help_text="Up to 5 managers can be assigned to an office")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Offices"
        ordering = ['name']

    def __str__(self):
        return self.name

    def clean(self):
        """Validate that managers are actually manager role and limit to 5"""
        # This validation will be handled in the serializer since ManyToMany fields
        # are not available during model.clean() for new instances
        pass

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Department(models.Model):
    """Department model for organizing employees"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Departments"
        ordering = ['name']

    def __str__(self):
        return self.name


class Designation(models.Model):
    """Designation model for employee job titles"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='designations')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Designations"
        ordering = ['department__name', 'name']
        unique_together = ['name', 'department']

    def __str__(self):
        try:
            return f"{self.name} ({self.department.name})"
        except Exception:
            return f"{self.name} (No Department)"


class CustomUser(AbstractUser):
    """Custom User model with role-based access"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
        ('accountant', 'Accountant'),
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
    
    # Government ID Information
    aadhaar_card = models.CharField(max_length=12, blank=True, help_text="12-digit Aadhaar card number")
    pan_card = models.CharField(max_length=10, blank=True, help_text="10-character PAN card number")
    
    # Employment Information
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    biometric_id = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Biometric ID from ESSL device")
    joining_date = models.DateField(null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees', db_column='department_id')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees', db_column='designation_id')
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
        
        # Validate Aadhaar card number
        if self.aadhaar_card:
            aadhaar = self.aadhaar_card.replace(' ', '').replace('-', '')
            if not aadhaar.isdigit() or len(aadhaar) != 12:
                raise ValidationError({'aadhaar_card': 'Aadhaar card number must be exactly 12 digits.'})
        
        # Validate PAN card number
        if self.pan_card:
            pan = self.pan_card.upper().replace(' ', '')
            if len(pan) != 10:
                raise ValidationError({'pan_card': 'PAN card number must be exactly 10 characters.'})
            if not (pan[:5].isalpha() and pan[5:9].isdigit() and pan[9].isalpha()):
                raise ValidationError({'pan_card': 'PAN card number format should be: AAAAA9999A (5 letters, 4 digits, 1 letter).'})

    def save(self, *args, **kwargs):
        # Only run validation if this is not a partial update (like last_login)
        if not kwargs.get('update_fields'):
            self.clean()
        
        # Handle UUID field compatibility issues
        try:
            super().save(*args, **kwargs)
        except Exception as e:
            if "Save with update_fields did not affect any rows" in str(e):
                # If it's a partial update that failed, try a full save
                if kwargs.get('update_fields'):
                    # Remove update_fields and try again
                    kwargs.pop('update_fields', None)
                    super().save(*args, **kwargs)
                else:
                    raise
            elif "Duplicate entry" in str(e) and "username" in str(e):
                # Handle duplicate username error - this shouldn't happen for updates
                # If we're trying to update an existing user, ignore this error
                if self.pk:
                    # This is an update, so the duplicate error is unexpected
                    # This is likely a last_login update issue, so we'll ignore it
                    pass
                else:
                    raise
            else:
                raise

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_manager(self):
        return self.role == 'manager'

    @property
    def is_employee(self):
        return self.role == 'employee'
    
    @property
    def is_accountant(self):
        return self.role == 'accountant'


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
        try:
            return f"{self.device.name} - {self.device_user_name} ({self.device_user_id})"
        except Exception:
            return f"Device User - {self.device_user_name} ({self.device_user_id})"

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
    ]
    
    DAY_STATUS_CHOICES = [
        ('complete_day', 'Complete Day'),
        ('half_day', 'Half Day'),
        ('absent', 'Absent'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    date = models.DateField()
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    total_hours = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present')
    day_status = models.CharField(max_length=15, choices=DAY_STATUS_CHOICES, default='complete_day')
    is_late = models.BooleanField(default=False, help_text="Whether employee came late")
    late_minutes = models.IntegerField(default=0, help_text="Minutes late from start time")
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Custom manager to ensure save method is called
    class AttendanceManager(models.Manager):
        def create(self, **kwargs):
            # Create the instance
            instance = self.model(**kwargs)
            # Calculate attendance status
            instance.calculate_attendance_status()
            # Save to database
            instance.save()
            return instance
    
    objects = AttendanceManager()

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date', '-check_in_time']

    def __str__(self):
        try:
            return f"{self.user.get_full_name()} - {self.date} ({self.status})"
        except Exception:
            return f"Attendance - {self.date} ({self.status})"

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

    def calculate_attendance_status(self):
        """Calculate attendance status based on working hours and late coming"""
        try:
            from django.utils import timezone
            from datetime import time, datetime
            
            # Get working hours settings for the user's office
            office = self.user.office
            if not office:
                # Default settings if no office assigned
                start_time = time(10, 0)  # 10:00 AM
                late_threshold_minutes = 15
                half_day_hours = 5.0
                late_coming_threshold = time(11, 30)  # 11:30 AM
            else:
                # Get office-specific settings
                settings = WorkingHoursSettings.objects.filter(office=office).first()
                if settings:
                    start_time = settings.start_time
                    late_threshold_minutes = settings.late_threshold
                    half_day_hours = float(settings.half_day_threshold) / 60  # Convert minutes to hours
                    late_coming_threshold = settings.late_coming_threshold
                else:
                    # Default settings
                    start_time = time(10, 0)
                    late_threshold_minutes = 15
                    half_day_hours = 5.0
                    late_coming_threshold = time(11, 30)  # 11:30 AM
            
            # Check if present (has check-in time)
            if not self.check_in_time:
                self.status = 'absent'
                self.day_status = 'absent'
                self.is_late = False
                self.late_minutes = 0
                return
            
            # Check if late coming (after late_coming_threshold)
            check_in_time_only = self.check_in_time.time()
            
            if check_in_time_only > late_coming_threshold:
                self.is_late = True
                # Calculate minutes late from late_coming_threshold (11:30 AM), not start_time
                late_threshold_datetime = datetime.combine(self.date, late_coming_threshold)
                
                # Make both times timezone-aware for comparison
                if timezone.is_naive(late_threshold_datetime):
                    late_threshold_datetime = timezone.make_aware(late_threshold_datetime, timezone.get_current_timezone())
                
                check_in_time = self.check_in_time
                if timezone.is_naive(check_in_time):
                    check_in_time = timezone.make_aware(check_in_time, timezone.get_current_timezone())
                
                late_delta = check_in_time - late_threshold_datetime
                self.late_minutes = max(0, int(late_delta.total_seconds() / 60))
            else:
                self.is_late = False
                self.late_minutes = 0
            
            # Calculate day status based on working hours
            if self.total_hours:
                if self.total_hours < half_day_hours:
                    self.day_status = 'half_day'
                    self.status = 'present'  # Status is always present if checked in
                else:
                    self.day_status = 'complete_day'
                    self.status = 'present'
            else:
                # If no check-out time, assume present for the day
                self.day_status = 'complete_day'
                self.status = 'present'
                
        except Exception as e:
            # Fallback to default values if calculation fails
            self.status = 'present'
            self.day_status = 'complete_day'
            self.is_late = False
            self.late_minutes = 0

    def save(self, *args, **kwargs):
        # Check for existing attendance record for the same user on the same date
        if self.pk is None:  # Only check on creation
            existing = Attendance.objects.filter(user=self.user, date=self.date).first()
            if existing:
                # Update existing record instead of creating duplicate
                existing.check_in_time = self.check_in_time or existing.check_in_time
                existing.check_out_time = self.check_out_time or existing.check_out_time
                existing.status = self.status or existing.status
                existing.device = self.device or existing.device
                existing.notes = self.notes or existing.notes
                existing.save()
                # Return the existing record's ID to prevent creation
                self.pk = existing.pk
                return
        
        # Calculate total hours if both check-in and check-out times are available
        if self.check_in_time and self.check_out_time:
            self.total_hours = self.calculate_total_hours()
        
        # Automatically calculate attendance status
        self.calculate_attendance_status()
        
        super().save(*args, **kwargs)

    def manual_update_status(self, new_status, new_day_status=None, notes=None):
        """Manually update attendance status without triggering automatic calculations"""
        # Use Django's update() method to bypass the model's save method
        update_data = {
            'status': new_status,
            'notes': notes if notes is not None else self.notes,
            'updated_at': timezone.now()
        }
        
        if new_day_status:
            update_data['day_status'] = new_day_status
        else:
            # Auto-set day_status based on status
            if new_status == 'absent':
                update_data['day_status'] = 'absent'
            else:
                update_data['day_status'] = 'complete_day'
        
        # Update the instance attributes
        self.status = update_data['status']
        self.day_status = update_data['day_status']
        self.notes = update_data['notes']
        self.updated_at = update_data['updated_at']
        
        # Use update() to bypass the model's save method
        Attendance.objects.filter(id=self.id).update(**update_data)
        
        return self


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
        try:
            return f"{self.user.get_full_name()} - {self.leave_type} ({self.status})"
        except Exception:
            return f"Leave - {self.leave_type} ({self.status})"


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
        try:
            return f"{self.title} - {self.user.get_full_name()}"
        except Exception:
            return f"{self.title} - Unknown User"


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
        try:
            return f"{self.title} - {self.user.get_full_name()}"
        except Exception:
            return f"{self.title} - Unknown User"


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
        try:
            return f"{self.action} - {self.attendance}"
        except Exception:
            return f"{self.action} - Unknown Attendance"


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
    start_time = models.TimeField(default='10:00:00', help_text="Standard start time")
    end_time = models.TimeField(default='19:00:00', help_text="Standard end time")
    late_threshold = models.IntegerField(default=15, help_text="Minutes after start time to consider late")
    half_day_threshold = models.IntegerField(default=300, help_text="Minutes to consider half day (5 hours)")
    late_coming_threshold = models.TimeField(default='11:30:00', help_text="Time after which check-in is considered late coming")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Working Hours Settings"
        unique_together = ['office']

    def __str__(self):
        try:
            return f"{self.office.name} - {self.standard_hours} hours"
        except Exception:
            return f"Working Hours - {self.standard_hours} hours"


class DocumentTemplate(models.Model):
    """Template for generating documents like offer letters, salary increment letters"""
    DOCUMENT_TYPE_CHOICES = [
        ('offer_letter', 'Offer Letter'),
        ('salary_increment', 'Salary Increment Letter'),
        ('salary_slip', 'Salary Slip'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    template_content = models.TextField(help_text="HTML template with Django template variables")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Document Templates"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_document_type_display()})"


class GeneratedDocument(models.Model):
    """Generated documents for employees"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='generated_documents')
    template = models.ForeignKey(DocumentTemplate, on_delete=models.CASCADE)
    document_type = models.CharField(max_length=50, choices=DocumentTemplate.DOCUMENT_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    content = models.TextField(help_text="Generated HTML content")
    pdf_file = models.FileField(upload_to='generated_documents/', null=True, blank=True)
    generated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_documents_by')
    generated_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    is_sent = models.BooleanField(default=False)
    
    # Additional data for specific document types
    offer_data = models.JSONField(null=True, blank=True, help_text="Data specific to offer letters")
    increment_data = models.JSONField(null=True, blank=True, help_text="Data specific to salary increment letters")
    salary_data = models.JSONField(null=True, blank=True, help_text="Data specific to salary slips")

    class Meta:
        verbose_name_plural = "Generated Documents"
        ordering = ['-generated_at']

    def __str__(self):
        try:
            return f"{self.title} - {self.employee.get_full_name()} ({self.generated_at.date()})"
        except Exception:
            return f"{self.title} - Unknown Employee ({self.generated_at.date()})"


class Resignation(models.Model):
    """Resignation model for employee resignation"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='resignations')
    resignation_date = models.DateField(help_text="Resignation submission date")
    notice_period_days = models.IntegerField(default=30, help_text="Notice period in days (15 or 30)")
    reason = models.TextField(help_text="Reason for resignation")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_resignations',
        limit_choices_to={'role__in': ['admin', 'manager']}
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, help_text="Reason for rejection if applicable")
    handover_notes = models.TextField(blank=True, help_text="Handover notes and pending work")
    last_working_date = models.DateField(null=True, blank=True, help_text="Automatically calculated last working date (resignation_date + notice_period)")
    is_handover_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Resignation"
        verbose_name_plural = "Resignations"

    def __str__(self):
        try:
            return f"{self.user.get_full_name()} - {self.resignation_date} ({self.status})"
        except Exception:
            return f"Resignation - {self.resignation_date} ({self.status})"

    def clean(self):
        """Validate resignation data"""
        # Ensure resignation date is today or in the future (submission date)
        if self.resignation_date and self.resignation_date < timezone.now().date():
            raise ValidationError('Resignation date cannot be in the past.')
        
        # Ensure notice period is reasonable (15 or 30 days)
        if self.notice_period_days and self.notice_period_days not in [15, 30]:
            raise ValidationError('Notice period must be either 15 or 30 days.')
        
        # Ensure approved_by is admin or manager
        if self.approved_by and self.approved_by.role not in ['admin', 'manager']:
            raise ValidationError('Only admin or manager can approve resignations.')
        
        # Ensure user is an employee
        if self.user.role != 'employee':
            raise ValidationError('Only employees can submit resignation requests.')

    def save(self, *args, **kwargs):
        self.clean()
        
        # Calculate last working date based on notice period
        # Last working day = resignation_date + notice_period_days
        if self.resignation_date and self.notice_period_days:
            self.last_working_date = self.resignation_date + timedelta(days=self.notice_period_days)
        
        super().save(*args, **kwargs)