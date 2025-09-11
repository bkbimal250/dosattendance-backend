import React from 'react';
import { Upload, FileText, DollarSign } from 'lucide-react';

const DocumentHeader = ({ isAdmin, isManager, onUploadDocument, onUploadSalarySlip }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600">
          Manage and organize your documents securely
          {(isAdmin || isManager) && ' - Admin & Manager Access'}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          onClick={onUploadDocument}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </button>
        
        {(isAdmin || isManager) && (
          <button
            onClick={onUploadSalarySlip}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Upload Salary Slip
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentHeader;
