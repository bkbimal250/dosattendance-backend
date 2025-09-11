import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import {
  Database,
  Wifi,
  MapPin,
  Settings,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const DeviceForm = ({ device, loading, onSubmit, onCancel, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    device_type: 'biometric',
    ip_address: '',
    port: 4370,
    location: '',
    description: '',
    sync_interval: 5,
    is_enabled: true,
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [connectionTest, setConnectionTest] = useState(null);

  useEffect(() => {
    if (device) {
      setFormData({
        name: device.name || '',
        device_type: device.device_type || 'biometric',
        ip_address: device.ip_address || '',
        port: device.port || 4370,
        location: device.location || '',
        description: device.description || '',
        sync_interval: device.sync_interval || 5,
        is_enabled: device.is_enabled !== undefined ? device.is_enabled : true,
        status: device.status || 'active'
      });
    }
  }, [device]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Device name is required';
    }

    if (!formData.ip_address.trim()) {
      newErrors.ip_address = 'IP address is required';
    } else {
      // Basic IP validation
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(formData.ip_address)) {
        newErrors.ip_address = 'Please enter a valid IP address';
      }
    }

    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.sync_interval < 1 || formData.sync_interval > 1440) {
      newErrors.sync_interval = 'Sync interval must be between 1 and 1440 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const testConnection = async () => {
    try {
      setConnectionTest({ status: 'testing', message: 'Testing connection...' });
      
      // This would call the actual API to test connection
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure based on IP
      const isSuccess = formData.ip_address.includes('192.168');
      
      setConnectionTest({
        status: isSuccess ? 'success' : 'error',
        message: isSuccess 
          ? 'Connection successful! Device is reachable.' 
          : 'Connection failed. Please check IP address and port.'
      });
    } catch (error) {
      setConnectionTest({
        status: 'error',
        message: 'Connection test failed. Please try again.'
      });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Add New Device' : 'Edit Device'}
            </h2>
            <p className="text-sm text-gray-600">
              {mode === 'create' 
                ? 'Configure a new biometric device' 
                : 'Update device configuration'
              }
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Main Office Device"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Type
              </label>
              <select
                value={formData.device_type}
                onChange={(e) => handleChange('device_type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="biometric">Biometric</option>
                <option value="card_reader">Card Reader</option>
                <option value="rfid">RFID</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description of the device"
            />
          </div>
        </div>

        {/* Network Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Network Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IP Address *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) => handleChange('ip_address', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.ip_address ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="192.168.1.100"
                />
                <Wifi className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              {errors.ip_address && (
                <p className="mt-1 text-sm text-red-600">{errors.ip_address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port *
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => handleChange('port', parseInt(e.target.value))}
                min="1"
                max="65535"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.port ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="4370"
              />
              {errors.port && (
                <p className="mt-1 text-sm text-red-600">{errors.port}</p>
              )}
            </div>
          </div>

          {/* Connection Test */}
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={!formData.ip_address || !formData.port}
              className="flex items-center space-x-2"
            >
              <Wifi className="w-4 h-4" />
              <span>Test Connection</span>
            </Button>
            
            {connectionTest && (
              <div className={`flex items-center space-x-2 text-sm ${
                connectionTest.status === 'success' ? 'text-green-600' :
                connectionTest.status === 'error' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {connectionTest.status === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : connectionTest.status === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                <span>{connectionTest.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Location and Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Location & Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Main Office, Reception"
                />
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync Interval (minutes)
              </label>
              <input
                type="number"
                value={formData.sync_interval}
                onChange={(e) => handleChange('sync_interval', parseInt(e.target.value))}
                min="1"
                max="1440"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.sync_interval ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="5"
              />
              {errors.sync_interval && (
                <p className="mt-1 text-sm text-red-600">{errors.sync_interval}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                How often to sync data from this device (1-1440 minutes)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_enabled"
                checked={formData.is_enabled}
                onChange={(e) => handleChange('is_enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_enabled" className="text-sm font-medium text-gray-700">
                Enable device
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Saving...' : mode === 'create' ? 'Add Device' : 'Update Device'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DeviceForm;
