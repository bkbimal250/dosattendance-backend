import React from 'react';
import { Card, Button } from '../ui';
import { Filter, RefreshCw } from 'lucide-react';

const ReportFilters = ({ 
  selectedYear, 
  selectedMonth, 
  selectedOffice, 
  selectedUser,
  offices = [], 
  users = [],
  onYearChange, 
  onMonthChange, 
  onOfficeChange, 
  onUserChange, 
  onReset 
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Ensure offices and users are arrays
  const safeOffices = Array.isArray(offices) ? offices : [];
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Report Filters
        </h3>
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Year Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
        </div>

        {/* Office Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Office</label>
          <select
            value={selectedOffice}
            onChange={(e) => onOfficeChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Offices</option>
            {safeOffices.map(office => (
              <option key={office.id} value={office.id}>{office.name}</option>
            ))}
          </select>
        </div>

        {/* User Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
          <select
            value={selectedUser}
            onChange={(e) => onUserChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Employees</option>
            {safeUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.employee_id} - {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedOffice || selectedUser) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedOffice && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Office: {safeOffices.find(o => o.id === selectedOffice)?.name || selectedOffice}
              </span>
            )}
            {selectedUser && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Employee: {safeUsers.find(u => u.id === selectedUser)?.first_name || selectedUser}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReportFilters;
