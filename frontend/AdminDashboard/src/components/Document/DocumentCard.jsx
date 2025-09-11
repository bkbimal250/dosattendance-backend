import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  User,
  Trash2,
  Edit,
  MoreVertical,
  Clock,
  FileImage,
  FileArchive,
  FileVideo,
  FileAudio,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const DocumentCard = ({ 
  document, 
  category, 
  isAdmin = false, 
  onEdit, 
  onDelete, 
  onView,
  showAdminControls = false 
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const {
    id,
    title,
    description,
    document_type,
    file,
    file_url,
    file_type,
    file_size,
    user,
    uploaded_by,
    created_at,
    updated_at
  } = document;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeColor = (type) => {
    const colors = {
      'salary_slip': 'bg-green-100 text-green-800 border-green-200',
      'offer_letter': 'bg-blue-100 text-blue-800 border-blue-200',
      'id_proof': 'bg-purple-100 text-purple-800 border-purple-200',
      'address_proof': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'aadhar_card': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pan_card': 'bg-red-100 text-red-800 border-red-200',
      'voter_id': 'bg-pink-100 text-pink-800 border-pink-200',
      'driving_license': 'bg-orange-100 text-orange-800 border-orange-200',
      'passport': 'bg-teal-100 text-teal-800 border-teal-200',
      'birth_certificate': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'educational_certificate': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'experience_certificate': 'bg-violet-100 text-violet-800 border-violet-200',
      'medical_certificate': 'bg-rose-100 text-rose-800 border-rose-200',
      'bank_statement': 'bg-amber-100 text-amber-800 border-amber-200',
      'other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || colors.other;
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      'salary_slip': 'Salary Slip',
      'offer_letter': 'Offer Letter',
      'id_proof': 'ID Proof',
      'address_proof': 'Address Proof',
      'aadhar_card': 'Aadhar Card',
      'pan_card': 'PAN Card',
      'voter_id': 'Voter ID',
      'driving_license': 'Driving License',
      'passport': 'Passport',
      'birth_certificate': 'Birth Certificate',
      'educational_certificate': 'Educational Certificate',
      'experience_certificate': 'Experience Certificate',
      'medical_certificate': 'Medical Certificate',
      'bank_statement': 'Bank Statement',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getFileIcon = (fileType) => {
    const icons = {
      'pdf': FileText,
      'doc': FileText,
      'docx': FileText,
      'txt': FileText,
      'jpg': FileImage,
      'jpeg': FileImage,
      'png': FileImage,
      'gif': FileImage,
      'zip': FileArchive,
      'rar': FileArchive,
      'mp4': FileVideo,
      'avi': FileVideo,
      'mp3': FileAudio,
      'wav': FileAudio
    };
    return icons[fileType] || FileText;
  };

  const handleDownload = async () => {
    try {
      // Use the documentsAPI.downloadDocument method
      const response = await fetch(`/api/documents/${id}/download/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = title || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleView = () => {
    if (onView) {
      onView(document);
    } else if (file_url) {
      window.open(file_url, '_blank');
    } else {
      alert('File preview not available');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(document);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this document?')) {
      onDelete(id);
    }
  };

  const FileIcon = getFileIcon(file_type);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300">
      {/* Header with Admin Controls */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1">
          <FileIcon className="w-5 h-5 text-blue-600" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate" title={title}>
              {title}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(document_type)}`}>
                {getDocumentTypeLabel(document_type)}
              </span>
              {showAdminControls && (
                <span className="text-xs text-gray-500">
                  ID: {id.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Admin Actions Menu */}
        {showAdminControls && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={description}>
          {description}
        </p>
      )}

      {/* File Information */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center">
            <FileIcon className="w-3 h-3 mr-1" />
            {file_type?.toUpperCase() || 'Unknown'}
          </span>
          <span>{formatFileSize(file_size)}</span>
        </div>
        
        {/* File URL (Admin Only) */}
        {showAdminControls && file_url && (
          <div className="text-xs text-gray-500 truncate" title={file_url}>
            <span className="font-medium">File URL:</span> {file_url}
          </div>
        )}
      </div>

      {/* User Information */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-xs text-gray-600">
          <User className="w-3 h-3 mr-1" />
          <span className="font-medium">Assigned to:</span>
          <span className="ml-1">
            {user?.first_name} {user?.last_name}
            {user?.employee_id && ` (${user.employee_id})`}
          </span>
        </div>
        
        {uploaded_by && (
          <div className="flex items-center text-xs text-gray-600">
            <User className="w-3 h-3 mr-1" />
            <span className="font-medium">Uploaded by:</span>
            <span className="ml-1">
              {uploaded_by?.first_name} {uploaded_by?.last_name}
              {uploaded_by?.role && ` (${uploaded_by.role})`}
            </span>
          </div>
        )}
      </div>

      {/* Timestamps */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          <span className="font-medium">Created:</span>
          <span className="ml-1">{formatDate(created_at)}</span>
        </div>
        
        {updated_at && updated_at !== created_at && (
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            <span className="font-medium">Updated:</span>
            <span className="ml-1">{formatDate(updated_at)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={handleView}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </button>
          
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </button>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-600 font-medium">Active</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
