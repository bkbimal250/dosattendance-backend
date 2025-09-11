import React, { useState, useEffect } from 'react';
import { 
  FileX, 
  Filter, 
  Search, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { resignationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ResignationStats, ResignationTable, ResignationDetails } from '../components/ResignationManagement';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Resignations = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resignations, setResignations] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    office: '',
    search: '',
    dateRange: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    loadResignations();
    loadStats();
  }, [filters, pagination.page, pagination.pageSize]);

  const loadResignations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        ...filters
      };
      
      console.log('🔄 Loading resignations with params:', params);
      console.log('🔍 Current user:', user);
      console.log('🔍 Auth token exists:', !!localStorage.getItem('access_token'));
      
      const response = await resignationsAPI.getResignations(params);
      console.log('📊 Resignations API response:', response);
      console.log('📊 Response status:', response.status);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response data:', response.data);
      
      // Handle different response formats
      // Note: resignationsAPI.getResignations returns full axios response object
      if (response.data && Array.isArray(response.data)) {
        console.log('📋 Setting resignations (array format):', response.data);
        setResignations(response.data);
        setPagination(prev => ({ ...prev, total: response.data.length }));
      } else if (response.data && response.data.results) {
        console.log('📋 Setting resignations (results format):', response.data.results);
        console.log('📋 Results count:', response.data.results.length);
        setResignations(response.data.results);
        setPagination(prev => ({ 
          ...prev, 
          total: response.data.count || response.data.results.length 
        }));
      } else {
        console.log('📋 No data found, setting empty array');
        console.log('📋 Response data structure:', response.data);
        setResignations([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }
    } catch (error) {
      console.error('❌ Error loading resignations:', error);
      console.error('❌ Error details:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      setResignations([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 Loading resignation stats...');
      const response = await resignationsAPI.getResignationStats();
      console.log('📊 Stats API response:', response);
      console.log('📊 Stats data:', response.data);
      // Note: resignationsAPI.getResignationStats returns full axios response object
      setStats(response.data || {});
    } catch (error) {
      console.error('❌ Error loading resignation stats:', error);
      console.error('❌ Stats error details:', error.response?.data);
      console.error('❌ Stats error status:', error.response?.status);
      setStats({});
    }
  };

  const handleApprove = async (resignationId) => {
    try {
      console.log('🔄 Starting resignation approval for ID:', resignationId);
      await resignationsAPI.approveResignation(resignationId);
      console.log('✅ Resignation approved successfully, refreshing data...');
      await loadResignations(false); // Don't show loading state
      await loadStats();
      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error approving resignation:', error);
      throw error;
    }
  };

  const handleReject = async (resignationId, data) => {
    try {
      console.log('🔄 Starting resignation rejection for ID:', resignationId);
      await resignationsAPI.rejectResignation(resignationId, data);
      console.log('✅ Resignation rejected successfully, refreshing data...');
      await loadResignations(false); // Don't show loading state
      await loadStats();
      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error rejecting resignation:', error);
      throw error;
    }
  };

  const handleView = (resignation) => {
    setSelectedResignation(resignation);
    setShowDetails(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = (value) => {
    handleFilterChange('search', value);
  };

  const handleRefresh = () => {
    loadResignations();
    loadStats();
  };

  const handleExport = async () => {
    try {
      // Implement export functionality
      console.log('Exporting resignations...');
    } catch (error) {
      console.error('Error exporting resignations:', error);
    }
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resignation Management</h1>
          <p className="text-gray-600 mt-1">Manage employee resignation requests and approvals</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              console.log('🔍 Admin Dashboard Debug Info:');
              console.log('  - Current user:', user);
              console.log('  - Auth token exists:', !!localStorage.getItem('access_token'));
              console.log('  - Current resignations:', resignations);
              console.log('  - Current stats:', stats);
              console.log('  - Loading state:', loading);
            }}
            className="flex items-center"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Debug
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <ResignationStats stats={stats} loading={loading} />

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by employee name or ID..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={statusOptions}
              className="w-full sm:w-48"
            />

            {/* Date Range Filter */}
            <Select
              value={filters.dateRange}
              onChange={(value) => handleFilterChange('dateRange', value)}
              options={dateRangeOptions}
              className="w-full sm:w-48"
            />
          </div>

          {/* Active Filters Count */}
          <div className="flex items-center space-x-2">
            {Object.values(filters).filter(value => value !== '').length > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <Filter className="h-4 w-4 mr-1" />
                <span>
                  {Object.values(filters).filter(value => value !== '').length} filter(s) active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <FileX className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resignation Table */}
      <ResignationTable
        resignations={resignations}
        loading={loading}
        onApprove={handleApprove}
        onReject={handleReject}
        onView={handleView}
        currentUser={user}
      />

      {/* Pagination */}
      {!loading && resignations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resignation Details Modal */}
      {showDetails && selectedResignation && (
        <ResignationDetails
          resignation={selectedResignation}
          onClose={() => {
            setShowDetails(false);
            setSelectedResignation(null);
          }}
        />
      )}

      {/* Empty State */}
      {!loading && resignations.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Resignation Requests</h3>
          <p className="text-gray-500">
            {Object.values(filters).some(value => value !== '') 
              ? 'No resignation requests match your current filters.'
              : 'No resignation requests have been submitted yet.'
            }
          </p>
          {Object.values(filters).some(value => value !== '') && (
            <Button
              variant="outline"
              onClick={() => setFilters({ status: '', office: '', search: '', dateRange: '' })}
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Resignations;
