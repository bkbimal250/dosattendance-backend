from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import (
    CustomUser, Office, Device, Attendance, Leave, Document, 
    Notification, SystemSettings, AttendanceLog, ESSLAttendanceLog, 
    WorkingHoursSettings
)


class OfficeSerializer(serializers.ModelSerializer):
    """Serializer for Office model"""
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    manager_email = serializers.CharField(source='manager.email', read_only=True)
    
    class Meta:
        model = Office
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_manager(self, value):
        """Validate that the assigned manager is actually a manager role"""
        if value and value.role != 'manager':
            raise serializers.ValidationError('Only users with manager role can be assigned as office managers.')
        return value

    def validate(self, attrs):
        """Validate office data"""
        # If a manager is being assigned, ensure they don't already manage another office
        if 'manager' in attrs and attrs['manager']:
            existing_office = Office.objects.filter(manager=attrs['manager']).exclude(id=self.instance.id if self.instance else None).first()
            if existing_office:
                raise serializers.ValidationError(f'Manager {attrs["manager"].get_full_name()} is already assigned to office {existing_office.name}.')
        
        return attrs


class CustomUserSerializer(serializers.ModelSerializer):
    """Serializer for CustomUser model"""
    office_name = serializers.CharField(source='office.name', read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'office', 'office_name', 'phone', 'address', 'date_of_birth',
            'gender', 'profile_picture', 'employee_id', 'biometric_id', 'joining_date',
            'department', 'designation', 'salary', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship',
            'account_holder_name', 'bank_name', 'account_number', 'ifsc_code', 'bank_branch_name',
            'is_active', 'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'last_login', 'created_at', 'updated_at')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_full_name(self, obj):
        return obj.get_full_name()

    def validate(self, attrs):
        """Validate user data"""
        # Ensure managers have an office assigned
        if attrs.get('role') == 'manager' and not attrs.get('office'):
            raise serializers.ValidationError('Managers must be assigned to an office.')
        
        # Ensure admins can have offices but it's not required
        if attrs.get('role') == 'admin':
            # Admin can have office but it's not required
            pass
        
        return attrs


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
    
    class Meta:
        model = Device
        fields = '__all__'
        read_only_fields = ('id', 'last_sync', 'created_at', 'updated_at')


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
        read_only_fields = ('id', 'total_hours', 'created_at', 'updated_at')


class AttendanceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating attendance records"""
    class Meta:
        model = Attendance
        fields = ['user', 'date', 'check_in_time', 'check_out_time', 'status', 'device', 'notes']


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
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_type(self, obj):
        """Get the file type from the filename"""
        if obj.file:
            return obj.file.name.split('.')[-1].lower() if '.' in obj.file.name else 'unknown'
        return None
    
    def get_file_size(self, obj):
        """Get the file size in bytes"""
        if obj.file and hasattr(obj.file, 'size'):
            return obj.file.size
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
    class Meta:
        model = CustomUser
        fields = [
            'first_name', 'last_name', 'phone', 'address', 'date_of_birth',
            'gender', 'profile_picture', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship'
        ]


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
    device_id = serializers.UUIDField()
    sync_type = serializers.ChoiceField(choices=[
        ('attendance', 'Attendance Data'),
        ('users', 'User Data'),
        ('both', 'Both')
    ])
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
