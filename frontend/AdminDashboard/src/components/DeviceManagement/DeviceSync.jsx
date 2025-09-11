import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import {
  RefreshCw,
  Clock,
  Users,
  Database,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Activity
} from 'lucide-react';

const DeviceSync = ({ device, onSync }) => {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [syncStats, setSyncStats] = useState({
    users_synced: 0,
    records_synced: 0,
    errors: 0
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  useEffect(() => {
    if (device) {
      setLastSync(device.last_sync);
      setAutoSyncEnabled(device.sync_interval > 0);
    }
  }, [device]);

  const handleManualSync = async () => {
    try {
      setSyncStatus('syncing');
      console.log('🔄 Starting manual sync for device:', device.name);
      
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update stats
      setSyncStats({
        users_synced: Math.floor(Math.random() * 10) + 1,
        records_synced: Math.floor(Math.random() * 50) + 10,
        errors: Math.floor(Math.random() * 2)
      });
      
      setLastSync(new Date().toISOString());
      setSyncStatus('completed');
      
      // Call parent sync function
      if (onSync) {
        onSync();
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      setSyncStatus('error');
    }
  };

  const handleToggleAutoSync = async () => {
    try {
      const newStatus = !autoSyncEnabled;
      setAutoSyncEnabled(newStatus);
      
      // This would call the actual API to update device settings
      console.log('🔄 Auto sync toggled:', newStatus);
    } catch (error) {
      console.error('❌ Error toggling auto sync:', error);
      setAutoSyncEnabled(!autoSyncEnabled); // Revert on error
    }
  };

  const getSyncStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'danger';
      case 'syncing':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getSyncStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Sync completed';
      case 'error':
        return 'Sync failed';
      case 'syncing':
        return 'Syncing...';
      default:
        return 'Ready to sync';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Device Synchronization</h3>
          <p className="text-sm text-gray-600">
            Manage data synchronization for {device?.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getSyncStatusColor(syncStatus)}>
            {getSyncStatusText(syncStatus)}
          </Badge>
        </div>
      </div>

      {/* Sync Status Card */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {syncStatus === 'syncing' ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : syncStatus === 'completed' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : syncStatus === 'error' ? (
                <AlertCircle className="w-6 h-6 text-red-600" />
              ) : (
                <Activity className="w-6 h-6 text-gray-600" />
              )}
              <div>
                <h4 className="font-medium text-gray-900">Sync Status</h4>
                <p className="text-sm text-gray-600">
                  {syncStatus === 'syncing' ? 'Synchronizing data...' :
                   syncStatus === 'completed' ? 'Last sync completed successfully' :
                   syncStatus === 'error' ? 'Last sync encountered errors' :
                   'Ready for synchronization'}
                </p>
              </div>
            </div>
            
            <Button
              variant="primary"
              onClick={handleManualSync}
              disabled={syncStatus === 'syncing'}
              className="flex items-center space-x-2"
            >
              {syncStatus === 'syncing' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
            </Button>
          </div>

          {/* Last Sync Info */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last sync: {getLastSyncText(lastSync)}</span>
          </div>

          {/* Auto Sync Settings */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-600" />
              <div>
                <h5 className="font-medium text-gray-900">Auto Sync</h5>
                <p className="text-sm text-gray-600">
                  {autoSyncEnabled 
                    ? `Syncs every ${device?.sync_interval || 5} minutes`
                    : 'Auto sync is disabled'
                  }
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAutoSync}
              className="flex items-center space-x-2"
            >
              {autoSyncEnabled ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Disable</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Enable</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Sync Statistics */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Sync Statistics</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{syncStats.users_synced}</p>
            <p className="text-sm text-blue-700">Users Synced</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{syncStats.records_synced}</p>
            <p className="text-sm text-green-700">Records Synced</p>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-900">{syncStats.errors}</p>
            <p className="text-sm text-red-700">Errors</p>
          </div>
        </div>
      </Card>

      {/* Sync History */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Sync History</h4>
        
        <div className="space-y-3">
          {/* Mock sync history */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Successful sync</p>
                <p className="text-sm text-gray-600">15 users, 45 records synced</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">2 minutes ago</span>
          </div>
          
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Successful sync</p>
                <p className="text-sm text-gray-600">12 users, 38 records synced</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">7 minutes ago</span>
          </div>
          
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">Sync failed</p>
                <p className="text-sm text-gray-600">Connection timeout</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">12 minutes ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DeviceSync;
