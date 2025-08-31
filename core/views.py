from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, filters, viewsets, permissions, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.db import models
from datetime import datetime, timedelta
import logging

from .models import (
    CustomUser, Office, Device, Attendance, WorkingHoursSettings, 
    ESSLAttendanceLog, Leave, Document, Notification, SystemSettings
)
from .serializers import (
    CustomUserSerializer, OfficeSerializer, DeviceSerializer, AttendanceSerializer,
    AttendanceCreateSerializer, BulkAttendanceSerializer, WorkingHoursSettingsSerializer,
    ESSLAttendanceLogSerializer, LeaveSerializer, LeaveCreateSerializer, LeaveApprovalSerializer,
    DocumentSerializer, DocumentCreateSerializer, NotificationSerializer, SystemSettingsSerializer,
    UserRegistrationSerializer, UserProfileSerializer, PasswordChangeSerializer,
    DashboardStatsSerializer, AttendanceLogSerializer, OfficeStatsSerializer,
    UserLoginSerializer, DeviceSyncSerializer
)
# Permissions are defined inline in this file
from .zkteco_service import zkteco_service
from .db_manager import DatabaseConnectionManager

logger = logging.getLogger(__name__)


class IsAdminUser(IsAuthenticated):
    """Permission to only allow admin users"""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_admin


class IsManagerUser(IsAuthenticated):
    """Permission to only allow manager users"""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_manager


class IsAdminOrManager(IsAuthenticated):
    """Permission to allow admin or manager users"""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and (
            request.user.is_admin or request.user.is_manager
        )


