import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  Upload, 
  Download,
  Eye,
  Trash2,
  Plus,
  Filter,
  Search,
  Calendar,
  UserCheck,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AdminDocumentManagement = ({ 
  onUploadDocument, 
  documents = {}, 
  allUsers = [],
  onBulkDelete,
  onBulkDownload
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    documentType: 'all',
    dateRange: 'all',
    userFilter: 'all',
    statusFilter: 'all'
  });

  const totalDocuments = Object.values(documents).reduce((sum, docs) => sum + (docs?.length || 0), 0);
  const totalUsers = allUsers.length;

  // Calculate document statistics
  const documentStats = [
    { label: 'Total Documents', value: totalDocuments, icon: FileText, color: 'blue' },
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'green' },
    { label: 'Personal Docs', value: documents.personal?.length || 0, icon: FileText, color: 'purple' },
    { label: 'Salary Docs', value: documents.salary?.length || 0, icon: FileText, color: 'orange' },
    { label: 'Educational Docs', value: documents.educational?.length || 0, icon: FileText, color: 'indigo' },
    { label: 'Company Docs', value: documents.company?.length || 0, icon: FileText, color: 'red' },
  ];

  // Document type breakdown
  const documentTypeBreakdown = [
    { type: 'Salary Slips', count: documents.salary?.length || 0, color: 'bg-green-100 text-green-800' },
    { type: 'ID Documents', count: documents.personal?.length || 0, color: 'bg-blue-100 text-blue-800' },
    { type: 'Educational', count: documents.educational?.length || 0, color: 'bg-purple-100 text-purple-800' },
    { type: 'Company Docs', count: documents.company?.length || 0, color: 'bg-orange-100 text-orange-800' },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      red: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[color] || colors.blue;
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === totalDocuments) {
      setSelectedDocuments([]);
    } else {
      const allDocIds = Object.values(documents).flat().map(doc => doc.id);
      setSelectedDocuments(allDocIds);
    }
  };

  const handleBulkDelete = () => {
    if (selectedDocuments.length > 0) {
      if (window.confirm(`Are you sure you want to delete ${selectedDocuments.length} documents? This action cannot be undone.`)) {
        onBulkDelete(selectedDocuments);
        setSelectedDocuments([]);
      }
    }
  };

  const handleBulkDownload = () => {
    if (selectedDocuments.length > 0) {
      onBulkDownload(selectedDocuments);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Admin Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Admin Document Management</h2>
          <p className="text-gray-600">Full control over all documents and user access</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </button>
          <button
            onClick={onUploadDocument}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select
                value={filterOptions.documentType}
                onChange={(e) => setFilterOptions({...filterOptions, documentType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="salary_slip">Salary Slips</option>
                <option value="id_proof">ID Documents</option>
                <option value="educational_certificate">Educational</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={filterOptions.dateRange}
                onChange={(e) => setFilterOptions({...filterOptions, dateRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Filter</label>
              <select
                value={filterOptions.userFilter}
                onChange={(e) => setFilterOptions({...filterOptions, userFilter: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="inactive">Inactive Users</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterOptions.statusFilter}
                onChange={(e) => setFilterOptions({...filterOptions, statusFilter: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {selectedDocuments.length} document(s) selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDownload}
                className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
              <button
                onClick={() => setSelectedDocuments([])}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentStats.map((stat, index) => (
          <div
            key={index}
            className={`p-4 border rounded-lg ${getColorClasses(stat.color)}`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Type Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Document Type Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {documentTypeBreakdown.map((item, index) => (
            <div key={index} className={`p-4 rounded-lg ${item.color} border`}>
              <div className="text-center">
                <p className="text-sm font-medium">{item.type}</p>
                <p className="text-2xl font-bold">{item.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Document Activity</h3>
        <div className="space-y-3">
          {totalDocuments > 0 ? (
            <div className="text-sm text-gray-600">
              <p>• {documents.salary?.length || 0} salary documents uploaded</p>
              <p>• {documents.personal?.length || 0} personal documents managed</p>
              <p>• {documents.educational?.length || 0} educational certificates stored</p>
              <p>• {documents.company?.length || 0} company documents available</p>
              <p>• Total storage used: {totalDocuments} files</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">No documents uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDocumentManagement;
