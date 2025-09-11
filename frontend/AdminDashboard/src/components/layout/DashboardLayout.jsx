import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex">
      {/* Sidebar - Fixed position, no gap */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            <Sidebar />
          </div>
        </div>
      )}
      
      {/* Main content area - No gap, full width */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-3 lg:p-6 overflow-auto" >
        
          <div className="max-w-full mx-auto animate-fade-in" >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
