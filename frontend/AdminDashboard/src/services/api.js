import axios from 'axios';
import jwtAuthService from './jwtAuth';

// Create axios instance with better timeout configuration
const api = axios.create({
  // baseURL: 'http://localhost:8000/api',
  baseURL: 'https://company.d0s369.co.in/api',
  timeout: 60000, // Increased timeout to 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = jwtAuthService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Debug logging for profile update requests
      if (config.url && config.url.includes('profile/update')) {
        console.log('🔍 Profile Update Request Debug:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          token: token ? `${token.substring(0, 20)}...` : 'None'
        });
      }
      
      // Debug logging for resignation approval requests
      if (config.url && config.url.includes('resignations') && config.url.includes('approve')) {
        console.log('🔍 Resignation Approval Request Debug:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          token: token ? `${token.substring(0, 20)}...` : 'None'
        });
      }
      
      // Debug logging for device update requests
      if (config.url && config.url.includes('devices') && config.method === 'put') {
        console.log('🔍 Device Update Request Debug:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data,
          token: token ? `${token.substring(0, 20)}...` : 'None'
        });
      }
    } else {
      console.warn('⚠️ No access token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    // Debug logging for resignation approval responses
    if (response.config?.url && response.config.url.includes('resignations') && response.config.url.includes('approve')) {
      console.log('✅ Resignation Approval Response Debug:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    
    // Debug logging for device update responses
    if (response.config?.url && response.config.url.includes('devices') && response.config.method === 'put') {
      console.log('✅ Device Update Response Debug:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401 && !error.config._retry) {
      console.log('🔄 API: Attempting token refresh due to 401 error...');
      error.config._retry = true;
      
      try {
        // Try to refresh token
        const refreshed = await jwtAuthService.refreshToken();
        if (refreshed) {
          console.log('✅ API: Token refresh successful, retrying request...');
          // Get the new token and retry the request
          const newToken = jwtAuthService.getAccessToken();
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return api(error.config);
          }
        } else {
          console.log('❌ API: Token refresh failed, logging out user');
          // Refresh failed, logout user
          jwtAuthService.logout();
        }
      } catch (refreshError) {
        console.error('❌ API: Token refresh error:', refreshError);
        jwtAuthService.logout();
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  getToken: (credentials) => api.post('/token/', credentials),
  refreshToken: (refreshToken) => api.post('/token/refresh/', { refresh: refreshToken }),
  verifyToken: (token) => api.post('/token/verify/', { token }),
  getProfile: () => api.get('/auth/profile/'),
  changePassword: (passwordData) => api.post('/auth/change_password/', passwordData),
  debugAuth: () => api.get('/auth/debug_auth/'),
};

// Users API
export const usersAPI = {
  getUsers: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== 'all') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    return api.get(`/users/${queryString ? `?${queryString}` : ''}`);
  },
  createUser: (userData) => api.post('/users/', userData),
  getUser: (id) => api.get(`/users/${id}/`),
  updateUser: (id, userData) => api.put(`/users/${id}/`, userData),
  deleteUser: (id) => api.delete(`/users/${id}/`),
  getUserCount: () => api.get('/users/count/'),
  debugAssignments: () => api.get('/users/debug_assignments/'),
  // Profile management
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (profileData) => {
    const form = new FormData();
    Object.entries(profileData || {}).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'profile_picture') {
        if (value instanceof File || value instanceof Blob) {
          form.append('profile_picture', value);
        } else if (typeof value === 'string' && value.startsWith('blob:')) {
          // ignore runtime blob URLs
        } else if (value === null || value === '') {
          // allow clearing picture
          form.append('profile_picture', '');
        }
      } else {
        // Convert empty strings to null-like by sending empty, backend handles nulls
        form.append(key, value ?? '');
      }
    });
    return api.put('/users/update_profile/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (passwordData) => api.post('/users/change_password/', passwordData),
};

// Offices API
export const officesAPI = {
  getOffices: () => api.get('/offices/'),
  createOffice: (officeData) => api.post('/offices/', officeData),
  getOffice: (id) => api.get(`/offices/${id}/`),
  updateOffice: (id, officeData) => api.put(`/offices/${id}/`, officeData),
  deleteOffice: (id) => api.delete(`/offices/${id}/`),
  getOfficeCount: () => api.get('/offices/count/'),
};

// Attendance API
export const attendanceAPI = {
  getAttendance: (params = {}) => api.get('/attendance/', { params }),
  getTodayAttendance: () => api.get('/attendance/today/'),
  getTodayStatus: () => api.get('/attendance/today-status/'),
  getMonthlyAttendance: (month, year, params = {}) => api.get('/attendance/monthly/', {
    params: { month, year, ...params }
  }),
  getMonthlySummary: (year, month, params = {}) => api.get('/attendance/monthly-summary/', {
    params: { year, month, ...params }
  }),
  getAttendanceReport: (startDate, endDate, params = {}) => api.get('/attendance/report/', {
    params: { start_date: startDate, end_date: endDate, ...params }
  }),
  getRealtimeAttendance: (params = {}) => api.get('/dashboard/stats/', { params }),
  getCheckinCheckoutData: (params = {}) => api.get('/attendance/checkin_checkout/', { params }),
  createAttendance: (data) => api.post('/attendance/', data),
  updateAttendance: (id, data) => api.put(`/attendance/${id}/`, data),
  deleteAttendance: (id) => api.delete(`/attendance/${id}/`),
  bulkCreateAttendance: (data) => api.post('/attendance/bulk_create/', data),
  exportMonthlyReport: (year, month, params = {}) => api.get('/attendance/export-monthly/', {
    params: { year, month, ...params },
    responseType: 'blob'
  }),
  updateAttendanceStatus: (data) => api.post('/attendance/update_status/', data),
};

// Leaves API
export const leavesAPI = {
  getLeaves: (params = {}) => api.get('/leaves/', { params }),
  createLeave: (leaveData) => api.post('/leaves/', leaveData),
  getLeave: (id) => api.get(`/leaves/${id}/`),
  updateLeave: (id, leaveData) => api.put(`/leaves/${id}/`, leaveData),
  deleteLeave: (id) => api.delete(`/leaves/${id}/`),
  approveLeave: (id) => api.post(`/leaves/${id}/approve/`),
  rejectLeave: (id, data) => api.post(`/leaves/${id}/reject/`, data),
  getPendingLeaves: () => api.get('/leaves/pending/'),
  getMyLeaves: () => api.get('/leaves/my/'),
};

// Resignations API
export const resignationsAPI = {
  getResignations: (params = {}) => api.get('/resignations/', { params }),
  getResignation: (id) => api.get(`/resignations/${id}/`),
  updateResignation: (id, resignationData) => api.put(`/resignations/${id}/`, resignationData),
  deleteResignation: (id) => api.delete(`/resignations/${id}/`),
  approveResignation: (id, data = {}) => api.post(`/resignations/${id}/approve/`, data),
  rejectResignation: (id, data = {}) => api.post(`/resignations/${id}/reject/`, data),
  cancelResignation: (id) => api.post(`/resignations/${id}/cancel/`),
  getPendingResignations: () => api.get('/resignations/pending/'),
  getMyResignations: () => api.get('/resignations/my_resignations/'),
  // Statistics
  getResignationStats: () => api.get('/resignations/stats/'),
};

// Documents API
export const documentsAPI = {
  getDocuments: (params = {}) => api.get('/documents/', { params }),
  getDocument: (id) => api.get(`/documents/${id}/`),
  createDocument: (documentData) => {
    const formData = new FormData();
    
    // Add all form fields
    Object.keys(documentData).forEach(key => {
      if (documentData[key] !== null && documentData[key] !== undefined) {
        formData.append(key, documentData[key]);
      }
    });
    
    return api.post('/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateDocument: (id, documentData) => api.put(`/documents/${id}/`, documentData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteDocument: (id) => api.delete(`/documents/${id}/`),
  // Try my endpoint first, fallback to main endpoint if it fails
  getMyDocuments: async () => {
    try {
      return await api.get('/documents/my/', { params: { page_size: 1000, no_pagination: true } });
    } catch (error) {
      console.warn('⚠️ /documents/my/ endpoint failed, falling back to /documents/');
      return await api.get('/documents/', { params: { page_size: 1000, no_pagination: true } });
    }
  },
  downloadDocument: (id) => api.get(`/documents/${id}/download/`, {
    responseType: 'blob',
  }),
  // Manager-specific endpoints
  getManagerEmployees: () => api.get('/documents/manager_employees/'),
  // Document management by type
  getDocumentsByType: (documentType, params = {}) => api.get('/documents/', { 
    params: { document_type: documentType, ...params } 
  }),
  // Bulk operations
  bulkUploadDocuments: (documentsData) => api.post('/documents/bulk_upload/', documentsData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  // Salary slip specific upload
  uploadSalarySlip: (formData) => api.post('/documents/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  // Bulk operations
  bulkDelete: (ids) => Promise.all(ids.map(id => documentsAPI.deleteDocument(id))),
  bulkDownload: async (ids) => {
    // Download documents one by one (backend could be enhanced to support zip)
    for (const id of ids) {
      try {
        const response = await documentsAPI.downloadDocument(id);
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_${id}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error(`Failed to download document ${id}:`, error);
      }
    }
  }
};

// Document Generation API
export const documentGenerationAPI = {
  // Document Templates
  getTemplates: () => api.get('/document-templates/'),
  getTemplate: (id) => api.get(`/document-templates/${id}/`),
  createTemplate: (templateData) => api.post('/document-templates/', templateData),
  updateTemplate: (id, templateData) => api.put(`/document-templates/${id}/`, templateData),
  deleteTemplate: (id) => api.delete(`/document-templates/${id}/`),
  
  // Generated Documents
  getGeneratedDocuments: (params = {}) => api.get('/generated-documents/', { params }),
  getGeneratedDocument: (id) => api.get(`/generated-documents/${id}/`),
  deleteGeneratedDocument: (id) => api.delete(`/generated-documents/${id}/`),
  downloadGeneratedDocumentPDF: (id) => api.get(`/generated-documents/${id}/download_pdf/`, {
    responseType: 'blob',
  }),
  sendGeneratedDocumentEmail: (id) => api.post(`/generated-documents/${id}/send_email/`),
  
  // Document Generation
  getEmployees: () => api.get('/document-generation/employees/'),
  previewDocument: (data) => api.post('/document-generation/preview_document/', data),
  generateDocument: (data) => api.post('/document-generation/generate_document/', data),
  getMyDocuments: () => api.get('/document-generation/my_documents/'),
};

// Devices API
export const devicesAPI = {
  getDevices: () => api.get('/devices/'),
  getDevice: (id) => api.get(`/devices/${id}/`),
  createDevice: (deviceData) => api.post('/devices/', deviceData),
  updateDevice: (id, deviceData) => {
    console.log('🔧 devicesAPI.updateDevice called:', { id, deviceData });
    return api.put(`/devices/${id}/`, deviceData);
  },
  deleteDevice: (id) => api.delete(`/devices/${id}/`),
  testConnection: (id) => api.post(`/devices/${id}/sync/`, {
    sync_type: 'users'
  }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params = {}) => api.get('/notifications/', { params }),
  getNotification: (id) => api.get(`/notifications/${id}/`),
  markAsRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllAsRead: () => api.post('/notifications/mark_all_read/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  // Use standard RESTful destroy endpoint
  deleteNotification: (id) => api.delete(`/notifications/${id}/`),
  deleteExpired: () => api.post('/notifications/delete_expired/'),
  cleanupOld: (days = 30) => api.post('/notifications/cleanup_old/', { days }),
  createBulk: (data) => api.post('/notifications/create_bulk/', data),
  getTargetOptions: () => api.get('/notifications/get_target_options/'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats/'),
};

// Reports API
export const reportsAPI = {
  getAttendanceReport: (params = {}) => api.get('/reports/attendance/', { params }),
  getLeaveReport: (params = {}) => api.get('/reports/leave/', { params }),
  getOfficeReport: (params = {}) => api.get('/reports/office/', { params }),
  getUserReport: (params = {}) => api.get('/reports/user/', { params }),
  getMonthlySummary: (params = {}) => api.get('/reports/monthly_summary/', { params }),
  exportReport: (params = {}) => api.get('/reports/export/', { 
    params,
    responseType: 'blob'
  }),
  
  // Get latest attendance records for real-time updates
  getLatestAttendance: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/reports/latest_attendance/${queryParams ? `?${queryParams}` : ''}`);
  },
};

// Departments API
export const departmentsAPI = {
  getDepartments: () => api.get('/departments/'),
  getDepartment: (id) => api.get(`/departments/${id}/`),
  createDepartment: (departmentData) => api.post('/departments/', departmentData),
  updateDepartment: (id, departmentData) => api.put(`/departments/${id}/`, departmentData),
  deleteDepartment: (id) => api.delete(`/departments/${id}/`),
  getDepartmentDesignations: (departmentId) => api.get(`/designations/by-department/${departmentId}/`),
};

// Designations API
export const designationsAPI = {
  getDesignations: () => api.get('/designations/'),
  getDesignation: (id) => api.get(`/designations/${id}/`),
  createDesignation: (designationData) => api.post('/designations/', designationData),
  updateDesignation: (id, designationData) => api.put(`/designations/${id}/`, designationData),
  deleteDesignation: (id) => api.delete(`/designations/${id}/`),
  getDesignationsByDepartment: (departmentId) => api.get(`/designations/by-department/${departmentId}/`),
};

// Device Users API
export const deviceUserAPI = {
  // Basic CRUD operations
  getDeviceUsers: (params = {}) => api.get('/device-users/', { params }),
  getDeviceUser: (id) => api.get(`/device-users/${id}/`),
  createDeviceUser: (deviceUserData) => api.post('/device-users/', deviceUserData),
  updateDeviceUser: (id, deviceUserData) => api.put(`/device-users/${id}/`, deviceUserData),
  deleteDeviceUser: (id) => api.delete(`/device-users/${id}/`),
  
  // Mapping operations
  mapToSystemUser: (id, mappingData) => api.post(`/device-users/${id}/map_to_system_user/`, mappingData),
  unmapFromSystemUser: (id) => api.post(`/device-users/${id}/unmap_from_system_user/`),
  
  // Bulk operations
  bulkCreate: (bulkData) => api.post('/device-users/bulk_create/', bulkData),
  
  // Special queries
  getUnmappedUsers: (params = {}) => api.get('/device-users/unmapped_users/', { params }),
  getMappedUsers: (params = {}) => api.get('/device-users/mapped_users/', { params }),
  
  // Stats
  getStats: () => api.get('/device-users/stats/'),
};

// ESSL Device Management API
export const esslAPI = {
  getDevices: () => api.get('/essl-devices/'),
  getDevice: (id) => api.get(`/essl-devices/${id}/`),
  createDevice: (deviceData) => api.post('/essl-devices/', deviceData),
  updateDevice: (id, deviceData) => api.put(`/essl-devices/${id}/`, deviceData),
  deleteDevice: (id) => api.delete(`/essl-devices/${id}/`),
  getAttendanceLogs: (params = {}) => api.get('/essl-attendance-logs/', { params }),
  getWorkingHoursSettings: () => api.get('/working-hours-settings/'),
  updateWorkingHoursSettings: (data) => api.put('/working-hours-settings/', data),
  deviceManager: () => api.get('/essl/device-manager/'),
  registerUser: (userData) => api.post('/essl/register-user/', userData),
  getAllUsers: () => api.get('/essl/get-all-users/'),
  exportUsersCSV: () => api.get('/essl/export-users-csv/', { responseType: 'blob' }),
  getMonthlyReport: (params = {}) => api.get('/essl/monthly-report/', { params }),
};

// Convenience methods for backward compatibility
api.getDepartments = () => departmentsAPI.getDepartments();
api.getDepartment = (id) => departmentsAPI.getDepartment(id);
api.getDepartmentDesignations = (departmentId) => departmentsAPI.getDepartmentDesignations(departmentId);
api.getDesignations = () => designationsAPI.getDesignations();
api.getDesignation = (id) => designationsAPI.getDesignation(id);
api.getDesignationsByDepartment = (departmentId) => designationsAPI.getDesignationsByDepartment(departmentId);

export default api;
