import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportsAPI } from '../../services/api';
import { 
  Clock, 
  User, 
  Building, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Smartphone,
  Settings,
  Play,
  Pause
} from 'lucide-react';

const AttendancePagePolling = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [isPolling, setIsPolling] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(5000); // 5 seconds default
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0
  });
  
  const intervalRef = useRef(null);
  const lastDataRef = useRef(null);
  
  // Fetch attendance data
  const fetchAttendanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await reportsAPI.getLatestAttendance({
        limit: 20 // Get more records for better overview
      });
      
      if (response.data.success) {
        const newData = response.data.data;
        setAttendanceData(newData);
        setLastUpdate(new Date());
        
        // Calculate statistics
        const stats = {
          totalRecords: newData.length,
          presentCount: newData.filter(record => record.status === 'present').length,
          absentCount: newData.filter(record => record.status === 'absent').length,
          lateCount: newData.filter(record => record.status === 'late').length
        };
        setStats(stats);
        
        // Check if data has changed
        if (lastDataRef.current && JSON.stringify(lastDataRef.current) !== JSON.stringify(newData)) {
          console.log('📊 New attendance data detected');
        }
        lastDataRef.current = newData;
        
      } else {
        setError('Failed to fetch attendance data');
      }
    } catch (error) {
      console.error('❌ Error fetching attendance data:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Start/stop polling
  const togglePolling = useCallback(() => {
    if (isPolling) {
      // Stop polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    } else {
      // Start polling
      fetchAttendanceData();
      intervalRef.current = setInterval(fetchAttendanceData, pollingInterval);
      setIsPolling(true);
    }
  }, [isPolling, pollingInterval, fetchAttendanceData]);
  
  // Change polling interval
  const handleIntervalChange = useCallback((newInterval) => {
    setPollingInterval(newInterval);
    
    // Restart polling with new interval if currently polling
    if (isPolling && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchAttendanceData, newInterval);
    }
  }, [isPolling, fetchAttendanceData]);
  
  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);
  
  // Initialize polling
  useEffect(() => {
    // Initial fetch
    fetchAttendanceData();
    
    // Start polling
    if (isPolling) {
      intervalRef.current = setInterval(fetchAttendanceData, pollingInterval);
    }
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'half_day':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'leave':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'half_day':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Invalid';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-Time Attendance</h1>
          <p className="text-gray-600">Live attendance updates via polling (every {pollingInterval / 1000}s)</p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Polling Toggle */}
          <button
            onClick={togglePolling}
            className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
              isPolling 
                ? 'border-red-300 text-red-700 bg-white hover:bg-red-50' 
                : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isPolling ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Polling
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Polling
              </>
            )}
          </button>
          
          {/* Interval Selector */}
          <select
            value={pollingInterval}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <option value={3000}>3 seconds</option>
            <option value={5000}>5 seconds</option>
            <option value={10000}>10 seconds</option>
            <option value={30000}>30 seconds</option>
          </select>
          
          {/* Manual Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lateCount}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isPolling ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-blue-800">
                Polling: {isPolling ? 'Active' : 'Stopped'}
              </span>
            </div>
            
            {lastUpdate && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-blue-600">
            Next update in: {isPolling ? `${Math.ceil(pollingInterval / 1000)}s` : 'N/A'}
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-gray-600">Loading attendance data...</span>
          </div>
        </div>
      )}
      
      {/* Attendance Data */}
      {!isLoading && attendanceData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Attendance Records ({attendanceData.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Office
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {record.user_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {record.office || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.check_in_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.check_out_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(record.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Smartphone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {record.device || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(record.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && attendanceData.length === 0 && (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance data</h3>
          <p className="mt-1 text-sm text-gray-500">
            No attendance records found. Check your connection or try refreshing.
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendancePagePolling;
