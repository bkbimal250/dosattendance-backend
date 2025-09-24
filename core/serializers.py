from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
import uuid
from .models import (
    CustomUser, Office, Device, DeviceUser, Attendance, Leave, Document, 
    Notification, SystemSettings, AttendanceLog, ESSLAttendanceLog, 
    WorkingHoursSettings, DocumentTemplate, GeneratedDocument, Resignation,
    Department, Designation
)


class OfficeSerializer(serializers.ModelSerializer):
    """Serializer for Office model"""
    managers_data = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Office
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_managers_data(self, obj):
        """Get detailed information about managers"""
        return [
            {
                'id': manager.id,
                'name': manager.get_full_name(),
                'email': manager.email,
                'username': manager.username
            }
            for manager in obj.managers.all()
        ]

    def validate_managers(self, value):
        """Validate that managers are actually manager role and limit to 5"""
        if len(value) > 5:
            raise serializers.ValidationError('An office can have at most 5 managers.')
        
        for manager in value:
            if manager.role != 'manager':
                raise serializers.ValidationError(f'User {manager.get_full_name()} is not a manager.')
        
        return value

    def validate(self, attrs):
        """Validate office data"""
        # Validate that managers don't already manage too many offices
        if 'managers' in attrs:
            for manager in attrs['managers']:
                # Count how many offices this manager already manages (excluding current office)
                existing_offices_count = Office.objects.filter(managers=manager).exclude(
                    id=self.instance.id if self.instance else None
                ).count()
                
                if existing_offices_count >= 3:  # Allow managers to manage up to 3 offices
                    raise serializers.ValidationError(
                        f'Manager {manager.get_full_name()} is already managing {existing_offices_count} offices. '
                        'A manager can manage at most 3 offices.'
                    )
        
        return attrs


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model"""
    designations_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_designations_count(self, obj):
        """Get the number of designations in this department"""
        return obj.designations.count()


class DesignationSerializer(serializers.ModelSerializer):
    """Serializer for Designation model"""
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Designation
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class CustomUserSerializer(serializers.ModelSerializer):
    """Serializer for CustomUser model"""
    office_name = serializers.CharField(source='office.name', read_only=True)
    department_name = serializers.SerializerMethodField()
    designation_name = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'office', 'office_name', 'phone', 'address', 'date_of_birth',
            'gender', 'profile_picture', 'aadhaar_card', 'pan_card', 'employee_id', 'biometric_id', 'joining_date',
            'department', 'department_name', 'designation', 'designation_name', 'salary', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship',
            'account_holder_name', 'bank_name', 'account_number', 'ifsc_code', 'bank_branch_name',
            'is_active', 'last_login', 'created_at', 'updated_at', 'password'
        ]
        read_only_fields = ('id', 'last_login', 'created_at', 'updated_at')
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_department_name(self, obj):
        """Get department name from ForeignKey relationship"""
        try:
            if obj.department:
                return obj.department.name
        except:
            # Handle case where department was deleted but reference still exists
            pass
        return None
    
    def get_designation_name(self, obj):
        """Get designation name from ForeignKey relationship"""
        try:
            if obj.designation:
                return obj.designation.name
        except:
            # Handle case where designation was deleted but reference still exists
            pass
        return None

    def validate(self, attrs):
        """Validate user data"""
        # Ensure managers have an office assigned
        if attrs.get('role') == 'manager' and not attrs.get('office'):
            raise serializers.ValidationError('Managers must be assigned to an office.')
        
        # Ensure admins can have offices but it's not required
        if attrs.get('role') == 'admin':
            # Admin can have office but it's not required
            pass
        
        # Validate password if provided
        password = attrs.get('password')
        if password:
            if len(password) < 6:
                raise serializers.ValidationError({'password': 'Password must be at least 6 characters long.'})
        
        # Validate Aadhaar card number
        aadhaar_card = attrs.get('aadhaar_card')
        if aadhaar_card:
            aadhaar = aadhaar_card.replace(' ', '').replace('-', '')
            if not aadhaar.isdigit() or len(aadhaar) != 12:
                raise serializers.ValidationError({'aadhaar_card': 'Aadhaar card number must be exactly 12 digits.'})
        
        # Validate PAN card number
        pan_card = attrs.get('pan_card')
        if pan_card:
            pan = pan_card.upper().replace(' ', '')
            if len(pan) != 10:
                raise serializers.ValidationError({'pan_card': 'PAN card number must be exactly 10 characters.'})
            if not (pan[:5].isalpha() and pan[5:9].isdigit() and pan[9].isalpha()):
                raise serializers.ValidationError({'pan_card': 'PAN card number format should be: AAAAA9999A (5 letters, 4 digits, 1 letter).'})
        
        return attrs

    def create(self, validated_data):
        """Create a new user with hashed password"""
        password = validated_data.pop('password', None)
        user = CustomUser.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        """Update user with hashed password if provided"""
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name',
            'last_name', 'role', 'office', 'phone', 'employee_id', 'biometric_id'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Ensure managers have an office assigned
        if attrs.get('role') == 'manager' and not attrs.get('office'):
            raise serializers.ValidationError('Managers must be assigned to an office.')
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')

        return attrs


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for Device model"""
    office_name = serializers.CharField(source='office.name', read_only=True)
    total_users = serializers.SerializerMethodField()
    mapped_users = serializers.SerializerMethodField()
    
    class Meta:
        model = Device
        fields = '__all__'
        read_only_fields = ('id', 'last_sync', 'created_at', 'updated_at')
    
    def get_total_users(self, obj):
        """Get total number of users on this device"""
        return obj.device_users.count()
    
    def get_mapped_users(self, obj):
        """Get number of mapped users on this device"""
        return obj.device_users.filter(is_mapped=True).count()


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance model"""
    user = CustomUserSerializer(read_only=True)  # Include complete user object
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_employee_id = serializers.CharField(source='user.employee_id', read_only=True)
    user_office_name = serializers.CharField(source='user.office.name', read_only=True)
    device_name = serializers.CharField(source='device.name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('id', 'total_hours', 'day_status', 'is_late', 'late_minutes', 'created_at', 'updated_at')


class AttendanceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating attendance records"""
    class Meta:
        model = Attendance
        fields = ['user', 'date', 'check_in_time', 'check_out_time', 'status', 'day_status', 'device', 'notes']


