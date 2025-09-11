import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UsersIcon, 
  FileText, 
  Bell, 
  BarChart3,
  Monitor,
  Building2,
  Shield,
  FileX
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true
    },
    // Admin-only items
    {
      name: 'User Management',
      href: '/users',
      icon: UsersIcon,
      show: user?.is_superuser || user?.role === 'admin'
    },
    {
      name: 'Devices',
      href: '/devices',
      icon: Monitor,
      show: user?.is_superuser || user?.role === 'admin'
    },
    // Office Management Section
    {
      name: 'Offices',
      href: '/offices',
      icon: Building2,
      show: user?.is_superuser || user?.role === 'admin'
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      show: user?.is_superuser || user?.role === 'admin'
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: FileText,
      show: user?.is_superuser || user?.role === 'admin'
    },
    {
      name: 'Resignations',
      href: '/resignations',
      icon: FileX,
      show: user?.is_superuser || user?.role === 'admin' || user?.role === 'manager'
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      show: user?.is_superuser || user?.role === 'admin'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UsersIcon,
      show: user?.is_superuser || user?.role === 'admin'
    }
  ];

  const filteredItems = navigationItems.filter(item => item.show);

  return (
    <div className={`bg-gradient-to-b from-gray-900 to-gray-800 shadow-lg transition-all duration-300 h-full ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              
              <div>
                <span className="text-sm font-semibold text-white">Disha Online Solution</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <img 
                  src="/companylogo.png" 
                  alt="Disha Online Solution" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <Shield className="w-5 h-5 text-white hidden" />
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-all duration-200 group"
          >
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 group relative ${
                  active
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md transform scale-[1.02]'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:transform hover:scale-[1.02]'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                )}
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                {!isCollapsed && <span className="transition-colors duration-200">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-3 border-t border-gray-700/50">
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center shadow-md">
                <UsersIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.is_superuser || user?.role === 'admin' ? 'Administrator' : user?.role || 'User'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
