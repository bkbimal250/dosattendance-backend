import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import { Search, User, X, Users } from 'lucide-react';

const EmployeeSearch = ({ users, selectedEmployee, onEmployeeSelect, canViewAll, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!users || users.length === 0) {
      setFilteredUsers([]);
      return;
    }

    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // If user can't view all records, show only current user
    if (!canViewAll) {
      filtered = filtered.filter(user => user.id === currentUser?.id);
    }

    setFilteredUsers(filtered.slice(0, 10)); // Limit to 10 results
  }, [users, searchTerm, canViewAll, currentUser]);

  const handleEmployeeSelect = (employee) => {
    onEmployeeSelect(employee);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const clearSelection = () => {
    onEmployeeSelect(null);
    setSearchTerm('');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superuser':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-orange-100 text-orange-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Employee Search</h3>
        {!canViewAll && (
          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
            Your Records Only
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={canViewAll ? "Search employees..." : "Search your records..."}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Employee */}
        {selectedEmployee && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedEmployee.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedEmployee.employee_id || 'No ID'} • {selectedEmployee.department?.name || 'No Department'}
                  </p>
                </div>
              </div>
              <Button
                onClick={clearSelection}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Search Results Dropdown */}
        {showDropdown && searchTerm && filteredUsers.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleEmployeeSelect(user)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.employee_id || 'No ID'} • {user.department?.name || 'No Department'}
                      </p>
                    </div>
                  </div>
                  <Badge className={getRoleColor(user.role)}>
                    {user.role || 'User'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {showDropdown && searchTerm && filteredUsers.length === 0 && (
          <div className="p-3 text-center text-gray-500 text-sm">
            No employees found
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button
            onClick={() => onEmployeeSelect(null)}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Users className="w-4 h-4 mr-2" />
            View All Records
          </Button>
          
          {canViewAll && (
            <p className="text-xs text-gray-500 text-center">
              {users.length} total employees
            </p>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </Card>
  );
};

export default EmployeeSearch;
