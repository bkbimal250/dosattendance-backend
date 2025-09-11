import React from 'react';

const DocumentTabs = ({ activeTab, setActiveTab, isAdmin, isManager }) => {
  const tabs = [
    { id: 'my-documents', label: 'My Documents', show: true },
    { id: 'admin-documents', label: 'Document Management', show: isAdmin || isManager },
    { id: 'document-generator', label: 'Document Generator', show: isAdmin || isManager },
    { id: 'history', label: 'Document History', show: isAdmin || isManager },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          tab.show && (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          )
        ))}
      </nav>
    </div>
  );
};

export default DocumentTabs;
