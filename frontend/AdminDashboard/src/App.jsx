import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import pages
import Login from './pages/Login';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Documents from './pages/Documents';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Devices from './pages/Devices';
import Offices from './pages/Offices';
import Resignations from './pages/Resignations';
import ResignationsSimple from './pages/ResignationsSimple';

// Import layout
import DashboardLayout from './components/layout/DashboardLayout';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, managerOrAdmin = false }) => {
  const { user, loading, authenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !(user?.is_superuser || user?.role === 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (managerOrAdmin && !(user?.is_superuser || user?.role === 'admin' || user?.role === 'manager')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Component
const AppContent = () => {
  const { user, authenticated } = useAuth();

  if (!authenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} /> 
      </Routes>
    );
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        
        {/* Document management - Admin and Manager access */}
        <Route 
          path="/documents" 
          element={
            <ProtectedRoute managerOrAdmin>
              <Documents />
            </ProtectedRoute>
          } 
        />
        
        {/* Resignations - Admin and Manager access */}
        <Route 
          path="/resignations" 
          element={
            <ProtectedRoute managerOrAdmin>
              <Resignations />
            </ProtectedRoute>
          } 
        />
        
        {/* Notifications - Admin and Manager access */}
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute managerOrAdmin>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        
        {/* Profile - All authenticated users */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Reports - Admin and Manager access */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute managerOrAdmin>
              <Reports />
            </ProtectedRoute>
          } 
        />
        
        {/* Users - Admin and Manager access */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute managerOrAdmin>
              <Users />
            </ProtectedRoute>
          } 
        />
        
        {/* Devices - Admin and Manager access */}
        <Route 
          path="/devices" 
          element={
            <ProtectedRoute managerOrAdmin>
              <Devices />
            </ProtectedRoute>
          } 
        />
        
        {/* Offices - Admin only */}
        <Route 
          path="/offices" 
          element={
            <ProtectedRoute adminOnly>
              <Offices />
            </ProtectedRoute>
          } 
        />
        
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

// App Component with Providers
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
