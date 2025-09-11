import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Pagination } from '../components/ui';
import { UserTable, UserForm, UserView } from '../components/Usermanagement';
import {
  Users as UsersIcon,
  Search,
  Filter,
  Plus,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  MapPin,
  DollarSign,
  CreditCard,
  Building2,
  IdCard,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { usersAPI, officesAPI } from '../services/api';
import api from '../services/api';

const Users = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  const [newUser, setNewUser] = useState({
    // Basic Information
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    
    // Employment Information
    employee_id: '',
    biometric_id: '',
    joining_date: '',
    department: '',
    designation: '',
    salary: '',
    role: 'employee',
    office: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    
    // Bank Details
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    bank_branch_name: '',
    
    // System Fields
    is_active: true
  });

  useEffect(() => {
    fetchOffices();
    fetchUsers();
  }, []);

  const fetchOffices = async () => {
    try {
      const response = await officesAPI.getOffices();
      // Handle paginated response: {count, results} or direct array
      if (response.data?.results) {
        setOffices(Array.isArray(response.data.results) ? response.data.results : []);
      } else if (Array.isArray(response.data)) {
        setOffices(response.data);
      } else {
        setOffices([]);
      }
    } catch (error) {
      console.error('Error fetching offices:', error);
      setOffices([]);
    }
  };

  const fetchUsers = async (filters = {}) => {
    try {
      setLoading(true);
      console.log('🔄 Users: Starting to fetch users data...', filters);
      
      const response = await usersAPI.getUsers(filters);
      console.log('📊 Users: API Response Received:');
      console.log('👥 Users API Response:', {
        data: response.data,
        status: response.status,
        headers: response.headers,
        count: Array.isArray(response.data) ? response.data.length : 'Not an array'
      });
      
      const usersData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.results || response.data?.data || [];
      
      console.log('👥 Users: Processed users data:', {
        original: response.data,
        processed: usersData,
        totalRecords: usersData.length,
        roleBreakdown: usersData.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}),
        departmentBreakdown: usersData.reduce((acc, user) => {
          const deptName = user.department?.name || 'No Department';
          acc[deptName] = (acc[deptName] || 0) + 1;
          return acc;
        }, {}),
        activeUsers: usersData.filter(user => user.is_active).length,
        inactiveUsers: usersData.filter(user => !user.is_active).length
      });
      
      setUsers(usersData);
      console.log('✅ Users: All data processed and state updated successfully');
    } catch (error) {
      console.error('❌ Users: Error fetching users:', error);
      console.error('❌ Users: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      setLoading(true);
      const response = await usersAPI.createUser(userData);
      console.log('✅ User created successfully:', response.data);
      setShowAddModal(false);
      setNewUser({
        // Basic Information
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        date_of_birth: '',
        gender: '',
        
        // Employment Information
        employee_id: '',
        biometric_id: '',
        joining_date: '',
        department: '',
        designation: '',
        salary: '',
        role: 'employee',
        office: '',
        
        // Emergency Contact
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        
        // Bank Details
        account_holder_name: '',
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        bank_branch_name: '',
        
        // System Fields
        is_active: true
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('❌ Error creating user:', error);
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      setLoading(true);
      const response = await usersAPI.updateUser(selectedUser.id, userData);
      console.log('✅ User updated successfully:', response.data);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('❌ Error updating user:', error);
      alert(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await usersAPI.deleteUser(user.id);
      console.log('✅ User deleted successfully');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      setLoading(true);
      
      // Only send the fields that are necessary for status update
      const updateData = {
        is_active: !user.is_active
      };
      
      console.log('🔄 Updating user status:', {
        userId: user.id,
        currentStatus: user.is_active,
        newStatus: !user.is_active,
        updateData
      });
      
      // Try PATCH request instead of PUT for partial updates
      let response;
      try {
        response = await api.patch(`/users/${user.id}/`, updateData);
      } catch (patchError) {
        console.warn('PATCH request failed, trying PUT with minimal data:', patchError);
        // Fallback to PUT with minimal data
        response = await usersAPI.updateUser(user.id, updateData);
      }
      
      console.log('✅ User status updated successfully:', response.data);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        userId: user.id,
        currentStatus: user.is_active
      });
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.response?.data?.error ||
                          'Failed to update user status';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Apply filters and fetch users from backend
  const applyFilters = async () => {
    const filters = {};
    
    // Add search term if provided
    if (searchTerm) {
      filters.search = searchTerm;
    }
    
    // Add department filter
    if (selectedDepartment !== 'all') {
      filters.department = selectedDepartment;
    }
    
    // Add role filter
    if (selectedRole !== 'all') {
      filters.role = selectedRole;
    }
    
    // Add office filter
    if (selectedOffice !== 'all') {
      if (selectedOffice === 'no_office') {
        // For users with no office, we'll need to handle this differently
        // since Django doesn't have a direct way to filter for null values
        filters.office = 'null';
      } else {
        filters.office = selectedOffice;
      }
    }
    
    // Add status filter
    if (selectedStatus !== 'all') {
      filters.is_active = selectedStatus === 'active';
    }
    
    console.log('🔍 Applying filters:', filters);
    console.log('🔍 Selected office:', selectedOffice);
    console.log('🔍 Office filter value:', filters.office);
    await fetchUsers(filters);
  };

  // Use users directly since filtering is now done on backend
  const filteredUsers = users;

  // Pagination logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    applyFilters();
  }, [searchTerm, selectedDepartment, selectedRole, selectedOffice, selectedStatus]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Get unique departments for filter - using actual department field from backend
  const departments = [
    ...new Set(users.map(user => user.department).filter(Boolean))
  ];

  // Debug logging for filter data
  console.log('🔍 Filter Debug:', {
    totalUsers: users.length,
    departments: departments,
    selectedDepartment,
    selectedRole,
    selectedOffice,
    searchTerm,
    selectedStatus,
    filteredCount: filteredUsers.length,
    sampleUser: users[0] ? {
      id: users[0].id,
      department: users[0].department,
      role: users[0].role,
      office: users[0].office,
      office_name: users[0].office_name,
      is_active: users[0].is_active
    } : null,
    offices: offices.map(office => ({ id: office.id, name: office.name })),
    officeFilterTest: selectedOffice !== 'all' ? {
      selectedOffice,
      selectedOfficeType: typeof selectedOffice,
      usersWithOffices: users.filter(user => user.office || user.office_name).length,
      usersWithoutOffices: users.filter(user => !user.office && !user.office_name).length,
      sampleFilteredUsers: filteredUsers.slice(0, 3).map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        office: user.office,
        office_name: user.office_name
      }))
    } : null
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all system users and their permissions</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>

          <select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Offices</option>
            <option value="no_office">No Office</option>
            {Array.isArray(offices) && offices.map(office => (
              <option key={office.id} value={office.id}>{office.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setSearchTerm('');
              setSelectedDepartment('all');
              setSelectedRole('all');
              setSelectedOffice('all');
              setSelectedStatus('all');
              setCurrentPage(1);
              // Apply empty filters to fetch all users
              await fetchUsers({});
            }}
            className="flex items-center space-x-1 text-sm"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </Button>

          <div className="flex space-x-1">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center space-x-1 text-sm"
            >
              <List className="w-3 h-3" />
              <span>Table</span>
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center space-x-1 text-sm"
            >
              <Grid3X3 className="w-3 h-3" />
              <span>Grid</span>
            </Button>
          </div>
        </div>
        
        {/* Filter Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Showing {filteredUsers.length} of {users.length} users</span>
              {departments.length > 0 && (
                <span>• Available departments: {departments.join(', ')}</span>
              )}
              {/* Debug info for office filtering */}
              {selectedOffice !== 'all' && (
                <span className="text-blue-600">
                  • Office filter: {selectedOffice === 'no_office' ? 'No Office' : 
                    offices.find(o => o.id === selectedOffice)?.name || selectedOffice}
                </span>
              )}
            </div>
            {(searchTerm || selectedDepartment !== 'all' || selectedRole !== 'all' || selectedOffice !== 'all' || selectedStatus !== 'all') && (
              <div className="flex items-center space-x-2">
                <span>Active filters:</span>
                {searchTerm && (
                  <Badge variant="outline" className="text-xs">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {selectedDepartment !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Department: {selectedDepartment}
                  </Badge>
                )}
                {selectedRole !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Role: {selectedRole}
                  </Badge>
                )}
                {selectedOffice !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Office: {selectedOffice === 'no_office' ? 'No Office' : 
                      offices.find(o => o.id === selectedOffice)?.name || selectedOffice}
                  </Badge>
                )}
                {selectedStatus !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Status: {selectedStatus}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{Array.isArray(users) ? users.length : 0}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {Array.isArray(users) ? users.filter(u => u.is_active).length : 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Managers</p>
              <p className="text-2xl font-bold text-purple-600">
                {Array.isArray(users) ? users.filter(u => u.role === 'manager').length : 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Employees</p>
              <p className="text-2xl font-bold text-orange-600">
                {Array.isArray(users) ? users.filter(u => u.role === 'employee').length : 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-100">
              <IdCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table/Grid */}
      {loading ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </Card>
      ) : (
        <>
          <UserTable
            users={paginatedUsers}
            loading={loading}
            onEdit={handleEditUser}
            onView={handleViewUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleUserStatus}
            viewMode={viewMode}
          />
          
          {/* Pagination */}
          {totalItems > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                showItemsPerPage={true}
                itemsPerPageOptions={[10, 25, 50, 100]}
              />
            </div>
          )}
        </>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UserForm
              user={null}
              departments={Array.isArray(departments) ? departments.map(name => ({ id: name, name })) : []}
              offices={Array.isArray(offices) ? offices : []}
              loading={loading}
              onSubmit={handleCreateUser}
              onCancel={() => setShowAddModal(false)}
              mode="create"
            />
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UserForm
              user={selectedUser}
              departments={Array.isArray(departments) ? departments.map(name => ({ id: name, name })) : []}
              offices={Array.isArray(offices) ? offices : []}
              loading={loading}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              mode="edit"
            />
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UserView
              user={selectedUser}
              onClose={() => {
                setShowViewModal(false);
                setSelectedUser(null);
              }}
              onEdit={handleEditUser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

