import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import {
  Database,
  Wifi,
  WifiOff,
  Settings,
  Users,
  Clock,
  MapPin,
  Edit,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  TestTube,
  Activity,
  UserCheck
} from 'lucide-react';

const DeviceCard = ({ device, onEdit, onSync, syncLoading, onTestConnection }) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);

  useEffect(() => {
    // Set initial real-time data from device props
    if (device) {
      setRealTimeData({
        total_users: device.total_users || 0,
        mapped_users: device.mapped_users || 0,
        recent_attendance_24h: device.recent_attendance_24h || 0,
        recent_attendance_7d: device.recent_attendance_7d || 0,
        connection_status: device.connection_status || 'connected'
      });
    }
  }, [device]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'danger';
      case 'maintenance':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status, isEnabled) => {
    if (!isEnabled) return WifiOff;
    switch (status) {
      case 'active':
        return Wifi;
      case 'inactive':
        return WifiOff;
      case 'maintenance':
        return AlertCircle;
      default:
        return X;
    }
  };

  const getLastSyncText = (lastSync) => {
    if (!lastSync) return 'Never synced';
    
    const now = new Date();
    const syncTime = new Date(lastSync);
    const diffInMinutes = Math.floor((now - syncTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleTestConnection = async () => {
    if (!onTestConnection) return;
    
    setTestingConnection(true);
    try {
      const result = await onTestConnection(device.id);
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({ success: false, message: 'Connection test failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  const StatusIcon = getStatusIcon(device.status, device.is_enabled);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            device.is_enabled && device.status === 'active' 
              ? 'bg-green-100' 
              : 'bg-gray-100'
          }`}>
            <Database className={`w-6 h-6 ${
              device.is_enabled && device.status === 'active' 
                ? 'text-green-600' 
                : 'text-gray-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
            <p className="text-sm text-gray-600">{device.device_type}</p>
          </div>
        </div>
        <Badge variant={getStatusColor(device.status)}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {device.status}
        </Badge>
      </div>

      {/* Device Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{device.location || 'No location'}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Wifi className="w-4 h-4" />
          <span>{device.ip_address}:{device.port}</span>
        </div>
        
        {/* User Statistics */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4 text-blue-600" />
            <div>
              <span className="font-medium text-gray-900">{device.total_users || 0}</span>
              <span className="text-gray-600 ml-1">Total Users</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <UserCheck className="w-4 h-4 text-green-600" />
            <div>
              <span className="font-medium text-gray-900">{device.mapped_users || 0}</span>
              <span className="text-gray-600 ml-1">Mapped Users</span>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="flex items-center space-x-2 text-sm">
            <Activity className="w-4 h-4 text-purple-600" />
            <div>
              <span className="font-medium text-gray-900">{device.recent_attendance_24h || 0}</span>
              <span className="text-gray-600 ml-1">24h Activity</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-orange-600" />
            <div>
              <span className="font-medium text-gray-900">{device.recent_attendance_7d || 0}</span>
              <span className="text-gray-600 ml-1">7d Activity</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Last sync: {getLastSyncText(device.last_sync)}</span>
        </div>
      </div>

      {/* Sync Interval */}
      {device.sync_interval && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Auto sync every {device.sync_interval} minutes
            </span>
          </div>
        </div>
      )}

      {/* Description */}
      {device.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">{device.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={syncLoading}
          className="flex-1 flex items-center justify-center space-x-1"
        >
          {syncLoading ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span>{syncLoading ? 'Syncing...' : 'Sync'}</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestConnection}
          disabled={testingConnection}
          className="flex items-center justify-center"
          title="Test Connection"
        >
          {testingConnection ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          ) : (
            <TestTube className="w-3 h-3" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex items-center justify-center"
          title="Edit Device"
        >
          <Edit className="w-3 h-3" />
        </Button>
      </div>

      {/* Connection Status Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus ? 
              (connectionStatus.success ? 'bg-green-500' : 'bg-red-500') :
              'bg-green-500'  // Always show as connected
          }`}></div>
          <span className="text-xs text-gray-600">
            {connectionStatus ? 
              (connectionStatus.success ? 'Connection test: Connected' : 'Connection test: Failed') :
              'Status: Always Connected'  // Always show as connected
            }
          </span>
        </div>
        {connectionStatus && (
          <p className="text-xs text-gray-500 mt-1">
            {connectionStatus.message}
          </p>
        )}
      </div>
    </Card>
  );
};

export default DeviceCard;
