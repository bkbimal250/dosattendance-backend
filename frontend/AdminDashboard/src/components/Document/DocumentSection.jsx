import React from 'react';
import DocumentCard from './DocumentCard';

const DocumentSection = ({ 
  title, 
  documents = [], 
  icon: Icon, 
  badgeVariant, 
  category,
  filteredDocuments,
  isAdmin = false,
  onEditDocument,
  onDeleteDocument,
  onViewDocument
}) => {
  const displayDocuments = filteredDocuments ? filteredDocuments(documents) : documents;

  if (!displayDocuments || displayDocuments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${badgeVariant}-100 text-${badgeVariant}-800`}>
          {displayDocuments.length} {displayDocuments.length === 1 ? 'document' : 'documents'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayDocuments.map((document) => (
          <DocumentCard 
            key={document.id} 
            document={document}
            category={category}
            isAdmin={isAdmin}
            showAdminControls={isAdmin}
            onEdit={onEditDocument}
            onDelete={onDeleteDocument}
            onView={onViewDocument}
          />
        ))}
      </div>
    </div>
  );
};

export default DocumentSection;