class ReportsViewSet(viewsets.ViewSet):
    """ViewSet for generating reports - Admin only"""
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def attendance(self, request):
        """Generate attendance report with filters"""
        try:
            # Get query parameters
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            office_id = request.query_params.get('office')
            user_id = request.query_params.get('user')
            status_filter = request.query_params.get('status')

            # Build query
            queryset = Attendance.objects.select_related('user', 'user__office')

            # Apply filters with proper date handling
            if start_date:
                try:
                    queryset = queryset.filter(date__gte=start_date)
                except Exception as e:
                    logger.warning(f"Invalid start_date format: {start_date}, error: {e}")
            
            if end_date:
                try:
                    queryset = queryset.filter(date__lte=end_date)
                except Exception as e:
                    logger.warning(f"Invalid end_date format: {end_date}, error: {e}")
            
            if office_id:
                queryset = queryset.filter(user__office_id=office_id)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            if status_filter:
                queryset = queryset.filter(status=status_filter)

            # Get data with safe date handling
            attendance_data = []
            for attendance in queryset:
                try:
                    data = {
                        'id': str(attendance.id),
                        'date': attendance.date.isoformat() if attendance.date else None,
                        'check_in_time': attendance.check_in_time.isoformat() if attendance.check_in_time else None,
                        'check_out_time': attendance.check_out_time.isoformat() if attendance.check_out_time else None,
                        'status': attendance.status,
                        'user__id': str(attendance.user.id) if attendance.user else None,
                        'user__first_name': attendance.user.first_name if attendance.user else None,
                        'user__last_name': attendance.user.last_name if attendance.user else None,
                        'user__employee_id': attendance.user.employee_id if attendance.user else None,
                        'user__office__name': attendance.user.office.name if attendance.user and attendance.user.office else None,
                    }
                    attendance_data.append(data)
                except Exception as e:
                    logger.warning(f"Error processing attendance record {attendance.id}: {e}")
                    continue

            # Calculate statistics
            total_records = len(attendance_data)
            present_count = sum(1 for a in attendance_data if a['status'] == 'present')
            absent_count = sum(1 for a in attendance_data if a['status'] == 'absent')
            late_count = sum(1 for a in attendance_data if a['status'] == 'late')
            attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0

            # Group by date with safe date handling
            daily_stats = {}
            for record in attendance_data:
                try:
                    date = record['date']
                    if date:
                        # Extract just the date part if it's a full datetime string
                        if 'T' in date:
                            date = date.split('T')[0]
                        
                        if date not in daily_stats:
                            daily_stats[date] = {'present': 0, 'absent': 0, 'late': 0, 'total': 0}
                        daily_stats[date][record['status']] += 1
                        daily_stats[date]['total'] += 1
                except Exception as e:
                    logger.warning(f"Error processing date for record: {e}")
                    continue

            # Convert to list format
            daily_stats_list = []
            for date, stats in daily_stats.items():
                try:
                    rate = (stats['present'] / stats['total'] * 100) if stats['total'] > 0 else 0
                    daily_stats_list.append({
                        'date': date,
                        'present': stats['present'],
                        'absent': stats['absent'],
                        'late': stats['late'],
                        'total': stats['total'],
                        'rate': round(rate, 2)
                    })
                except Exception as e:
                    logger.warning(f"Error calculating stats for date {date}: {e}")
                    continue

            # Sort by date
            daily_stats_list.sort(key=lambda x: x['date'])

            return Response({
                'type': 'attendance',
                'summary': {
                    'totalRecords': total_records,
                    'presentCount': present_count,
                    'absentCount': absent_count,
                    'lateCount': late_count,
                    'attendanceRate': round(attendance_rate, 2)
                },
                'dailyStats': daily_stats_list,
                'rawData': attendance_data
            })

        except Exception as e:
            logger.error(f"Error generating attendance report: {str(e)}")
            return Response(
                {'error': f'Failed to generate attendance report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def leave(self, request):
        """Generate leave report with filters"""
        try:
            # Get query parameters
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            office_id = request.query_params.get('office')
            user_id = request.query_params.get('user')
            status_filter = request.query_params.get('status')

            # Build query
            queryset = Leave.objects.select_related('user', 'user__office')

            # Apply filters with proper date handling
            if start_date:
                try:
                    queryset = queryset.filter(start_date__gte=start_date)
                except Exception as e:
                    logger.warning(f"Invalid start_date format: {start_date}, error: {e}")
            
            if end_date:
                try:
                    queryset = queryset.filter(end_date__lte=end_date)
                except Exception as e:
                    logger.warning(f"Invalid end_date format: {end_date}, error: {e}")
            
            if office_id:
                queryset = queryset.filter(user__office_id=office_id)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            if status_filter:
                queryset = queryset.filter(status=status_filter)

            # Get data with safe date handling
            leave_data = []
            for leave in queryset:
                try:
                    data = {
                        'id': str(leave.id),
                        'leave_type': leave.leave_type,
                        'start_date': leave.start_date.isoformat() if leave.start_date else None,
                        'end_date': leave.end_date.isoformat() if leave.end_date else None,
                        'status': leave.status,
                        'reason': leave.reason,
                        'applied_at': leave.created_at.isoformat() if leave.created_at else None,
                        'approved_at': leave.approved_at.isoformat() if leave.approved_at else None,
                        'approved_by__first_name': leave.approved_by.first_name if leave.approved_by else None,
                        'approved_by__last_name': leave.approved_by.last_name if leave.approved_by else None,
                        'user__id': str(leave.user.id) if leave.user else None,
                        'user__first_name': leave.user.first_name if leave.user else None,
                        'user__last_name': leave.user.last_name if leave.user else None,
                        'user__employee_id': leave.user.employee_id if leave.user else None,
                        'user__office__name': leave.user.office.name if leave.user and leave.user.office else None,
                    }
                    leave_data.append(data)
                except Exception as e:
                    logger.warning(f"Error processing leave record {leave.id}: {e}")
                    continue

            # Calculate statistics
            total_leaves = len(leave_data)
            approved_leaves = sum(1 for l in leave_data if l['status'] == 'approved')
            pending_leaves = sum(1 for l in leave_data if l['status'] == 'pending')
            rejected_leaves = sum(1 for l in leave_data if l['status'] == 'rejected')
            approval_rate = (approved_leaves / total_leaves * 100) if total_leaves > 0 else 0

            # Group by leave type
            leave_type_stats = {}
            for record in leave_data:
                try:
                    leave_type = record['leave_type']
                    if leave_type not in leave_type_stats:
                        leave_type_stats[leave_type] = {'approved': 0, 'pending': 0, 'rejected': 0, 'total': 0}
                    leave_type_stats[leave_type][record['status']] += 1
                    leave_type_stats[leave_type]['total'] += 1
                except Exception as e:
                    logger.warning(f"Error processing leave type for record: {e}")
                    continue

            # Convert to list format
            leave_type_list = []
            for leave_type, stats in leave_type_stats.items():
                try:
                    leave_type_list.append({
                        'type': leave_type,
                        'approved': stats['approved'],
                        'pending': stats['pending'],
                        'rejected': stats['rejected'],
                        'total': stats['total']
                    })
                except Exception as e:
                    logger.warning(f"Error creating leave type stats for {leave_type}: {e}")
                    continue

            return Response({
                'type': 'leave',
                'summary': {
                    'totalLeaves': total_leaves,
                    'approvedLeaves': approved_leaves,
                    'pendingLeaves': pending_leaves,
                    'rejectedLeaves': rejected_leaves,
                    'approvalRate': round(approval_rate, 2)
                },
                'leaveTypeStats': leave_type_list,
                'rawData': leave_data
            })

        except Exception as e:
            logger.error(f"Error generating leave report: {str(e)}")
            return Response(
                {'error': f'Failed to generate leave report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def office(self, request):
        """Generate office report"""
        try:
            # Get all offices with related data
            offices = Office.objects.prefetch_related('customuser_set').all()
            
            # Get all users for statistics
            all_users = CustomUser.objects.select_related('office').all()

            # Calculate office statistics
            office_stats = []
            for office in offices:
                try:
                    office_users = [u for u in all_users if u.office_id == office.id]
                    employees = sum(1 for u in office_users if u.role == 'employee')
                    managers = sum(1 for u in office_users if u.role == 'manager')
                    active_users = sum(1 for u in office_users if u.is_active)

                    office_stats.append({
                        'id': str(office.id),
                        'name': office.name,
                        'employees': employees,
                        'managers': managers,
                        'activeUsers': active_users,
                        'totalUsers': len(office_users),
                        'manager': f"{office.manager.first_name} {office.manager.last_name}" if office.manager else 'Not assigned'
                    })
                except Exception as e:
                    logger.warning(f"Error processing office {office.id}: {e}")
                    continue

            # Calculate summary statistics
            total_offices = len(offices)
            total_employees = sum(1 for u in all_users if u.role == 'employee')
            total_managers = sum(1 for u in all_users if u.role == 'manager')
            total_users = len(all_users)

            return Response({
                'type': 'office',
                'summary': {
                    'totalOffices': total_offices,
                    'totalEmployees': total_employees,
                    'totalManagers': total_managers,
                    'totalUsers': total_users
                },
                'officeStats': office_stats,
                'rawData': list(offices.values())
            })

        except Exception as e:
            logger.error(f"Error generating office report: {str(e)}")
            return Response(
                {'error': f'Failed to generate office report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def user(self, request):
        """Generate user report"""
        try:
            # Get all users
            users = CustomUser.objects.select_related('office').all()

            # Calculate user statistics
            role_stats = {}
            office_stats = {}
            active_users = sum(1 for u in users if u.is_active)
            inactive_users = sum(1 for u in users if not u.is_active)

            for user in users:
                try:
                    # Role statistics
                    if user.role not in role_stats:
                        role_stats[user.role] = {'active': 0, 'inactive': 0, 'total': 0}
                    role_stats[user.role]['total'] += 1
                    if user.is_active:
                        role_stats[user.role]['active'] += 1
                    else:
                        role_stats[user.role]['inactive'] += 1

                    # Office statistics
                    office_name = user.office.name if user.office else 'No Office'
                    if office_name not in office_stats:
                        office_stats[office_name] = {'active': 0, 'inactive': 0, 'total': 0}
                    office_stats[office_name]['total'] += 1
                    if user.is_active:
                        office_stats[office_name]['active'] += 1
                    else:
                        office_stats[office_name]['inactive'] += 1
                except Exception as e:
                    logger.warning(f"Error processing user {user.id}: {e}")
                    continue

            # Convert to list format
            role_stats_list = []
            for role, stats in role_stats.items():
                try:
                    role_stats_list.append({
                        'role': role,
                        'active': stats['active'],
                        'inactive': stats['inactive'],
                        'total': stats['total']
                    })
                except Exception as e:
                    logger.warning(f"Error creating role stats for {role}: {e}")
                    continue

            office_stats_list = []
            for office, stats in office_stats.items():
                try:
                    office_stats_list.append({
                        'office': office,
                        'active': stats['active'],
                        'inactive': stats['inactive'],
                        'total': stats['total']
                    })
                except Exception as e:
                    logger.warning(f"Error creating office stats for {office}: {e}")
                    continue

            activation_rate = (active_users / len(users) * 100) if users else 0

            return Response({
                'type': 'user',
                'summary': {
                    'totalUsers': len(users),
                    'activeUsers': active_users,
                    'inactiveUsers': inactive_users,
                    'activationRate': round(activation_rate, 2)
                },
                'roleStats': role_stats_list,
                'officeStats': office_stats_list,
                'rawData': list(users.values())
            })

        except Exception as e:
            logger.error(f"Error generating user report: {str(e)}")
            return Response(
                {'error': f'Failed to generate user report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export report data"""
        try:
            report_type = request.query_params.get('type', 'attendance')
            
            # Generate the appropriate report
            if report_type == 'attendance':
                response = self.attendance(request)
            elif report_type == 'leave':
                response = self.leave(request)
            elif report_type == 'office':
                response = self.office(request)
            elif report_type == 'user':
                response = self.user(request)
            else:
                return Response(
                    {'error': f'Invalid report type: {report_type}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Return the report data for export
            return response

        except Exception as e:
            logger.error(f"Error exporting report: {str(e)}")
            return Response(
                {'error': f'Failed to export report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OfficeViewSet(viewsets.ModelViewSet):
    """ViewSet for Office model"""
    queryset = Office.objects.all()
    serializer_class = OfficeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'address', 'email']
    ordering_fields = ['name', 'created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]  # Only admin can modify offices
        return [permissions.IsAuthenticated()]  # Anyone authenticated can read offices

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get office-specific statistics"""
        office = self.get_object()
        
        stats = {
            'office_id': office.id,
            'office_name': office.name,
            'total_employees': CustomUser.objects.filter(office=office, role='employee').count(),
            'present_today': Attendance.objects.filter(
                user__office=office, 
                date=timezone.now().date(), 
                status='present'
            ).count(),
            'absent_today': Attendance.objects.filter(
                user__office=office, 
                date=timezone.now().date(), 
                status='absent'
            ).count(),
            'pending_leaves': Leave.objects.filter(
                user__office=office, 
                status='pending'
            ).count(),
        }
        
        serializer = OfficeStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def debug_users(self, request, pk=None):
        """Debug endpoint to see users assigned to this office"""
        office = self.get_object()
        
        all_users = CustomUser.objects.filter(office=office)
        managers = CustomUser.objects.filter(office=office, role='manager')
        employees = CustomUser.objects.filter(office=office, role='employee')
        
        debug_data = {
            'office_id': str(office.id),
            'office_name': office.name,
            'total_users': all_users.count(),
            'managers_count': managers.count(),
            'employees_count': employees.count(),
            'managers': [
                {
                    'id': str(user.id),
                    'name': user.get_full_name(),
                    'email': user.email,
                    'role': user.role
                } for user in managers
            ],
            'employees': [
                {
                    'id': str(user.id),
                    'name': user.get_full_name(),
                    'email': user.email,
                    'role': user.role
                } for user in employees
            ]
        }
        
        return Response(debug_data)


class CustomUserViewSet(viewsets.ModelViewSet):
    """ViewSet for CustomUser model"""
    serializer_class = CustomUserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email', 'employee_id']
    ordering_fields = ['username', 'first_name', 'last_name', 'created_at']
    
    def get_pagination_class(self):
        """Disable pagination for list action to show all users"""
        if self.action == 'list':
            return None
        return super().get_pagination_class()
    
    def list(self, request, *args, **kwargs):
        """Override list method to ensure all users are returned without pagination"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return CustomUser.objects.all()
        elif user.is_manager:
            return CustomUser.objects.filter(office=user.office)
        else:
            return CustomUser.objects.filter(id=user.id)

    def get_permissions(self):
        if self.action in ['login', 'register']:
            return [permissions.AllowAny()]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def register(self, request):
        """User registration endpoint"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': CustomUserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        """User login endpoint with role-based dashboard access"""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            dashboard_type = request.data.get('dashboard_type', '').lower()
            
            # Validate dashboard access based on user role
            if dashboard_type == 'admin' and user.role != 'admin':
                return Response({
                    'error': 'Access denied. Admin dashboard is only for admin users.'
                }, status=status.HTTP_403_FORBIDDEN)
            elif dashboard_type == 'manager' and user.role != 'manager':
                return Response({
                    'error': 'Access denied. Manager dashboard is only for manager users.'
                }, status=status.HTTP_403_FORBIDDEN)
            elif dashboard_type == 'employee' and user.role != 'employee':
                return Response({
                    'error': 'Access denied. Employee dashboard is only for employee users.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': CustomUserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get current user profile"""
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile (alias for profile)"""
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def debug_auth(self, request):
        """Debug endpoint to test authentication"""
        return Response({
            'authenticated': request.user.is_authenticated,
            'user_id': str(request.user.id) if request.user.is_authenticated else None,
            'username': request.user.username if request.user.is_authenticated else None,
            'role': request.user.role if request.user.is_authenticated else None,
            'auth_header': request.headers.get('Authorization'),
            'http_auth_header': request.META.get('HTTP_AUTHORIZATION'),
            'all_headers': dict(request.headers),
            'all_meta': {k: v for k, v in request.META.items() if k.startswith('HTTP_')}
        })

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password"""
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'error': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def count(self, request):
        """Get user count for debugging"""
        queryset = self.get_queryset()
        total_count = queryset.count()
        office_counts = {}
        
        for office in Office.objects.all():
            office_counts[office.name] = queryset.filter(office=office).count()
        
        no_office_count = queryset.filter(office__isnull=True).count()
        
        return Response({
            'total_users': total_count,
            'office_counts': office_counts,
            'no_office_count': no_office_count,
            'user_ids': list(queryset.values_list('id', flat=True))
        })

    @action(detail=False, methods=['get'])
    def debug_assignments(self, request):
        """Debug endpoint to see all users and their office assignments"""
        user = request.user
        if not user.is_admin:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        all_users = CustomUser.objects.all().select_related('office')
        debug_data = {
            'total_users': all_users.count(),
            'users_with_office': all_users.filter(office__isnull=False).count(),
            'users_without_office': all_users.filter(office__isnull=True).count(),
            'users_by_office': {}
        }
        
        for user_obj in all_users:
            office_name = user_obj.office.name if user_obj.office else 'No Office'
            if office_name not in debug_data['users_by_office']:
                debug_data['users_by_office'][office_name] = {
                    'managers': [],
                    'employees': [],
                    'admins': []
                }
            
            user_info = {
                'id': str(user_obj.id),
                'name': user_obj.get_full_name(),
                'email': user_obj.email,
                'role': user_obj.role
            }
            
            if user_obj.role == 'manager':
                debug_data['users_by_office'][office_name]['managers'].append(user_info)
            elif user_obj.role == 'employee':
                debug_data['users_by_office'][office_name]['employees'].append(user_info)
            elif user_obj.role == 'admin':
                debug_data['users_by_office'][office_name]['admins'].append(user_info)
        
        return Response(debug_data)

    @action(detail=False, methods=['get'])
    def debug_auth(self, request):
        """Debug endpoint to test authentication"""
        return Response({
            'authenticated': request.user.is_authenticated,
            'user_id': str(request.user.id) if request.user.is_authenticated else None,
            'username': request.user.username if request.user.is_authenticated else None,
            'role': request.user.role if request.user.is_authenticated else None,
            'auth_header': request.headers.get('Authorization'),
            'http_auth_header': request.META.get('HTTP_AUTHORIZATION'),
            'all_headers': dict(request.headers),
            'all_meta': {k: v for k, v in request.META.items() if k.startswith('HTTP_')}
        })


class DeviceViewSet(viewsets.ModelViewSet):
    """ViewSet for Device model"""
    serializer_class = DeviceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'ip_address', 'serial_number']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Device.objects.all()
        elif user.is_manager:
            return Device.objects.filter(office=user.office)
        else:
            return Device.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]  # Only admin can modify devices
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def sync(self, request, pk=None):
        """Sync device data"""
        device = self.get_object()
        serializer = DeviceSyncSerializer(data=request.data)
        if serializer.is_valid():
            # TODO: Implement device synchronization logic
            device.last_sync = timezone.now()
            device.save()
            return Response({'message': 'Device sync initiated'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance model"""
    serializer_class = AttendanceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'notes']
    ordering_fields = ['date', 'check_in_time', 'check_out_time']
    pagination_class = None  # Disable pagination for attendance data

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Attendance.objects.select_related('user', 'user__office', 'device').all()
        elif user.is_manager:
            return Attendance.objects.select_related('user', 'user__office', 'device').filter(user__office=user.office)
        else:
            return Attendance.objects.select_related('user', 'user__office', 'device').filter(user=user)

    def list(self, request, *args, **kwargs):
        """Override list method to limit data and prevent large responses"""
        queryset = self.get_queryset()
        
        # Apply filters from query parameters
        date = request.query_params.get('date')
        user_id = request.query_params.get('user')
        office_id = request.query_params.get('office')
        status = request.query_params.get('status')
        device_id = request.query_params.get('device')
        limit = request.query_params.get('limit', 100)  # Default limit of 100
        
        if date:
            queryset = queryset.filter(date=date)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if office_id:
            queryset = queryset.filter(user__office_id=office_id)
        if status:
            queryset = queryset.filter(status=status)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        
        # Apply limit to prevent large responses
        try:
            limit = int(limit)
            queryset = queryset[:limit]
        except (ValueError, TypeError):
            queryset = queryset[:100]  # Default to 100 if limit is invalid
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return AttendanceCreateSerializer
        return AttendanceSerializer

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create attendance records"""
        serializer = BulkAttendanceSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            attendances = []
            for user_id in data['user_ids']:
                user = get_object_or_404(CustomUser, id=user_id)
                attendance = Attendance(
                    user=user,
                    date=data['date'],
                    status=data['status'],
                    notes=data.get('notes', '')
                )
                attendances.append(attendance)
            
            Attendance.objects.bulk_create(attendances)
            return Response({'message': f'{len(attendances)} attendance records created'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's attendance with statistics"""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(date=today)
        
        # Calculate statistics
        total_records = queryset.count()
        present_records = queryset.filter(status='present').count()
        absent_records = queryset.filter(status='absent').count()
        late_records = queryset.filter(status='late').count()
        
        # Serialize attendance records
        serializer = self.get_serializer(queryset, many=True)
        
        # Prepare response with statistics
        response_data = {
            'date': today,
            'statistics': {
                'total_records': total_records,
                'present_records': present_records,
                'absent_records': absent_records,
                'late_records': late_records,
                'attendance_percentage': (present_records / total_records * 100) if total_records > 0 else 0
            },
            'attendance_records': serializer.data
        }
        
        return Response(response_data)

    @action(detail=False, methods=['get'])
    def report(self, request):
        """Get attendance report"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        user_id = request.query_params.get('user_id')
        
        queryset = self.get_queryset()
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Calculate statistics
        total_days = queryset.count()
        present_days = queryset.filter(status='present').count()
        absent_days = queryset.filter(status='absent').count()
        late_days = queryset.filter(status='late').count()
        total_hours = queryset.aggregate(total=Sum('total_hours'))['total'] or 0
        
        report = {
            'total_days': total_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'late_days': late_days,
            'total_hours': total_hours,
            'attendance_percentage': (present_days / total_days * 100) if total_days > 0 else 0
        }
        
        return Response(report)

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Get current user's attendance records"""
        queryset = self.get_queryset().filter(user=request.user)
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def monthly(self, request):
        """Get attendance data for a specific month with statistics"""
        try:
            # Get query parameters
            month = request.query_params.get('month')  # 1-12
            year = request.query_params.get('year')
            user_id = request.query_params.get('user')
            office_id = request.query_params.get('office')
            
            # Validate month and year
            if not month or not year:
                return Response(
                    {'error': 'month and year parameters are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                month = int(month)
                year = int(year)
                if month < 1 or month > 12:
                    raise ValueError("Invalid month")
            except ValueError:
                return Response(
                    {'error': 'Invalid month or year format'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate date range for the month
            from datetime import date
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = date(year, month + 1, 1) - timedelta(days=1)
            
            # Get base queryset
            queryset = self.get_queryset().filter(
                date__gte=start_date,
                date__lte=end_date
            )
            
            # Apply additional filters
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            if office_id:
                queryset = queryset.filter(user__office_id=office_id)
            
            # Get attendance records
            attendance_records = queryset.order_by('date', 'user__first_name')
            
            # Calculate statistics
            total_days_in_month = end_date.day
            total_records = attendance_records.count()
            present_days = attendance_records.filter(status='present').count()
            absent_days = attendance_records.filter(status='absent').count()
            late_days = attendance_records.filter(status='late').count()
            
            # Calculate total hours
            total_hours = attendance_records.aggregate(
                total=Sum('total_hours')
            )['total'] or 0
            
            # Calculate attendance percentage
            attendance_percentage = (present_days / total_days_in_month * 100) if total_days_in_month > 0 else 0
            
            # Serialize attendance records
            serializer = self.get_serializer(attendance_records, many=True)
            
            # Prepare response
            response_data = {
                'month': month,
                'year': year,
                'start_date': start_date,
                'end_date': end_date,
                'total_days_in_month': total_days_in_month,
                'statistics': {
                    'total_records': total_records,
                    'present_days': present_days,
                    'absent_days': absent_days,
                    'late_days': late_days,
                    'total_hours': round(total_hours, 2),
                    'attendance_percentage': round(attendance_percentage, 2)
                },
                'attendance_records': serializer.data
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in monthly attendance endpoint: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def fingerprint_changes(self, request):
        """Get recent fingerprint changes for real-time detection"""
        try:
            # Get today's attendance with recent updates
            today = timezone.now().date()
            queryset = self.get_queryset().filter(
                date=today,
                updated_at__gte=timezone.now() - timezone.timedelta(minutes=5)  # Last 5 minutes
            ).order_by('-updated_at')
            
            # Group by user and get latest changes
            changes = []
            user_changes = {}
            
            for attendance in queryset:
                user_id = attendance.user.id
                if user_id not in user_changes:
                    user_changes[user_id] = {
                        'user': attendance.user,
                        'check_in_time': attendance.check_in_time,
                        'check_out_time': attendance.check_out_time,
                        'last_update': attendance.updated_at,
                        'device': attendance.device
                    }
                else:
                    # Update with latest data
                    if attendance.updated_at > user_changes[user_id]['last_update']:
                        user_changes[user_id] = {
                            'user': attendance.user,
                            'check_in_time': attendance.check_in_time,
                            'check_out_time': attendance.check_out_time,
                            'last_update': attendance.updated_at,
                            'device': attendance.device
                        }
            
            # Convert to list format
            for user_id, data in user_changes.items():
                changes.append({
                    'user_id': user_id,
                    'user_name': f"{data['user'].first_name} {data['user'].last_name}",
                    'check_in_time': data['check_in_time'],
                    'check_out_time': data['check_out_time'],
                    'last_update': data['last_update'],
                    'device_name': data['device'].name if data['device'] else 'Unknown Device'
                })
            
            return Response({
                'changes': changes,
                'timestamp': timezone.now(),
                'total_changes': len(changes)
            })
            
        except Exception as e:
            logger.error(f"Error getting fingerprint changes: {str(e)}")
            return Response(
                {'error': 'Failed to get fingerprint changes'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def debug(self, request):
        """Debug endpoint to check attendance data"""
        user = request.user
        if not user.is_admin:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all attendance records with user data
        all_attendance = Attendance.objects.select_related('user', 'user__office').all()
        
        debug_data = {
            'total_attendance_records': all_attendance.count(),
            'attendance_with_user_data': [],
            'users_without_attendance': []
        }
        
        # Check attendance records
        for attendance in all_attendance[:10]:  # Limit to first 10 for debugging
            debug_data['attendance_with_user_data'].append({
                'attendance_id': str(attendance.id),
                'date': attendance.date.isoformat(),
                'status': attendance.status,
                'user_id': str(attendance.user.id) if attendance.user else None,
                'user_name': attendance.user.get_full_name() if attendance.user else None,
                'user_office': attendance.user.office.name if attendance.user and attendance.user.office else None,
                'check_in': attendance.check_in_time.isoformat() if attendance.check_in_time else None,
                'check_out': attendance.check_out_time.isoformat() if attendance.check_out_time else None
            })
        
        # Check users without attendance
        users_with_attendance = set(all_attendance.values_list('user_id', flat=True))
        all_users = CustomUser.objects.all()
        
        for user_obj in all_users[:10]:  # Limit to first 10 for debugging
            if user_obj.id not in users_with_attendance:
                debug_data['users_without_attendance'].append({
                    'user_id': str(user_obj.id),
                    'user_name': user_obj.get_full_name(),
                    'user_office': user_obj.office.name if user_obj.office else None,
                    'user_role': user_obj.role
                })
        
        return Response(debug_data)

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Manual check-in for current user"""
        today = timezone.now().date()
        current_time = timezone.now()
        
        # Check if already checked in today
        existing_attendance = Attendance.objects.filter(
            user=request.user,
            date=today
        ).first()
        
        if existing_attendance and existing_attendance.check_in_time:
            return Response(
                {'error': 'Already checked in today'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create attendance record
        attendance, created = Attendance.objects.get_or_create(
            user=request.user,
            date=today,
            defaults={
                'status': 'present',
                'check_in_time': current_time,
                'device': request.user.office.devices.first() if request.user.office else None
            }
        )
        
        if not created:
            attendance.check_in_time = current_time
            attendance.status = 'present'
            attendance.save()
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """Manual check-out for current user"""
        today = timezone.now().date()
        current_time = timezone.now()
        
        # Get today's attendance record
        attendance = Attendance.objects.filter(
            user=request.user,
            date=today
        ).first()
        
        if not attendance:
            return Response(
                {'error': 'No check-in record found for today'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if attendance.check_out_time:
            return Response(
                {'error': 'Already checked out today'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update check-out time
        attendance.check_out_time = current_time
        
        # Calculate total hours
        if attendance.check_in_time:
            duration = attendance.check_out_time - attendance.check_in_time
            attendance.total_hours = round(duration.total_seconds() / 3600, 2)
        
        attendance.save()
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get attendance summary for current user"""
        user = request.user
        today = timezone.now().date()
        
        # Get today's attendance
        today_attendance = Attendance.objects.filter(
            user=user,
            date=today
        ).first()
        
        # Get monthly statistics
        current_month = timezone.now().replace(day=1)
        monthly_attendance = Attendance.objects.filter(
            user=user,
            date__gte=current_month
        )
        
        # Calculate statistics
        total_days = monthly_attendance.count()
        present_days = monthly_attendance.filter(status='present').count()
        absent_days = monthly_attendance.filter(status='absent').count()
        late_days = monthly_attendance.filter(status='late').count()
        total_hours = monthly_attendance.aggregate(total=Sum('total_hours'))['total'] or 0
        
        summary = {
            'today': {
                'checked_in': bool(today_attendance and today_attendance.check_in_time),
                'checked_out': bool(today_attendance and today_attendance.check_out_time),
                'check_in_time': today_attendance.check_in_time if today_attendance else None,
                'check_out_time': today_attendance.check_out_time if today_attendance else None,
                'total_hours': today_attendance.total_hours if today_attendance else 0,
                'status': today_attendance.status if today_attendance else 'absent'
            },
            'monthly': {
                'total_days': total_days,
                'present_days': present_days,
                'absent_days': absent_days,
                'late_days': late_days,
                'total_hours': total_hours,
                'attendance_percentage': (present_days / total_days * 100) if total_days > 0 else 0
            }
        }
        
        return Response(summary)


class ZKTecoAttendanceViewSet(viewsets.ViewSet):
    """ViewSet for ZKTeco attendance synchronization"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def sync_device(self, request):
        """Sync attendance from a specific ZKTeco device"""
        try:
            device_ip = request.data.get('device_ip')
            device_port = request.data.get('device_port', 4370)
            start_date = request.data.get('start_date')
            end_date = request.data.get('end_date')
            
            if not device_ip:
                return Response(
                    {'error': 'device_ip is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse dates if provided
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d')
            
            # Fetch attendance from device
            attendance_logs = zkteco_service.fetch_attendance_from_device(
                device_ip, device_port, start_date, end_date
            )
            
            if not attendance_logs:
                return Response(
                    {'error': 'No attendance data found or device connection failed'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Sync to database
            device_info = {
                'ip_address': device_ip,
                'port': device_port,
                'name': f"ZKTeco_{device_ip}"
            }
            
            synced_count, error_count = zkteco_service.sync_attendance_to_database(
                attendance_logs, device_info
            )
            
            return Response({
                'message': f'Successfully synced {synced_count} attendance records',
                'synced_count': synced_count,
                'error_count': error_count,
                'total_logs': len(attendance_logs)
            })
            
        except Exception as e:
            logger.error(f"Error syncing ZKTeco device: {str(e)}")
            return Response(
                {'error': f'Sync failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def sync_all_devices(self, request):
        """Sync attendance from all ZKTeco devices"""
        try:
            # Get all active ZKTeco devices
            devices = Device.objects.filter(
                device_type='zkteco',
                is_active=True
            ).values('ip_address', 'port', 'name', 'office')
            
            if not devices:
                return Response(
                    {'error': 'No active ZKTeco devices found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            start_date = request.data.get('start_date')
            end_date = request.data.get('end_date')
            
            # Parse dates if provided
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d')
            
            total_synced = 0
            total_errors = 0
            device_results = {}
            
            # Try to fetch attendance from all devices with individual error handling
            try:
                all_attendance = zkteco_service.fetch_all_devices_attendance(
                    list(devices), start_date, end_date
                )
                
                # Sync each device's attendance
                for device_name, device_data in all_attendance.items():
                    device_info = device_data['device_info']
                    attendance_logs = device_data['attendance_logs']
                    
                    synced_count, error_count = zkteco_service.sync_attendance_to_database(
                        attendance_logs, device_info
                    )
                    
                    total_synced += synced_count
                    total_errors += error_count
                    
                    device_results[device_name] = {
                        'synced_count': synced_count,
                        'error_count': error_count,
                        'total_logs': len(attendance_logs)
                    }
                    
            except Exception as sync_error:
                logger.warning(f"Failed to sync devices: {str(sync_error)}")
                # Mark all devices as failed
                for device in devices:
                    device_results[device['name']] = {
                        'synced_count': 0,
                        'error_count': 1,
                        'total_logs': 0,
                        'error': 'Device timeout or network unreachable'
                    }
                    total_errors += 1
            
            return Response({
                'message': f'Sync completed: {total_synced} records synced, {total_errors} errors',
                'total_synced': total_synced,
                'total_errors': total_errors,
                'device_results': device_results
            })
            
        except Exception as e:
            logger.error(f"Error in sync_all_devices: {str(e)}")
            # Return error status for all devices instead of failing completely
            devices = Device.objects.filter(device_type='zkteco', is_active=True)
            device_results = {}
            for device in devices:
                device_results[device.name] = {
                    'synced_count': 0,
                    'error_count': 1,
                    'total_logs': 0,
                    'error': 'Service unavailable'
                }
            
            return Response({
                'message': 'Sync failed - devices may be offline',
                'total_synced': 0,
                'total_errors': len(devices),
                'device_results': device_results,
                'error': 'Service temporarily unavailable'
            })
    
    @action(detail=False, methods=['get'])
    def device_status(self, request):
        """Get status of all ZKTeco devices"""
        try:
            devices = Device.objects.filter(
                device_type='zkteco',
                is_active=True
            )
            
            device_status = []
            for device in devices:
                # Try to connect to device with timeout handling
                try:
                    device_connection = zkteco_service.get_device(device.ip_address, device.port)
                    is_online = device_connection is not None
                except Exception as e:
                    logger.warning(f"Failed to connect to device {device.name} ({device.ip_address}): {str(e)}")
                    is_online = False
                
                status_info = {
                    'id': device.id,
                    'name': device.name,
                    'ip_address': device.ip_address,
                    'port': device.port,
                    'office': device.office.name if device.office else None,
                    'is_online': is_online,
                    'last_sync': device.last_sync.isoformat() if device.last_sync else None,
                    'connection_error': None if is_online else 'Device timeout or network unreachable'
                }
                
                device_status.append(status_info)
            
            return Response({
                'devices': device_status,
                'total_devices': len(device_status),
                'online_devices': len([d for d in device_status if d['is_online']]),
                'offline_devices': len([d for d in device_status if not d['is_online']])
            })
            
        except Exception as e:
            logger.error(f"Error getting device status: {str(e)}")
            # Return offline status for all devices instead of error
            devices = Device.objects.filter(device_type='zkteco', is_active=True)
            device_status = []
            for device in devices:
                device_status.append({
                    'id': device.id,
                    'name': device.name,
                    'ip_address': device.ip_address,
                    'port': device.port,
                    'office': device.office.name if device.office else None,
                    'is_online': False,
                    'last_sync': device.last_sync.isoformat() if device.last_sync else None,
                    'connection_error': 'Service unavailable'
                })
            
            return Response({
                'devices': device_status,
                'total_devices': len(device_status),
                'online_devices': 0,
                'offline_devices': len(device_status),
                'error': 'Service temporarily unavailable'
            })
    
    @action(detail=False, methods=['get'])
    def get_user_attendance(self, request):
        """Get attendance data for current user from ZKTeco devices"""
        try:
            user = request.user
            if not user.biometric_id:
                return Response(
                    {'error': 'User does not have a biometric ID assigned'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user's office devices
            user_devices = []
            if user.office:
                user_devices = Device.objects.filter(
                    office=user.office,
                    device_type='zkteco',
                    is_active=True
                ).values('ip_address', 'port', 'name')
            
            if not user_devices:
                return Response(
                    {'error': 'No ZKTeco devices found for user\'s office'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get date range
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
            else:
                start_date = timezone.now() - timedelta(days=30)  # Last 30 days
            
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d')
            else:
                end_date = timezone.now()
            
            # Fetch attendance from all user's devices
            all_attendance = zkteco_service.fetch_all_devices_attendance(
                list(user_devices), start_date, end_date
            )
            
            # Process attendance for current user
            user_attendance = []
            for device_name, device_data in all_attendance.items():
                device_logs = device_data['attendance_logs']
                user_logs = zkteco_service.process_attendance_for_user(
                    user.biometric_id, device_logs
                )
                
                for log in user_logs:
                    user_attendance.append({
                        'device_name': device_name,
                        'device_ip': log['device_ip'],
                        'punch_time': log['punch_time'].isoformat(),
                        'punch_type': log['punch_type'],
                        'timestamp': log['timestamp']
                    })
            
            # Sort by timestamp
            user_attendance.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return Response({
                'user_id': user.id,
                'biometric_id': user.biometric_id,
                'attendance_logs': user_attendance,
                'total_logs': len(user_attendance),
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            })
            
        except Exception as e:
            logger.error(f"Error getting user attendance: {str(e)}")
            return Response(
                {'error': f'Failed to get user attendance: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LeaveViewSet(viewsets.ModelViewSet):
    """ViewSet for Leave model"""
    serializer_class = LeaveSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'reason']
    ordering_fields = ['start_date', 'end_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Leave.objects.all()
        elif user.is_manager:
            return Leave.objects.filter(user__office=user.office)
        else:
            return Leave.objects.filter(user=user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            if self.action == 'create':
                return [permissions.IsAuthenticated()]
            return [IsAdminOrManager()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return LeaveCreateSerializer
        elif self.action in ['approve', 'reject']:
            return LeaveApprovalSerializer
        return LeaveSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Get current user's leaves"""
        queryset = Leave.objects.filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve leave request"""
        leave = self.get_object()
        serializer = LeaveApprovalSerializer(leave, data=request.data, partial=True)
        if serializer.is_valid():
            leave.status = 'approved'
            leave.approved_by = request.user
            leave.approved_at = timezone.now()
            leave.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject leave request"""
        leave = self.get_object()
        serializer = LeaveApprovalSerializer(leave, data=request.data, partial=True)
        if serializer.is_valid():
            leave.status = 'rejected'
            leave.approved_by = request.user
            leave.approved_at = timezone.now()
            leave.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending leave requests"""
        queryset = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class DocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Document model"""
    serializer_class = DocumentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'user__first_name', 'user__last_name']
    ordering_fields = ['title', 'created_at']

    def get_queryset(self):
        user = self.request.user
        base_queryset = Document.objects.select_related('user', 'user__office', 'uploaded_by')
        
        if user.is_admin:
            return base_queryset.all()
        elif user.is_manager:
            # Managers can see documents uploaded by them or documents of their office employees
            return base_queryset.filter(
                models.Q(uploaded_by=user) | models.Q(user__office=user.office)
            )
        else:
            return base_queryset.filter(user=user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentCreateSerializer
        return DocumentSerializer
    
    def get_serializer_context(self):
        """Add request to serializer context for file URL generation"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user
        # If manager is uploading for another user, validate the user belongs to their office
        if user.is_manager and 'user' in serializer.validated_data:
            target_user = serializer.validated_data['user']
            if target_user.office != user.office:
                raise serializers.ValidationError("You can only upload documents for employees in your office")
        
        serializer.save(uploaded_by=user)

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Get documents for the current user"""
        user = request.user
        queryset = self.get_queryset()
        
        # Apply additional filters if provided
        search = request.query_params.get('search', '')
        category = request.query_params.get('category', '')
        document_type = request.query_params.get('document_type', '')
        date = request.query_params.get('date', '')
        assigned_only = request.query_params.get('assigned_only', 'false').lower() == 'true'
        
        # Filter by search
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) |
                models.Q(description__icontains=search) |
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search)
            )
        
        # Filter by document type
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        
        # Filter by date
        if date:
            queryset = queryset.filter(created_at__date=date)
        
        # Filter by category
        if category:
            if category == 'personal':
                queryset = queryset.filter(document_type__in=['aadhar_card', 'pan_card', 'voter_id', 'driving_license', 'passport', 'birth_certificate'])
            elif category == 'salary':
                queryset = queryset.filter(document_type__in=['salary_slip', 'offer_letter'])
            elif category == 'uploaded':
                queryset = queryset.filter(uploaded_by=user)
        
        # Filter by assigned only (for managers)
        if assigned_only and user.is_manager:
            queryset = queryset.filter(uploaded_by=user)
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def manager_employees(self, request):
        """Get employees that manager can upload documents for"""
        user = request.user
        if not user.is_manager:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        employees = CustomUser.objects.filter(
            office=user.office,
            role='employee',
            is_active=True
        ).values('id', 'first_name', 'last_name', 'employee_id', 'email')
        
        return Response({
            'employees': list(employees)
        })

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a document file"""
        document = self.get_object()
        
        # Check if user has permission to download this document
        user = request.user
        if not (user.is_admin or user.is_manager or document.user == user or document.uploaded_by == user):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from django.http import FileResponse
            import os
            
            file_path = document.file.path
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'))
                response['Content-Type'] = 'application/octet-stream'
                response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
                return response
            else:
                return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Error downloading file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Notification model - Read only"""
    serializer_class = NotificationSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for SystemSettings model - Admin only"""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['key', 'description']
    ordering_fields = ['key', 'created_at']


class AttendanceLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for AttendanceLog model - Read only"""
    serializer_class = AttendanceLogSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return AttendanceLog.objects.all()
        elif user.is_manager:
            return AttendanceLog.objects.filter(attendance__user__office=user.office)
        else:
            return AttendanceLog.objects.none()


# Dashboard Views
class DashboardViewSet(viewsets.ViewSet):
    """ViewSet for dashboard statistics"""
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        # Optimize database connections
        from core.db_manager import db_manager
        db_manager.optimize_connections()
        
        user = request.user
        today = timezone.now().date()
        last_month = today - timedelta(days=30)
        
        if user.is_admin:
            # Calculate comprehensive statistics for admin
            total_employees = CustomUser.objects.filter(role='employee').count()
            total_managers = CustomUser.objects.filter(role='manager').count()
            total_offices = Office.objects.count()
            total_devices = Device.objects.count()
            active_devices = Device.objects.filter(is_active=True).count()
            
            # Attendance statistics
            today_attendance = Attendance.objects.filter(
                date=today, 
                status='present'
            ).count()
            total_today_records = Attendance.objects.filter(date=today).count()
            attendance_rate = (today_attendance / total_today_records * 100) if total_today_records > 0 else 0
            
            # Leave statistics
            pending_leaves = Leave.objects.filter(status='pending').count()
            approved_leaves = Leave.objects.filter(status='approved').count()
            total_leaves = Leave.objects.count()
            leave_approval_rate = (approved_leaves / total_leaves * 100) if total_leaves > 0 else 0
            
            # User statistics
            active_users = CustomUser.objects.filter(is_active=True).count()
            total_users = CustomUser.objects.count()
            inactive_users = total_users - active_users
            
            # Growth statistics (comparing with last month)
            last_month_employees = CustomUser.objects.filter(
                role='employee',
                date_joined__lt=last_month
            ).count()
            employee_growth = ((total_employees - last_month_employees) / last_month_employees * 100) if last_month_employees > 0 else 0
            
            stats = {
                'total_employees': total_employees,
                'total_managers': total_managers,
                'total_offices': total_offices,
                'total_devices': total_devices,
                'active_devices': active_devices,
                'today_attendance': today_attendance,
                'total_today_records': total_today_records,
                'attendance_rate': round(attendance_rate, 2),
                'pending_leaves': pending_leaves,
                'approved_leaves': approved_leaves,
                'total_leaves': total_leaves,
                'leave_approval_rate': round(leave_approval_rate, 2),
                'active_users': active_users,
                'inactive_users': inactive_users,
                'total_users': total_users,
                'employee_growth': round(employee_growth, 2),
                'user_activation_rate': round((active_users / total_users * 100), 2) if total_users > 0 else 0,
            }
        elif user.is_manager:
            # Calculate office-specific statistics for manager
            office = user.office
            total_employees = CustomUser.objects.filter(
                office=office, 
                role='employee'
            ).count()
            total_devices = Device.objects.filter(office=office).count()
            active_devices = Device.objects.filter(office=office, is_active=True).count()
            
            # Office attendance statistics
            today_attendance = Attendance.objects.filter(
                user__office=office,
                date=today, 
                status='present'
            ).count()
            total_today_records = Attendance.objects.filter(
                user__office=office,
                date=today
            ).count()
            attendance_rate = (today_attendance / total_today_records * 100) if total_today_records > 0 else 0
            
            # Office leave statistics
            pending_leaves = Leave.objects.filter(
                user__office=office, 
                status='pending'
            ).count()
            approved_leaves = Leave.objects.filter(
                user__office=office,
                status='approved'
            ).count()
            total_leaves = Leave.objects.filter(user__office=office).count()
            leave_approval_rate = (approved_leaves / total_leaves * 100) if total_leaves > 0 else 0
            
            # Office user statistics
            active_users = CustomUser.objects.filter(
                office=office, 
                is_active=True
            ).count()
            total_users = CustomUser.objects.filter(office=office).count()
            
            stats = {
                'total_employees': total_employees,
                'total_managers': 1,  # Manager themselves
                'total_offices': 1,
                'total_devices': total_devices,
                'active_devices': active_devices,
                'today_attendance': today_attendance,
                'total_today_records': total_today_records,
                'attendance_rate': round(attendance_rate, 2),
                'pending_leaves': pending_leaves,
                'approved_leaves': approved_leaves,
                'total_leaves': total_leaves,
                'leave_approval_rate': round(leave_approval_rate, 2),
                'active_users': active_users,
                'total_users': total_users,
                'user_activation_rate': round((active_users / total_users * 100), 2) if total_users > 0 else 0,
                'employee_growth': 0,  # Not applicable for managers
            }
        else:
            # Employee statistics
            today_attendance = Attendance.objects.filter(
                user=user,
                date=today
            ).count()
            pending_leaves = Leave.objects.filter(
                user=user, 
                status='pending'
            ).count()
            approved_leaves = Leave.objects.filter(
                user=user,
                status='approved'
            ).count()
            total_leaves = Leave.objects.filter(user=user).count()
            leave_approval_rate = (approved_leaves / total_leaves * 100) if total_leaves > 0 else 0
            
            stats = {
                'total_employees': 1,
                'total_managers': 0,
                'total_offices': 1,
                'total_devices': 0,
                'active_devices': 0,
                'today_attendance': today_attendance,
                'total_today_records': today_attendance,
                'attendance_rate': 100 if today_attendance > 0 else 0,
                'pending_leaves': pending_leaves,
                'approved_leaves': approved_leaves,
                'total_leaves': total_leaves,
                'leave_approval_rate': round(leave_approval_rate, 2),
                'active_users': 1,
                'total_users': 1,
                'user_activation_rate': 100,
            }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


# Custom error handlers for production
def custom_404(request, exception=None):
    """Custom 404 error handler"""
    from django.http import JsonResponse
    return JsonResponse({
        'error': 'Not Found',
        'message': 'The requested resource was not found',
        'status_code': 404
    }, status=404)


def custom_500(request):
    """Custom 500 error handler"""
    from django.http import JsonResponse
    return JsonResponse({
        'error': 'Internal Server Error',
        'message': 'An internal server error occurred',
        'status_code': 500
    }, status=500)
