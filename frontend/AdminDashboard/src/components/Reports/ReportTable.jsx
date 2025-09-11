import React, { useState } from 'react';
import { Badge } from '../ui';
import { Eye, Download, Filter } from 'lucide-react';

const ReportTable = ({ data, type }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  if (!data) return null;

  const getTableData = () => {
    switch (type) {
      case 'monthly_summary':
        return data.employeeData || [];
      case 'attendance':
        return data.rawData || [];
      default:
        return [];
    }
  };

  const getTableColumns = () => {
    switch (type) {
      case 'monthly_summary':
        return [
          { key: 'user_name', label: 'Employee Name', sortable: true },
          { key: 'employee_id', label: 'Employee ID', sortable: true },
          { key: 'office', label: 'Office', sortable: true },
          { key: 'total_days', label: 'Total Days', sortable: true },
          { key: 'present_days', label: 'Present Days', sortable: true },
          { key: 'absent_days', label: 'Absent Days', sortable: true },
          { key: 'late_days', label: 'Late Days', sortable: true },
          { key: 'attendance_percentage', label: 'Attendance Rate', sortable: true },
          { key: 'total_hours', label: 'Total Hours', sortable: true },
        ];
      case 'attendance':
        return [
          { key: 'user__first_name', label: 'Employee Name', sortable: true },
          { key: 'user__employee_id', label: 'Employee ID', sortable: true },
          { key: 'user__office__name', label: 'Office', sortable: true },
          { key: 'date', label: 'Date', sortable: true },
          { key: 'check_in_time', label: 'Check-in', sortable: false },
          { key: 'check_out_time', label: 'Check-out', sortable: false },
          { key: 'status', label: 'Status', sortable: true },
        ];
      default:
        return [];
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800', label: 'Present' },
      absent: { color: 'bg-red-100 text-red-800', label: 'Absent' },
      late: { color: 'bg-orange-100 text-orange-800', label: 'Late' },
      half_day: { color: 'bg-yellow-100 text-yellow-800', label: 'Half Day' },
      leave: { color: 'bg-blue-100 text-blue-800', label: 'Leave' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  const formatEmployeeName = (record) => {
    const firstName = record.user__first_name || '';
    const lastName = record.user__last_name || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  };

  const getAttendanceRateBadge = (percentage) => {
    let color = 'bg-gray-100 text-gray-800';
    if (percentage >= 90) color = 'bg-green-100 text-green-800';
    else if (percentage >= 80) color = 'bg-blue-100 text-blue-800';
    else if (percentage >= 70) color = 'bg-yellow-100 text-yellow-800';
    else color = 'bg-red-100 text-red-800';
    
    return <Badge className={color}>{percentage}%</Badge>;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortData = (data) => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle nested object properties
      if (sortField.includes('__')) {
        const keys = sortField.split('__');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Handle date sorting
      if (sortField.includes('date') || sortField.includes('time')) {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string sorting
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  };

  const tableData = getTableData();
  const columns = getTableColumns();
  const sortedData = sortData(tableData);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const renderCell = (record, column) => {
    const value = record[column.key];

    switch (column.key) {
      case 'user_name':
        return record.user_name || 'N/A';
      case 'employee_id':
        return record.employee_id || 'N/A';
      case 'office':
        return record.office || 'N/A';
      case 'total_days':
        return value || 0;
      case 'present_days':
        return <span className="text-green-600 font-medium">{value || 0}</span>;
      case 'absent_days':
        return <span className="text-red-600 font-medium">{value || 0}</span>;
      case 'late_days':
        return <span className="text-orange-600 font-medium">{value || 0}</span>;
      case 'attendance_percentage':
        return getAttendanceRateBadge(value || 0);
      case 'total_hours':
        return `${value || 0}h`;
      case 'user__first_name':
        return formatEmployeeName(record);
      case 'user__employee_id':
        return record.user__employee_id || 'N/A';
      case 'user__office__name':
        return record.user__office__name || 'N/A';
      case 'date':
        return formatDate(value);
      case 'check_in_time':
      case 'check_out_time':
        return formatTime(value);
      case 'status':
        return getStatusBadge(value);
      default:
        return value || 'N/A';
    }
  };

  if (tableData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available for this report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortField === column.key && (
                      <span className="text-blue-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((record, index) => (
              <tr key={record.user_id || record.id || index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderCell(record, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTable;
