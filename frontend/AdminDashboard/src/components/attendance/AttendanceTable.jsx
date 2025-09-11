import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  User, 
  Calendar, 
  Clock, 
  Eye,
  LogIn,
  LogOut,
  Timer,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock3,
  CalendarDays,
  CheckCircle
} from 'lucide-react';
import { Button, Card, Badge } from '../ui';
import { formatISTTime, formatTimestampDisplay, getRelativeTime } from '../../utils/timeUtils';

const AttendanceTable = ({ attendanceData, loading, canViewAll, selectedEmployee }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDayStatus, setFilterDayStatus] = useState('');
  const [filterLate, setFilterLate] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  useEffect(() => {
    console.log('🔍 AttendanceTable: Processing attendance data:', {
      data: attendanceData,
      count: Array.isArray(attendanceData) ? attendanceData.length : 'Not an array',
      canViewAll,
      selectedEmployee: selectedEmployee?.username
    });
    
    filterAndSortData();
  }, [attendanceData, searchTerm, filterStatus, filterDayStatus, filterLate, filterDate, sortField, sortDirection]);

  const filterAndSortData = () => {
    if (!Array.isArray(attendanceData)) {
      console.log('❌ AttendanceTable: No valid data array');
      setFilteredData([]);
      return;
    }

    let filtered = [...attendanceData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.device_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter(record => record.status === filterStatus);
    }

    // Apply day status filter
    if (filterDayStatus) {
      filtered = filtered.filter(record => record.day_status === filterDayStatus);
    }

    // Apply late filter
    if (filterLate !== '') {
      const isLate = filterLate === 'true';
      filtered = filtered.filter(record => record.is_late === isLate);
    }

    // Apply date filter
    if (filterDate) {
      const filterDateStr = new Date(filterDate).toISOString().split('T')[0];
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return recordDate === filterDateStr;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'user':
          aValue = `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.toLowerCase();
          bValue = `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'day_status':
          aValue = a.day_status || '';
          bValue = b.day_status || '';
          break;
        case 'is_late':
          aValue = a.is_late || false;
          bValue = b.is_late || false;
          break;
        case 'device_id':
          aValue = a.device_id || '';
          bValue = b.device_id || '';
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    console.log('✅ AttendanceTable: Filtered and sorted data:', {
      originalCount: attendanceData.length,
      filteredCount: filtered.length,
      searchTerm,
      filterStatus,
      filterDayStatus,
      filterLate,
      filterDate
    });

    setFilteredData(filtered);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN':
        return 'bg-green-100 text-green-800';
      case 'OUT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayStatusColor = (dayStatus) => {
    switch (dayStatus) {
      case 'complete_day':
        return 'bg-green-100 text-green-800';
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLateStatusColor = (isLate) => {
    return isLate ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superuser':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-orange-100 text-orange-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportAttendance = () => {
    const csvContent = [
      ['Employee Name', 'Employee ID', 'Department', 'Date', 'Time (IST)', 'Status', 'Day Status', 'Late Coming', 'Late Minutes', 'Device ID', 'Location'],
      ...filteredData.map(record => [
        `${record.user?.first_name || ''} ${record.user?.last_name || ''}`.trim() || record.user?.username || 'N/A',
        record.user?.employee_id || 'N/A',
        record.user?.department?.name || 'N/A',
        formatISTTime(record.timestamp, 'date'),
        formatISTTime(record.timestamp, 'time'),
        record.status,
        record.day_status || 'N/A',
        record.is_late ? 'Yes' : 'No',
        record.late_minutes || 0,
        record.device_id || 'N/A',
        record.location || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return formatISTTime(timestamp, 'datetime');
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ChevronDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  return (
    <Card className="p-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Attendance Records
          </h3>
          <Badge className="bg-blue-100 text-blue-800">
            {filteredData.length} records
          </Badge>
          {selectedEmployee && (
            <Badge className="bg-green-100 text-green-800">
              {selectedEmployee.username}
            </Badge>
          )}
          {!canViewAll && (
            <Badge className="bg-yellow-100 text-yellow-800">
              Your Records Only
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportAttendance}
            className="flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, employee ID, or device..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="IN">Clock In</option>
                <option value="OUT">Clock Out</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day Status</label>
              <select
                value={filterDayStatus}
                onChange={(e) => setFilterDayStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Day Status</option>
                <option value="complete_day">Complete Day</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Coming</label>
              <select
                value={filterLate}
                onChange={(e) => setFilterLate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Late</option>
                <option value="false">On Time</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('');
                  setFilterDayStatus('');
                  setFilterLate('');
                  setFilterDate('');
                  setSearchTerm('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('user')}
              >
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Employee</span>
                  <SortIcon field="user" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Date (IST)</span>
                  <SortIcon field="timestamp" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Time</span>
                  <SortIcon field="timestamp" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <Timer className="w-4 h-4" />
                  <span>Status</span>
                  <SortIcon field="status" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('day_status')}
              >
                <div className="flex items-center space-x-1">
                  <CalendarDays className="w-4 h-4" />
                  <span>Day Status</span>
                  <SortIcon field="day_status" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('is_late')}
              >
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Late Coming</span>
                  <SortIcon field="is_late" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('device_id')}
              >
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>Device</span>
                  <SortIcon field="device_id" />
                </div>
              </th>
              {canViewAll && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {record.user?.first_name && record.user?.last_name 
                          ? `${record.user.first_name} ${record.user.last_name}`
                          : record.user?.username || 'N/A'
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.user?.employee_id || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {record.user?.department?.name || 'No Department'}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div 
                    className="font-medium text-gray-900 cursor-help"
                    title={`Full Date: ${record.ist_time || formatISTTime(record.timestamp, 'datetime')}`}
                  >
                    {record.ist_date || formatISTTime(record.timestamp, 'date')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(record.timestamp).toLocaleDateString('en-US', { 
                      weekday: 'long'
                    })}
                  </div>
                  {/* Show warning if there's a significant time difference between timestamp and created_at */}
                  {record.timestamp && record.created_at && (() => {
                    const timestampDate = new Date(record.timestamp);
                    const createdDate = new Date(record.created_at);
                    const diffDays = Math.abs((createdDate - timestampDate) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays > 1) {
                      return (
                        <div className="text-xs text-yellow-600 mt-1">
                          ⚠️ Sync delay: {Math.round(diffDays)}d
                        </div>
                      );
                    }
                    return null;
                  })()}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {record.ist_time_only || formatISTTime(record.timestamp, 'time')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {record.ist_time ? record.ist_time.replace(' IST', '') : formatISTTime(record.timestamp, 'datetime')}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      record.status === 'IN' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {record.status === 'IN' ? (
                        <LogIn className="w-4 h-4 text-green-600" />
                      ) : (
                        <LogOut className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status === 'IN' ? 'Clock In' : 'Clock Out'}
                    </Badge>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Badge className={getDayStatusColor(record.day_status)}>
                      {record.day_status ? record.day_status.replace('_', ' ').toUpperCase() : 'N/A'}
                    </Badge>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      record.is_late ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      {record.is_late ? (
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <Badge className={getLateStatusColor(record.is_late)}>
                        {record.is_late ? 'Late' : 'On Time'}
                      </Badge>
                      {record.is_late && record.late_minutes && (
                        <div className="text-xs text-orange-600 mt-1">
                          {record.late_minutes} min late
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="font-medium">{record.device_id || 'N/A'}</div>
                  <div className="text-xs text-gray-500">{record.location || 'No location'}</div>
                </td>
                
                {canViewAll && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowRecordModal(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No attendance records found</p>
        </div>
      )}

      {/* Record Details Modal */}
      {showRecordModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Employee ID:</span>
                <span className="text-sm text-gray-900">{selectedRecord.user?.employee_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <span className="text-sm text-gray-900">
                  {selectedRecord.user?.first_name && selectedRecord.user?.last_name 
                    ? `${selectedRecord.user.first_name} ${selectedRecord.user.last_name}`
                    : selectedRecord.user?.username || 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <span className="text-sm text-gray-900">{selectedRecord.user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Department:</span>
                <span className="text-sm text-gray-900">{selectedRecord.user?.department?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Role:</span>
                <Badge className={getRoleColor(selectedRecord.user?.role)}>
                  {selectedRecord.user?.role || 'User'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <Badge className={getStatusColor(selectedRecord.status)}>
                  {selectedRecord.status === 'IN' ? 'Clock In' : 'Clock Out'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Day Status:</span>
                <Badge className={getDayStatusColor(selectedRecord.day_status)}>
                  {selectedRecord.day_status ? selectedRecord.day_status.replace('_', ' ').toUpperCase() : 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Late Coming:</span>
                <Badge className={getLateStatusColor(selectedRecord.is_late)}>
                  {selectedRecord.is_late ? 'Yes' : 'No'}
                </Badge>
              </div>
              {selectedRecord.is_late && selectedRecord.late_minutes && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Late Minutes:</span>
                  <span className="text-sm text-gray-900">{selectedRecord.late_minutes} minutes</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Date:</span>
                <span className="text-sm text-gray-900">{selectedRecord.ist_date || formatISTTime(selectedRecord.timestamp, 'date')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Time:</span>
                <span className="text-sm text-gray-900">{selectedRecord.ist_time_only || formatISTTime(selectedRecord.timestamp, 'time')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Full Timestamp:</span>
                <span className="text-sm text-gray-900">{selectedRecord.ist_time || formatISTTime(selectedRecord.timestamp, 'datetime')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Created:</span>
                <span className="text-sm text-gray-900">{formatISTTime(selectedRecord.created_at, 'datetime')}</span>
              </div>
              {selectedRecord.notes && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Notes:</span>
                  <span className="text-sm text-gray-900 max-w-xs text-right">{selectedRecord.notes}</span>
                </div>
              )}
              {/* Show warning if there's a significant time difference */}
              {selectedRecord.timestamp && selectedRecord.created_at && (
                (() => {
                  const timestampDate = new Date(selectedRecord.timestamp);
                  const createdDate = new Date(selectedRecord.created_at);
                  const diffDays = Math.abs((createdDate - timestampDate) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays > 1) {
                    return (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="text-xs text-yellow-800">
                            Note: This record was created {Math.round(diffDays)} days after the actual attendance time. 
                            This may indicate a delayed sync from the biometric device.
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Device:</span>
                <span className="text-sm text-gray-900">{selectedRecord.device_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Location:</span>
                <span className="text-sm text-gray-900">{selectedRecord.location || 'No location'}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRecordModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AttendanceTable;
