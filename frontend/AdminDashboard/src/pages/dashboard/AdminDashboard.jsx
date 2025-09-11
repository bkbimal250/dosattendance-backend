import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { 
  UsersIcon, RefreshCw, UserCheck, UserX,
  Building2, Target, Shield, AlertCircle
} from 'lucide-react';
import { dashboardAPI, usersAPI, devicesAPI, officesAPI, leavesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import StatsCards from '../../components/dashboard/StatsCards';
import UsersGrid from '../../components/dashboard/UsersGrid';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [offices, setOffices] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      fetchDashboardData();
      setLastUpdate(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 AdminDashboard: Starting to fetch dashboard data...');
      
      // Fetch data individually to better handle errors
      console.log('📊 Fetching dashboard stats...');
      const statsRes = await dashboardAPI.getStats();
      console.log('📊 Stats Response:', statsRes);
      
      console.log('👥 Fetching users...');
      const usersRes = await usersAPI.getUsers();
      console.log('👥 Users Response:', usersRes);
      
      console.log('📱 Fetching devices...');
      const devicesRes = await devicesAPI.getDevices();
      console.log('📱 Devices Response:', devicesRes);
      
      console.log('🏢 Fetching offices...');
      const officesRes = await officesAPI.getOffices();
      console.log('🏢 Offices Response:', officesRes);
      
      console.log('📅 Fetching pending leaves...');
      const leavesRes = await leavesAPI.getPendingLeaves();
      console.log('📅 Leaves Response:', leavesRes);
      
      
      // Process responses with better error handling
      // Backend returns paginated responses: {count, next, previous, results}
      setStats(statsRes?.data || {});
      
      if (usersRes?.data?.results) {
        setAllUsers(Array.isArray(usersRes.data.results) ? usersRes.data.results : []);
        console.log('✅ Users set:', Array.isArray(usersRes.data.results) ? usersRes.data.results.length : 'Not array');
      } else if (usersRes?.data && Array.isArray(usersRes.data)) {
        setAllUsers(usersRes.data);
        console.log('✅ Users set (direct array):', usersRes.data.length);
      } else {
        console.log('❌ No users data in response');
        setAllUsers([]);
      }
      
      if (devicesRes?.data?.results) {
        setDevices(Array.isArray(devicesRes.data.results) ? devicesRes.data.results : []);
        console.log('✅ Devices set:', Array.isArray(devicesRes.data.results) ? devicesRes.data.results.length : 'Not array');
      } else if (devicesRes?.data && Array.isArray(devicesRes.data)) {
        setDevices(devicesRes.data);
        console.log('✅ Devices set (direct array):', devicesRes.data.length);
      } else {
        console.log('❌ No devices data in response');
        setDevices([]);
      }
      
      if (officesRes?.data?.results) {
        setOffices(Array.isArray(officesRes.data.results) ? officesRes.data.results : []);
        console.log('✅ Offices set:', Array.isArray(officesRes.data.results) ? officesRes.data.results.length : 'Not array');
      } else if (officesRes?.data && Array.isArray(officesRes.data)) {
        setOffices(officesRes.data);
        console.log('✅ Offices set (direct array):', officesRes.data.length);
      } else {
        console.log('❌ No offices data in response');
        setOffices([]);
      }
      
      if (leavesRes?.data?.results) {
        setPendingLeaves(Array.isArray(leavesRes.data.results) ? leavesRes.data.results : []);
        console.log('✅ Pending leaves set:', Array.isArray(leavesRes.data.results) ? leavesRes.data.results.length : 'Not array');
      } else if (leavesRes?.data && Array.isArray(leavesRes.data)) {
        setPendingLeaves(leavesRes.data);
        console.log('✅ Pending leaves set (direct array):', leavesRes.data.length);
      } else {
        console.log('❌ No pending leaves data in response');
        setPendingLeaves([]);
      }
      
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  // Prepare stats data for StatsCards component
  const statCards = [
    {
      title: 'Total Employees',
      value: formatNumber(allUsers.filter(u => u.role === 'employee').length),
      change: '+12%',
      changeType: 'increase',
      color: 'blue',
      icon: UsersIcon
    },
    {
      title: 'Active Users',
      value: formatNumber(allUsers.filter(u => u.is_active).length),
      change: '+8%',
      changeType: 'increase',
      color: 'green',
      icon: UserCheck
    },
    {
      title: 'Total Offices',
      value: formatNumber(Array.isArray(offices) ? offices.length : 0),
      change: '+2',
      changeType: 'increase',
      color: 'indigo',
      icon: Building2
    },
    {
      title: 'Total Devices',
      value: formatNumber(Array.isArray(devices) ? devices.length : 0),
      change: '+1',
      changeType: 'increase',
      color: 'orange',
      icon: Target
    },
    {
      title: 'Pending Leaves',
      value: formatNumber(Array.isArray(pendingLeaves) ? pendingLeaves.length : 0),
      change: '-3',
      changeType: 'decrease',
      color: 'yellow',
      icon: AlertCircle
    },
    {
      title: 'Managers',
      value: formatNumber(Array.isArray(allUsers) ? allUsers.filter(u => u.role === 'manager').length : 0),
      change: '+1',
      changeType: 'increase',
      color: 'purple',
      icon: Shield
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-600">Monitor and manage your attendance system</p>
          <p className="text-xs text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm" className="flex items-center space-x-1">
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatsCards statCards={statCards} />

      {/* Recent Users Grid */}
      <UsersGrid recentUsers={allUsers.slice(0, 6)} />

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Offices Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Offices</h3>
            <Badge className="bg-indigo-100 text-indigo-800">
              {Array.isArray(offices) ? offices.length : 0}
            </Badge>
          </div>
          <div className="space-y-2">
            {Array.isArray(offices) && offices.length > 0 ? (
              offices.slice(0, 3).map((office) => (
                <div key={office.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{office.name}</div>
                    <div className="text-xs text-gray-500">{office.city}, {office.country}</div>
                  </div>
                  <Badge variant={office.is_active ? 'success' : 'danger'} size="sm">
                    {office.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-3 text-sm">No offices available</div>
            )}
          </div>
        </Card>

        {/* Devices Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Devices</h3>
            <Badge className="bg-orange-100 text-orange-800">
              {Array.isArray(devices) ? devices.length : 0}
            </Badge>
          </div>
          <div className="space-y-2">
            {Array.isArray(devices) && devices.length > 0 ? (
              devices.slice(0, 3).map((device) => (
                <div key={device.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{device.name}</div>
                    <div className="text-xs text-gray-500">{device.device_type} • {device.ip_address}</div>
                  </div>
                  <Badge variant={device.is_active ? 'success' : 'danger'} size="sm">
                    {device.is_active ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-3 text-sm">No devices available</div>
            )}
          </div>
        </Card>

        {/* Pending Leaves Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Pending Leaves</h3>
            <Badge className="bg-yellow-100 text-yellow-800">
              {Array.isArray(pendingLeaves) ? pendingLeaves.length : 0}
            </Badge>
          </div>
          <div className="space-y-2">
            {Array.isArray(pendingLeaves) && pendingLeaves.length > 0 ? (
              pendingLeaves.slice(0, 3).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {leave.user?.first_name} {leave.user?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">{leave.leave_type}</div>
                  </div>
                  <Badge variant="warning" size="sm">Pending</Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-3 text-sm">No pending leaves</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
