import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DeviceList } from '../components/DeviceManagement';

const Devices = () => {
  const { user, isAdmin } = useAuth();

  // Check if user has admin access
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access device management. 
            Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DeviceList />
    </div>
  );
};

export default Devices;
