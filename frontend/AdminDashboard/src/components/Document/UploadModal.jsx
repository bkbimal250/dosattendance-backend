import React, { useState, useEffect } from 'react';
import { X, Upload, User, Calendar, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const UploadModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  documentTypes,
  allUsers = [],
  isAdmin = false,
  isManager = false,
  currentUser
}) => {
  const [errors, setErrors] = useState({});
  const [fileInfo, setFileInfo] = useState(null);

  if (!isOpen) return null;

  // Document type choices from backend model
  const documentTypeChoices = [
    { value: 'salary_slip', label: 'Salary Slip' },
    { value: 'offer_letter', label: 'Offer Letter' },
    { value: 'id_proof', label: 'ID Proof' },
    { value: 'address_proof', label: 'Address Proof' },
    { value: 'aadhar_card', label: 'Aadhar Card' },
    { value: 'pan_card', label: 'PAN Card' },
    { value: 'voter_id', label: 'Voter ID' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'passport', label: 'Passport' },
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'educational_certificate', label: 'Educational Certificate' },
    { value: 'experience_certificate', label: 'Experience Certificate' },
    { value: 'medical_certificate', label: 'Medical Certificate' },
    { value: 'bank_statement', label: 'Bank Statement' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.document_type) newErrors.document_type = 'Document type is required';
    if (!formData.user) newErrors.user = 'User assignment is required';
    if (!fileInfo) newErrors.file = 'File is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Clear errors and submit
    setErrors({});
    onSubmit(e);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Update form data with file
      const newFormData = { ...formData };
      newFormData.file = file;
      setFormData(newFormData);
      
      // Clear file error
      if (errors.file) {
        setErrors({ ...errors, file: null });
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const canSelectUser = isAdmin || isManager;
  const isRequired = (field) => errors[field] ? 'border-red-500' : 'border-gray-300';

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Document Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Document Information
            </h3>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRequired('title')}`}
                placeholder="Enter document title"
                required
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter document description (optional)"
                rows="3"
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={(e) => handleInputChange('document_type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRequired('document_type')}`}
                required
              >
                <option value="">Select Document Type</option>
                {documentTypeChoices.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.document_type && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.document_type}
                </p>
              )}
            </div>
          </div>

          {/* User Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              User Assignment
            </h3>
            
            {/* User Selection - Only for Admin/Manager */}
            {canSelectUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline w-4 h-4 mr-1" />
                  Assign to User <span className="text-red-500">*</span>
                </label>
                <select
                  name="user"
                  value={formData.user}
                  onChange={(e) => handleInputChange('user', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRequired('user')}`}
                  required
                >
                  <option value="">Select User</option>
                  {/* Show current user first */}
                  {currentUser && (
                    <option value={currentUser.id}>
                      {currentUser.first_name} {currentUser.last_name} (Me) - {currentUser.role}
                    </option>
                  )}
                  {/* Show other available users */}
                  {allUsers
                    .filter(user => !currentUser || user.id !== currentUser.id)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} 
                        {user.employee_id && ` (${user.employee_id})`}
                        {user.office && ` - ${user.office.name || user.office}`}
                        {` - ${user.role}`}
                      </option>
                    ))}
                </select>
                {errors.user && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.user}
                  </p>
                )}
                {allUsers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No users available for document assignment
                  </p>
                )}
              </div>
            )}

            {/* Admin Notes (Admin Only) */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  name="admin_notes"
                  value={formData.admin_notes || ''}
                  onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Internal notes for administrators (optional)"
                  rows="2"
                />
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              File Upload
            </h3>
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Upload className="inline w-4 h-4 mr-1" />
                File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="file"
                onChange={handleFileChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRequired('file')}`}
                required
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              {errors.file && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.file}
                </p>
              )}
              
              {/* File Info Display */}
              {fileInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">File Selected</span>
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>Name:</strong> {fileInfo.name}</p>
                    <p><strong>Size:</strong> {formatFileSize(fileInfo.size)}</p>
                    <p><strong>Type:</strong> {fileInfo.type}</p>
                  </div>
                </div>
              )}
            </div>

            {/* File Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">File Requirements:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Supported formats: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF</li>
                <li>• Maximum file size: 10MB</li>
                <li>• File name should be descriptive and clear</li>
              </ul>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