class LeaveSerializer(serializers.ModelSerializer):
    """Serializer for Leave model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Leave
        fields = '__all__'
        read_only_fields = ('id', 'approved_at', 'created_at', 'updated_at')


class LeaveCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating leave requests"""
    class Meta:
        model = Leave
        fields = ['leave_type', 'start_date', 'end_date', 'reason']
    
    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if start_date and end_date:
            if start_date > end_date:
                raise serializers.ValidationError("End date must be after start date")
            
            # Calculate total days (inclusive of both start and end dates)
            delta = end_date - start_date
            attrs['total_days'] = delta.days + 1
        
        return attrs
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class LeaveApprovalSerializer(serializers.ModelSerializer):
    """Serializer for leave approval/rejection"""
    class Meta:
        model = Leave
        fields = ['status', 'rejection_reason']


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for Document model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_type = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    
    # Include full user objects
    user = CustomUserSerializer(read_only=True)
    uploaded_by = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'document_type', 'file', 'description', 
            'user', 'user_name', 'uploaded_by', 'uploaded_by_name',
            'created_at', 'updated_at', 'file_url', 'file_type', 'file_size'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_file_url(self, obj):
        """Get the full URL for the file"""
        try:
            if obj.file:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.file.url)
                return obj.file.url
        except (FileNotFoundError, OSError, ValueError):
            # File doesn't exist or can't be accessed
            return None
        return None
    
    def get_file_type(self, obj):
        """Get the file type from the filename"""
        try:
            if obj.file:
                return obj.file.name.split('.')[-1].lower() if '.' in obj.file.name else 'unknown'
        except (FileNotFoundError, OSError, ValueError, AttributeError):
            # File doesn't exist or can't be accessed
            return 'unknown'
        return None
    
    def get_file_size(self, obj):
        """Get the file size in bytes"""
        try:
            if obj.file and hasattr(obj.file, 'size'):
                return obj.file.size
        except (FileNotFoundError, OSError, ValueError):
            # File doesn't exist or can't be accessed
            return 0
        return 0


class DocumentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating documents"""
    class Meta:
        model = Document
        fields = ['title', 'document_type', 'file', 'description', 'user']
    
    def validate_user(self, value):
        """Validate that the user exists and is active"""
        if not value.is_active:
            raise serializers.ValidationError("Cannot upload documents for inactive users")
        return value
    
    def to_representation(self, instance):
        """Return full document data after creation"""
        return DocumentSerializer(instance, context=self.context).data


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for SystemSettings model"""
    class Meta:
        model = SystemSettings
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class AttendanceLogSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceLog model"""
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = AttendanceLog
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class ESSLAttendanceLogSerializer(serializers.ModelSerializer):
    """Serializer for ESSL attendance logs"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    device_name = serializers.CharField(source='device.name', read_only=True)
    
    class Meta:
        model = ESSLAttendanceLog
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class WorkingHoursSettingsSerializer(serializers.ModelSerializer):
    """Serializer for working hours settings"""
    office_name = serializers.CharField(source='office.name', read_only=True)
    
    class Meta:
        model = WorkingHoursSettings
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class ESSLDeviceSyncSerializer(serializers.Serializer):
    """Serializer for ESSL device synchronization"""
    device_id = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    
    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError("Start date cannot be after end date")
        
        return attrs


class MonthlyAttendanceReportSerializer(serializers.Serializer):
    """Serializer for monthly attendance reports"""
    office_id = serializers.UUIDField(required=False)
    year = serializers.IntegerField()
    month = serializers.IntegerField(min_value=1, max_value=12)
    
    def validate(self, attrs):
        year = attrs.get('year')
        month = attrs.get('month')
        
        if year < 2020 or year > 2030:
            raise serializers.ValidationError("Invalid year")
        
        return attrs


# Dashboard Statistics Serializers
class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_employees = serializers.IntegerField()
    total_managers = serializers.IntegerField()
    total_offices = serializers.IntegerField()
    total_devices = serializers.IntegerField()
    active_devices = serializers.IntegerField()
    today_attendance = serializers.IntegerField()
    total_today_records = serializers.IntegerField()
    attendance_rate = serializers.FloatField()
    pending_leaves = serializers.IntegerField()
    approved_leaves = serializers.IntegerField()
    total_leaves = serializers.IntegerField()
    leave_approval_rate = serializers.FloatField()
    active_users = serializers.IntegerField()
    inactive_users = serializers.IntegerField(required=False)
    total_users = serializers.IntegerField()
    employee_growth = serializers.FloatField(required=False)
    user_activation_rate = serializers.FloatField()


class OfficeStatsSerializer(serializers.Serializer):
    """Serializer for office-specific statistics"""
    office_id = serializers.UUIDField()
    office_name = serializers.CharField()
    total_employees = serializers.IntegerField()
    present_today = serializers.IntegerField()
    absent_today = serializers.IntegerField()
    pending_leaves = serializers.IntegerField()


