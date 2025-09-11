import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportsAPI } from '../../services/api';
import { 
  Clock, 
  User, 
  Building, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Smartphone
} from 'lucide-react';

const AttendancePage = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  
  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Create WebSocket connection
      const wsUrl = `ws://${window.location.host}/ws/attendance/`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');
        setError(null);
        
        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now()
            }));
          }
        }, 30000); // Ping every 30 seconds
        
        // Request initial data
        wsRef.current.send(JSON.stringify({
          type: 'get_latest'
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connection_established':
              console.log('🔗 WebSocket connection established');
              break;
              
            case 'attendance_update':
              console.log('📊 Received attendance update:', message.data);
              setAttendanceData(message.data);
              setLastUpdate(new Date());
              break;
              
            case 'latest_attendance':
              console.log('📋 Received latest attendance data:', message.data);
              setAttendanceData(message.data);
              setLastUpdate(new Date());
              setIsLoading(false);
              break;
              
            case 'pong':
              console.log('🏓 Pong received:', message.timestamp);
              break;
              
            default:
              console.log('📨 Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (connectionStatus !== 'connecting') {
            setConnectionStatus('connecting');
            connectWebSocket();
          }
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection error');
        setConnectionStatus('error');
      };
      
    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('error');
    }
  }, [connectionStatus]);
  
  // Cleanup on unmount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);
  
  // Manual refresh function
  const handleRefresh = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'get_latest'
      }));
      setIsLoading(true);
    }
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
          <p className="text-gray-600">Live attendance updates via WebSocket</p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : connectionStatus === 'connecting' ? (
              <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              connectionStatus === 'connected' ? 'text-green-600' :
              connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={connectionStatus !== 'connected' || isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Last Update Info */}
      {lastUpdate && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
      
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

export default AttendancePage;
