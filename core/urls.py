from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    OfficeViewSet, CustomUserViewSet, DeviceViewSet, AttendanceViewSet,
    LeaveViewSet, DocumentViewSet, NotificationViewSet, SystemSettingsViewSet,
    AttendanceLogViewSet, DashboardViewSet, ZKTecoAttendanceViewSet, ReportsViewSet,
    ResignationViewSet, DepartmentViewSet, DesignationViewSet
)
from .document_views import (
    DocumentTemplateViewSet, GeneratedDocumentViewSet, DocumentGenerationViewSet
)
from .essl_views import (
    ESSLDeviceViewSet, ESSLAttendanceLogViewSet, WorkingHoursSettingsViewSet,
    ESSLDeviceManagerView, UserRegistrationView, MonthlyAttendanceReportView,
    GetAllUsersFromDevicesView, ExportUsersToCSVView
)
from .push_views import (
    DevicePushDataView, receive_attendance_push, device_health_check
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'offices', OfficeViewSet)
router.register(r'users', CustomUserViewSet, basename='user')
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'leaves', LeaveViewSet, basename='leave')
router.register(r'resignations', ResignationViewSet, basename='resignation')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'settings', SystemSettingsViewSet)
router.register(r'attendance-logs', AttendanceLogViewSet, basename='attendance-log')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'zkteco-attendance', ZKTecoAttendanceViewSet, basename='zkteco-attendance')
router.register(r'reports', ReportsViewSet, basename='reports')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'designations', DesignationViewSet, basename='designation')

# Document generation endpoints
router.register(r'document-templates', DocumentTemplateViewSet, basename='document-template')
router.register(r'generated-documents', GeneratedDocumentViewSet, basename='generated-document')
router.register(r'document-generation', DocumentGenerationViewSet, basename='document-generation')

# ESSL Device Management
router.register(r'essl-devices', ESSLDeviceViewSet, basename='essl-device')
router.register(r'essl-attendance-logs', ESSLAttendanceLogViewSet, basename='essl-attendance-log')
router.register(r'working-hours-settings', WorkingHoursSettingsViewSet, basename='working-hours-setting')

app_name = 'core'

urlpatterns = [
    # API endpoints
    path('api/', include(router.urls)),
    
    # JWT authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Custom authentication endpoints
    path('api/auth/login/', CustomUserViewSet.as_view({'post': 'login'}), name='login'),
    path('api/auth/register/', CustomUserViewSet.as_view({'post': 'register'}), name='register'),
    path('api/auth/profile/', CustomUserViewSet.as_view({'get': 'profile'}), name='profile'),
    path('api/auth/profile/update/', CustomUserViewSet.as_view({'put': 'update_profile'}), name='update_profile'),
    path('api/auth/change-password/', CustomUserViewSet.as_view({'post': 'change_password'}), name='change_password'),
    path('api/auth/debug_auth/', CustomUserViewSet.as_view({'get': 'debug_auth'}), name='debug_auth'),
    
    # ESSL Device Management endpoints
    path('api/essl/device-manager/', ESSLDeviceManagerView.as_view(), name='essl-device-manager'),
    path('api/essl/register-user/', UserRegistrationView.as_view(), name='register-user'),
    path('api/essl/get-all-users/', GetAllUsersFromDevicesView.as_view(), name='get-all-users'),
    path('api/essl/export-users-csv/', ExportUsersToCSVView.as_view(), name='export-users-csv'),
    path('api/essl/monthly-report/', MonthlyAttendanceReportView.as_view(), name='monthly-report'),
    
    # Device Push Data endpoints (for receiving data from biometric devices)
    path('api/device/push-attendance/', DevicePushDataView.as_view(), name='device-push-attendance'),
    path('api/device/receive-attendance/', receive_attendance_push, name='receive-attendance-push'),
    path('api/device/health-check/', device_health_check, name='device-health-check'),
    
    # Department designations endpoint
    path('api/departments/<uuid:department_id>/designations/', DesignationViewSet.as_view({'get': 'list'}), name='department-designations'),
]
