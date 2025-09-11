import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { 
  Menu, 
  Bell, 
  Search, 
  User,
  Settings,
  LogOut
} from 'lucide-react';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 py-3 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between max-w-full">
        {/* Left side - Mobile menu */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 flex-shrink-0 transition-all duration-200"
          >
            <Menu className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Center - Company Name */}
        <div className="flex-1 flex justify-center">
          <h2 className="text-lg font-semibold text-red-500">Disha Online Solution</h2>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 flex-shrink-0">

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user?.first_name || user?.username || 'User'} {user?.last_name || ''}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.is_superuser ? 'Administrator' : user?.role || 'User'}
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200/50 py-1 z-50 animate-scale-in">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {user?.email}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
                >
                  <User className="w-3 h-3 mr-2 text-gray-400 group-hover:text-gray-600" />
                  Profile
                </button>
                
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
                >
                  <Settings className="w-3 h-3 mr-2 text-gray-400 group-hover:text-gray-600" />
                  Settings
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-all duration-200 group"
                >
                  <LogOut className="w-3 h-3 mr-2 text-red-500 group-hover:text-red-600" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    
    </header>
  );
};

export default Header;
