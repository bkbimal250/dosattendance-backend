import React from 'react';
import { Upload, X, User, Calendar, FileText } from 'lucide-react';

const SalarySlipUploadModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedUser,
  setSelectedUser,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  allUsers
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedUser) {
      alert('Please select an employee');
      return;
    }
    
    const fileInput = e.target.querySelector('input[name="file"]');
    if (!fileInput || fileInput.files.length === 0) {
      alert('Please select a file');
      return;
    }
    
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Salary Slip</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline w-4 h-4 mr-1" />
              Employee *
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Employee</option>
              {allUsers
                .filter(user => user.role === 'employee' || user.role === 'manager')
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} 
                    {user.employee_id && ` (${user.employee_id})`}
                    {user.office && ` - ${user.office.name || user.office}`}
                    {` - ${user.role}`}
                  </option>
                ))}
            </select>
            {allUsers.filter(user => user.role === 'employee' || user.role === 'manager').length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No employees available for salary slip assignment
              </p>
            )}
          </div>
          
          {/* Month and Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Month *
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Year *
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline w-4 h-4 mr-1" />
              Salary Slip File *
            </label>
            <input
              type="file"
              name="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG
            </p>
          </div>
          
          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Upload className="w-4 h-4 mr-2 inline" />
              Upload Salary Slip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalarySlipUploadModal;
