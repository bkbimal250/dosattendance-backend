import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ReportsDashboard } from '../components/Reports';
import { AlertCircle } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();

  console.log('🔍 Reports: User data:', {
    user: user,
    role: user?.role,
    hasAccess: user?.role === 'admin' || user?.role === 'manager'
  });

  // Check if user has access to reports
  if (!(user?.role === 'admin' || user?.role === 'manager')) {
    console.log('❌ Reports: Access denied for user');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin or manager privileges to access this page.</p>
        </div>
      </div>
    );
  }

  console.log('✅ Reports: Access granted, rendering ReportsDashboard');
  return <ReportsDashboard />;
};

export default Reports;