class AttendanceReportSerializer(serializers.Serializer):
    """Serializer for attendance reports"""
    user_id = serializers.UUIDField()
    user_name = serializers.CharField()
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    total_hours = serializers.DecimalField(max_digits=6, decimal_places=2)
    attendance_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates"""
    department_name = serializers.SerializerMethodField()
    designation_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            # Basic Information
            'first_name', 'last_name', 'email', 'phone', 'address', 
            'date_of_birth', 'gender', 'profile_picture',
            
            # Government ID Information
            'aadhaar_card', 'pan_card',
            
            # Employment Information (non-sensitive)
            'employee_id', 'biometric_id', 'joining_date', 
            'department', 'department_name', 'designation', 'designation_name', 'salary',
            
            # Emergency Contact
            'emergency_contact_name', 'emergency_contact_phone', 
            'emergency_contact_relationship',
            
            # Bank Details
            'account_holder_name', 'bank_name', 'account_number', 
            'ifsc_code', 'bank_branch_name'
        ]
        read_only_fields = [
            'id', 'username', 'role', 'office', 'is_active', 
            'last_login', 'created_at', 'updated_at'
        ]
    
    def validate_salary(self, value):
        """Validate and convert salary field"""
        if value is None or value == '':
            return None
        try:
            # Convert to decimal if it's a string or float
            if isinstance(value, str):
                value = value.strip()
                if value == '':
                    return None
                value = float(value)
            if isinstance(value, (int, float)):
                if value < 0:
                    raise serializers.ValidationError("Salary cannot be negative")
                return value
        except (ValueError, TypeError):
            raise serializers.ValidationError("Invalid salary format")
        return value
    
    def validate_joining_date(self, value):
        """Validate joining date field"""
        if value is None or value == '':
            return None
        # Django will handle date parsing automatically
        return value
    
    def validate_date_of_birth(self, value):
        """Validate date of birth field"""
        if value is None or value == '':
            return None
        # Django will handle date parsing automatically
        return value
    
    def get_department_name(self, obj):
        """Get department name from ForeignKey relationship"""
        try:
            if obj.department:
                return obj.department.name
        except:
            # Handle case where department was deleted but reference still exists
            pass
        return None
    
    def get_designation_name(self, obj):
        """Get designation name from ForeignKey relationship"""
        try:
            if obj.designation:
                return obj.designation.name
        except:
            # Handle case where designation was deleted but reference still exists
            pass
        return None


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    confirm_password = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs


class BulkAttendanceSerializer(serializers.Serializer):
    """Serializer for bulk attendance operations"""
    user_ids = serializers.ListField(child=serializers.UUIDField())
    date = serializers.DateField()
    status = serializers.ChoiceField(choices=Attendance.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)


class DeviceSyncSerializer(serializers.Serializer):
    """Serializer for device synchronization"""
    device_id = serializers.UUIDField(required=False)  # Optional since it's in URL
    sync_type = serializers.ChoiceField(choices=[
        ('attendance', 'Attendance Data'),
        ('users', 'User Data'),
        ('both', 'Both')
    ])
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    
    def validate(self, attrs):
        """Validate sync data"""
        # If device_id is provided, ensure it's a valid UUID
        if 'device_id' in attrs:
            try:
                uuid.UUID(str(attrs['device_id']))
            except ValueError:
                raise serializers.ValidationError("Invalid device_id format")
        
        # Validate date range if both dates are provided
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError("Start date cannot be after end date")
        
        return attrs


class DocumentTemplateSerializer(serializers.ModelSerializer):
    """Serializer for DocumentTemplate model"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'document_type', 'template_content', 'is_active',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GeneratedDocumentSerializer(serializers.ModelSerializer):
    """Serializer for GeneratedDocument model"""
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_email = serializers.CharField(source='employee.email', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = GeneratedDocument
        fields = [
            'id', 'employee', 'employee_name', 'employee_email', 'template', 'template_name',
            'document_type', 'title', 'content', 'pdf_file', 'generated_by', 'generated_by_name',
            'generated_at', 'sent_at', 'is_sent', 'offer_data', 'increment_data', 'salary_data'
        ]
        read_only_fields = ['id', 'generated_at']


class DocumentGenerationSerializer(serializers.Serializer):
    """Serializer for document generation requests"""
    employee_id = serializers.UUIDField()
    document_type = serializers.ChoiceField(choices=DocumentTemplate.DOCUMENT_TYPE_CHOICES)
    template_id = serializers.UUIDField(required=False)
    
    # Offer letter specific fields
    position = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateField(required=False)
    starting_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    # Salary increment specific fields
    previous_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    increment_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    new_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    effective_date = serializers.DateField(required=False)
    
    # Salary slip specific fields
    salary_month = serializers.CharField(required=False, allow_blank=True)
    salary_year = serializers.CharField(required=False, allow_blank=True)
    basic_salary = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    extra_days_pay = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    # Common fields
    custom_message = serializers.CharField(required=False, allow_blank=True)
    send_email = serializers.BooleanField(default=True)
    
    def validate(self, attrs):
        document_type = attrs.get('document_type')
        
        if document_type == 'offer_letter':
            if not attrs.get('position'):
                raise serializers.ValidationError("Position is required for offer letters")
            if not attrs.get('start_date'):
                raise serializers.ValidationError("Start date is required for offer letters")
            if not attrs.get('starting_salary'):
                raise serializers.ValidationError("Starting salary is required for offer letters")
                
        elif document_type == 'salary_increment':
            if not attrs.get('previous_salary'):
                raise serializers.ValidationError("Previous salary is required for salary increment letters")
            if not attrs.get('new_salary'):
                raise serializers.ValidationError("New salary is required for salary increment letters")
            if not attrs.get('effective_date'):
                raise serializers.ValidationError("Effective date is required for salary increment letters")
        
        return attrs


class ResignationSerializer(serializers.ModelSerializer):
    """Serializer for Resignation model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_employee_id = serializers.CharField(source='user.employee_id', read_only=True)
    user_office_name = serializers.CharField(source='user.office.name', read_only=True)
    user_department = serializers.SerializerMethodField()
    user_designation = serializers.SerializerMethodField()
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Resignation
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_employee_id', 
            'user_office_name', 'user_department', 'user_designation', 'resignation_date', 
            'notice_period_days', 'reason', 'status', 'approved_by', 
            'approved_by_name', 'approved_at', 'rejection_reason', 
            'handover_notes', 'last_working_date', 'is_handover_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'approved_at', 'created_at', 'updated_at', 'last_working_date')
    
    def get_user_department(self, obj):
        """Get user department name - handle both CharField and ForeignKey"""
        if hasattr(obj.user, 'department') and obj.user.department:
            if hasattr(obj.user.department, 'name'):
                return obj.user.department.name  # ForeignKey
            else:
                return obj.user.department  # CharField
        return None
    
    def get_user_designation(self, obj):
        """Get user designation name - handle both CharField and ForeignKey"""
        if hasattr(obj.user, 'designation') and obj.user.designation:
            if hasattr(obj.user.designation, 'name'):
                return obj.user.designation.name  # ForeignKey
            else:
                return obj.user.designation  # CharField
        return None


class ResignationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating resignation requests"""
    class Meta:
        model = Resignation
        fields = ['resignation_date', 'notice_period_days', 'reason', 'handover_notes']
    
    def validate_resignation_date(self, value):
        """Validate resignation date"""
        from django.utils import timezone
        if value < timezone.now().date():
            raise serializers.ValidationError("Resignation date cannot be in the past.")
        return value
    
    def validate_notice_period_days(self, value):
        """Validate notice period"""
        if value not in [15, 30]:
            raise serializers.ValidationError("Notice period must be either 15 or 30 days.")
        return value
    
    def create(self, validated_data):
        """Create resignation request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ResignationApprovalSerializer(serializers.ModelSerializer):
    """Serializer for resignation approval/rejection"""
    class Meta:
        model = Resignation
        fields = ['status', 'rejection_reason', 'handover_notes', 'is_handover_completed']
    
    def validate_status(self, value):
        """Validate status change"""
        if value not in ['approved', 'rejected']:
            raise serializers.ValidationError("Status must be either 'approved' or 'rejected'.")
        return value
    
    def validate(self, attrs):
        """Validate approval data"""
        status = attrs.get('status')
        rejection_reason = attrs.get('rejection_reason', '')
        
        if status == 'rejected' and not rejection_reason:
            raise serializers.ValidationError("Rejection reason is required when rejecting a resignation.")
        
        return attrs


class DeviceUserSerializer(serializers.ModelSerializer):
    """Serializer for DeviceUser model"""
    device_name = serializers.CharField(source='device.name', read_only=True)
    device_type = serializers.CharField(source='device.device_type', read_only=True)
    system_user_name = serializers.SerializerMethodField()
    system_user_email = serializers.CharField(source='system_user.email', read_only=True)
    system_user_employee_id = serializers.CharField(source='system_user.employee_id', read_only=True)
    
    class Meta:
        model = DeviceUser
        fields = [
            'id', 'device', 'device_name', 'device_type', 'device_user_id', 'device_user_name',
            'device_user_privilege', 'device_user_password', 'device_user_group', 'device_user_card',
            'system_user', 'system_user_name', 'system_user_email', 'system_user_employee_id',
            'is_mapped', 'mapping_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_system_user_name(self, obj):
        """Get system user full name"""
        if obj.system_user:
            return obj.system_user.get_full_name()
        return None
    
    def validate(self, attrs):
        """Validate device user data"""
        device = attrs.get('device')
        device_user_id = attrs.get('device_user_id')
        
        # Check for duplicate device_user_id within the same device
        if device and device_user_id:
            queryset = DeviceUser.objects.filter(device=device, device_user_id=device_user_id)
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    'device_user_id': 'A user with this ID already exists on this device.'
                })
        
        return attrs


class DeviceUserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DeviceUser records"""
    class Meta:
        model = DeviceUser
        fields = [
            'device', 'device_user_id', 'device_user_name', 'device_user_privilege',
            'device_user_password', 'device_user_group', 'device_user_card',
            'system_user', 'is_mapped', 'mapping_notes'
        ]
    
    def validate(self, attrs):
        """Validate device user creation data"""
        device = attrs.get('device')
        device_user_id = attrs.get('device_user_id')
        
        # Check for duplicate device_user_id within the same device
        if device and device_user_id:
            if DeviceUser.objects.filter(device=device, device_user_id=device_user_id).exists():
                raise serializers.ValidationError({
                    'device_user_id': 'A user with this ID already exists on this device.'
                })
        
        return attrs


class DeviceUserMappingSerializer(serializers.ModelSerializer):
    """Serializer for mapping device users to system users"""
    class Meta:
        model = DeviceUser
        fields = ['system_user', 'is_mapped', 'mapping_notes']
    
    def validate(self, attrs):
        """Validate mapping data"""
        system_user = attrs.get('system_user')
        is_mapped = attrs.get('is_mapped', False)
        
        if is_mapped and not system_user:
            raise serializers.ValidationError({
                'system_user': 'System user is required when mapping is enabled.'
            })
        
        return attrs


class DeviceUserBulkCreateSerializer(serializers.Serializer):
    """Serializer for bulk creating device users"""
    device = serializers.UUIDField()
    device_users = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_device_users(self, value):
        """Validate device users list"""
        if not value:
            raise serializers.ValidationError("Device users list cannot be empty.")
        
        # Check for duplicate device_user_ids in the list
        device_user_ids = [user.get('device_user_id') for user in value if user.get('device_user_id')]
        if len(device_user_ids) != len(set(device_user_ids)):
            raise serializers.ValidationError("Duplicate device_user_id found in the list.")
        
        return value
    
    def validate(self, attrs):
        """Validate bulk creation data"""
        device_id = attrs.get('device')
        device_users = attrs.get('device_users', [])
        
        if device_id:
            # Check for existing device_user_ids on the device
            existing_ids = set(
                DeviceUser.objects.filter(device_id=device_id)
                .values_list('device_user_id', flat=True)
            )
            
            new_ids = set(user.get('device_user_id') for user in device_users if user.get('device_user_id'))
            conflicts = existing_ids.intersection(new_ids)
            
            if conflicts:
                raise serializers.ValidationError({
                    'device_users': f'Device user IDs already exist on this device: {", ".join(conflicts)}'
                })
        
        return attrs
