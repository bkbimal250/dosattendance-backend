import React from 'react';
import { Card, Badge } from '../ui';
import {
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Database,
  Activity
} from 'lucide-react';

const DeviceStatus = ({ device }) => {
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
        return AlertCircle;
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

  const StatusIcon = getStatusIcon(device.status, device.is_enabled);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-5 h-5 ${
              device.is_enabled && device.status === 'active' 
                ? 'text-green-600' 
                : 'text-red-600'
            }`} />
            <span className="text-sm font-medium text-gray-900">Status</span>
          </div>
          <Badge variant={getStatusColor(device.status)}>
            {device.status}
          </Badge>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            device.is_enabled && device.status === 'active' 
              ? 'bg-green-500' 
              : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {device.is_enabled && device.status === 'active' 
              ? 'Connected and active' 
              : 'Not connected'}
          </span>
        </div>

        {/* Device Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Database className="w-4 h-4" />
            <span>{device.ip_address}:{device.port}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{device.user_count || 0} users mapped</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last sync: {getLastSyncText(device.last_sync)}</span>
          </div>
          
          {device.sync_interval && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Activity className="w-4 h-4" />
              <span>Auto sync: {device.sync_interval}min</span>
            </div>
          )}
        </div>

        {/* Health Indicators */}
        <div className="pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                device.is_enabled ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-600">Enabled</span>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                device.last_sync ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-xs text-gray-600">Synced</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DeviceStatus;
