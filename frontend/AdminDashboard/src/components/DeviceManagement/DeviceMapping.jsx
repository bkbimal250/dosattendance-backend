import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import {
  Users,
  UserPlus,
  UserMinus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';

const DeviceMapping = ({ device, onRefresh }) => {
  const [mappings, setMappings] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (device) {
      fetchMappings();
      fetchAvailableUsers();
    }
  }, [device]);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      // This would call the actual API
      // const response = await devicesAPI.getDeviceMappings(device.id);
      // setMappings(response.data);
      
      // Mock data for now
      setMappings([
        {
          id: 1,
          user: { id: 1, username: 'john_doe', first_name: 'John', last_name: 'Doe' },
          device_user_id: '001',
          device_username: 'john_doe',
          is_active: true,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          user: { id: 2, username: 'jane_smith', first_name: 'Jane', last_name: 'Smith' },
          device_user_id: '002',
          device_username: 'jane_smith',
          is_active: true,
          created_at: '2024-01-15T11:00:00Z'
        }
      ]);
    } catch (error) {
      console.error('Error fetching mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // This would call the actual API
      // const response = await usersAPI.getUsers();
      // setAvailableUsers(response.data);
      
      // Mock data for now
      setAvailableUsers([
        { id: 3, username: 'bob_wilson', first_name: 'Bob', last_name: 'Wilson' },
        { id: 4, username: 'alice_brown', first_name: 'Alice', last_name: 'Brown' }
      ]);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleAddMapping = async (userId) => {
    try {
      // This would call the actual API
      // await devicesAPI.addDeviceMapping(device.id, { user_id: userId });
      console.log('Adding mapping for user:', userId);
      fetchMappings();
    } catch (error) {
      console.error('Error adding mapping:', error);
    }
  };

  const handleRemoveMapping = async (mappingId) => {
    try {
      // This would call the actual API
      // await devicesAPI.removeDeviceMapping(mappingId);
      console.log('Removing mapping:', mappingId);
      fetchMappings();
    } catch (error) {
      console.error('Error removing mapping:', error);
    }
  };

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = mapping.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.user.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && mapping.is_active) ||
                         (filterStatus === 'inactive' && !mapping.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const getUnmappedUsers = () => {
    const mappedUserIds = mappings.map(m => m.user.id);
    return availableUsers.filter(user => !mappedUserIds.includes(user.id));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mappings...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Device User Mappings</h3>
          <p className="text-sm text-gray-600">
            Manage user mappings for {device?.name}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMappings}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Mappings List */}
      <Card className="p-6">
        <div className="space-y-4">
          {filteredMappings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No mappings found</h4>
              <p className="text-gray-600">No users are currently mapped to this device</p>
            </div>
          ) : (
            filteredMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      mapping.is_active ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {mapping.user.first_name} {mapping.user.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">@{mapping.user.username}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Device ID: {mapping.device_user_id}
                    </p>
                    <p className="text-xs text-gray-600">
                      Mapped: {new Date(mapping.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Badge variant={mapping.is_active ? 'success' : 'danger'}>
                    {mapping.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMapping(mapping.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add New Mapping */}
      <Card className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Mapping</h4>
        
        {getUnmappedUsers().length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">All available users are already mapped</p>
          </div>
        ) : (
          <div className="space-y-3">
            {getUnmappedUsers().map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <h5 className="font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </h5>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddMapping(user.id)}
                  className="flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Map User</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DeviceMapping;
