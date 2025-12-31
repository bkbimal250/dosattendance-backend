/**
 * Main API file - Backward compatibility layer
 * 
 * This file maintains backward compatibility by exporting all APIs
 * in the same way as before, while using the new structured API files.
 * 
 * For new code, prefer importing from './apis' directory directly.
 */

// Re-export apiClient as default for backward compatibility
import apiClient from './apiClient';

// Import all structured APIs
import authAPI from './apis/authAPI';
import usersAPI from './apis/usersAPI';
import officesAPI from './apis/officesAPI';
import attendanceAPI from './apis/attendanceAPI';
import leavesAPI from './apis/leavesAPI';
import resignationsAPI from './apis/resignationsAPI';
import documentsAPI from './apis/documentsAPI';
import documentGenerationAPI from './apis/documentGenerationAPI';
import devicesAPI from './apis/devicesAPI';
import deviceUserAPI from './apis/deviceUserAPI';
import departmentsAPI from './apis/departmentsAPI';
import designationsAPI from './apis/designationsAPI';
import reportsAPI from './apis/reportsAPI';
import dashboardAPI from './apis/dashboardAPI';
import notificationsAPI from './apis/notificationsAPI';
import salaryAPI from './apis/salaryAPI';
import esslAPI from './apis/esslAPI';

// Export all APIs for backward compatibility
export { authAPI, usersAPI, officesAPI, attendanceAPI, leavesAPI, resignationsAPI, documentsAPI, documentGenerationAPI, devicesAPI, deviceUserAPI, departmentsAPI, designationsAPI, reportsAPI, dashboardAPI, notificationsAPI, salaryAPI, esslAPI };

// Convenience methods for backward compatibility
apiClient.getDepartments = () => departmentsAPI.getDepartments();
apiClient.getDepartment = (id) => departmentsAPI.getDepartment(id);
apiClient.getDepartmentDesignations = (departmentId) => departmentsAPI.getDepartmentDesignations(departmentId);
apiClient.getDesignations = () => designationsAPI.getDesignations();
apiClient.getDesignation = (id) => designationsAPI.getDesignation(id);
apiClient.getDesignationsByDepartment = (departmentId) => designationsAPI.getDesignationsByDepartment(departmentId);

// Default export (axios instance)
export default apiClient;
