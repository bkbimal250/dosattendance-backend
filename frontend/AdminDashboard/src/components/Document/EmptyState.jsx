import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FileText, Upload } from 'lucide-react';

const EmptyState = ({ onUploadClick }) => {
  return (
    <Card>
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
        <p className="text-gray-500 mb-4">Upload your first document to get started</p>
        <Button onClick={onUploadClick}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>
    </Card>
  );
};

export default EmptyState;
