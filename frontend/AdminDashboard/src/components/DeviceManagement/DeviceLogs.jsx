import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Info,
  AlertCircle,
  CheckCircle,
  X,
  Clock
} from 'lucide-react';

const DeviceLogs = ({ device }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (device) {
      fetchLogs();
    }
  }, [device]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // This would call the actual API
      // const response = await devicesAPI.getDeviceLogs(device.id);
      // setLogs(response.data);
      
      // Mock data for now
      setLogs([
        {
          id: 1,
          level: 'info',
          type: 'sync',
          message: 'Device synchronization completed successfully',
          details: '15 users synced, 45 attendance records processed',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          device_id: device?.id
        },
        {
          id: 2,
          level: 'warning',
          type: 'connection',
          message: 'Connection timeout detected',
          details: 'Device was unreachable for 30 seconds',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          device_id: device?.id
        },
        {
          id: 3,
          level: 'error',
          type: 'sync',
          message: 'Failed to sync user data',
          details: 'User ID 123 not found in device database',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          device_id: device?.id
        },
        {
          id: 4,
          level: 'info',
          type: 'user',
          message: 'New user mapped to device',
          details: 'User john_doe mapped with device ID 001',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          device_id: device?.id
        },
        {
          id: 5,
          level: 'info',
          type: 'connection',
          message: 'Device connected successfully',
          details: 'Connection established to 192.168.1.100:4370',
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          device_id: device?.id
        }
      ]);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return X;
      case 'warning':
        return AlertCircle;
      case 'info':
        return Info;
      default:
        return Info;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'sync':
        return 'blue';
      case 'connection':
        return 'green';
      case 'user':
        return 'purple';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - logTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesType = filterType === 'all' || log.type === filterType;
    
    return matchesSearch && matchesLevel && matchesType;
  });

  const handleExportLogs = () => {
    const csvContent = [
      'Timestamp,Level,Type,Message,Details',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.type}","${log.message}","${log.details}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${device?.name}_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading logs...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Device Logs</h3>
          <p className="text-sm text-gray-600">
            Activity logs for {device?.name}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="sync">Sync</option>
            <option value="connection">Connection</option>
            <option value="user">User</option>
            <option value="error">Error</option>
          </select>
        </div>
      </Card>

      {/* Logs List */}
      <Card className="p-6">
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No logs found</h4>
              <p className="text-gray-600">No logs match your current filters</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const LevelIcon = getLevelIcon(log.level);
              
              return (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className={`p-2 rounded-lg ${
                    log.level === 'error' ? 'bg-red-100' :
                    log.level === 'warning' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <LevelIcon className={`w-5 h-5 ${
                      log.level === 'error' ? 'text-red-600' :
                      log.level === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{log.message}</h4>
                        <Badge variant={getLevelColor(log.level)}>
                          {log.level}
                        </Badge>
                        <Badge variant={getTypeColor(log.type)}>
                          {log.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeAgo(log.timestamp)}</span>
                      </div>
                    </div>
                    
                    {log.details && (
                      <p className="text-sm text-gray-600">{log.details}</p>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Log Statistics */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Log Statistics</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Info className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">
              {logs.filter(log => log.level === 'info').length}
            </p>
            <p className="text-sm text-blue-700">Info</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-900">
              {logs.filter(log => log.level === 'warning').length}
            </p>
            <p className="text-sm text-yellow-700">Warnings</p>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-900">
              {logs.filter(log => log.level === 'error').length}
            </p>
            <p className="text-sm text-red-700">Errors</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            <p className="text-sm text-gray-700">Total</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DeviceLogs;
