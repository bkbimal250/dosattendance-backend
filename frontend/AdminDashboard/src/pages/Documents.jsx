import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { documentsAPI, usersAPI } from '../services/api';
import {
  DocumentHeader,
  DocumentTabs,
  SearchAndFilters,
  DocumentSection,
  EmptyState,
  AdminDocumentManagement,
  UploadModal
} from '../components/Document';
import { DocumentGenerator } from '../components/DocumentGenerator';
import { 
  User,
  DollarSign,
  Share2,
  Briefcase,
  FileText,
  Shield,
  GraduationCap,
  CreditCard
} from 'lucide-react';

const Documents = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [documents, setDocuments] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState('my-documents');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    document_type: 'other',
    user: user?.id || ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Admin functions
  const handleBulkDelete = async (documentIds) => {
    try {
      setLoading(true);
      // Implement bulk delete logic
      console.log('🗑️ Bulk deleting documents:', documentIds);
      
      // Call API to delete multiple documents
      const deletePromises = documentIds.map(id => 
        documentsAPI.deleteDocument(id).catch(err => {
          console.error(`Failed to delete document ${id}:`, err);
          return null;
        })
      );
      
      await Promise.all(deletePromises);
      
      // Refresh data
      await fetchData();
      setMessage({ type: 'success', text: `Successfully deleted ${documentIds.length} documents` });
    } catch (error) {
      console.error('❌ Bulk delete failed:', error);
      setMessage({ type: 'error', text: 'Failed to delete some documents' });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async (documentIds) => {
    try {
      setLoading(true);
      console.log('📥 Bulk downloading documents:', documentIds);
      
      // For now, download them one by one
      // In production, you might want to create a zip file on the backend
      for (const id of documentIds) {
        try {
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
            a.download = `document_${id}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } catch (err) {
          console.error(`Failed to download document ${id}:`, err);
        }
      }
      
      setMessage({ type: 'success', text: `Downloaded ${documentIds.length} documents` });
    } catch (error) {
      console.error('❌ Bulk download failed:', error);
      setMessage({ type: 'error', text: 'Failed to download some documents' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      console.log('📊 Exporting document data...');
      
      // Export to CSV
      const csvData = [];
      
      // Add header
      csvData.push([
        'Document ID', 'Title', 'Description', 'Document Type', 'File Type', 'File Size',
        'User Name', 'Employee ID', 'Office', 'Role',
        'Uploaded By', 'Created At', 'Updated At'
      ]);
      
      // Add data rows
      Object.values(documents).flat().forEach(doc => {
        csvData.push([
          doc.id,
          doc.title || '',
          doc.description || '',
          doc.document_type || '',
          doc.file_type || '',
          doc.file_size ? formatFileSize(doc.file_size) : '',
          `${doc.user?.first_name || ''} ${doc.user?.last_name || ''}`,
          doc.user?.employee_id || '',
          doc.user?.office?.name || doc.user?.office || '',
          doc.user?.role || '',
          `${doc.uploaded_by?.first_name || ''} ${doc.uploaded_by?.last_name || ''}`,
          doc.created_at || '',
          doc.updated_at || ''
        ]);
      });
      
      // Convert to CSV string
      const csvString = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      // Download CSV file
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'Document data exported successfully' });
    } catch (error) {
      console.error('❌ Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export document data' });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Documents: Starting to fetch data...');
      
      // Fetch documents and users based on user role
      const [documentsRes, usersRes] = await Promise.all([
        // Use main documents endpoint instead of my endpoint to avoid 500 error
        documentsAPI.getDocuments().catch(err => {
          console.warn('⚠️ Documents API failed, using empty array:', err);
          return { data: [] };
        }),
        (isAdmin() || isManager()) ? usersAPI.getUsers().catch(err => {
          console.warn('⚠️ Users API failed, using empty array:', err);
          return { data: [] };
        }) : Promise.resolve({ data: [] })
      ]);
      
      console.log('📊 Documents: API Response Received:', {
        documents: documentsRes.data,
        users: usersRes.data
      });
      
      // Organize documents by category based on backend document types
      const organizedDocs = organizeDocumentsByCategory(Array.isArray(documentsRes.data) ? documentsRes.data : []);
      setDocuments(organizedDocs);
      
      // Process users based on backend response
      if (usersRes.data && Array.isArray(usersRes.data)) {
        // Filter users based on role and office (backend already handles this)
        const availableUsers = usersRes.data.filter(user => user.is_active !== false);
        setAllUsers(availableUsers);
        console.log('👥 Available users for document assignment:', availableUsers.length);
      } else {
        setAllUsers([]);
        console.log('👥 No users available');
      }
      
      console.log('✅ Documents: Data fetched successfully');
    } catch (error) {
      console.error('❌ Documents: Error fetching data:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to fetch data';
      if (error.response?.status === 500) {
        errorMessage = 'Backend server error. Please check if the Django server is running properly.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view documents.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running.';
      }
      
      // Set error state for UI display
      setError({
        message: errorMessage,
        status: error.response?.status || 'Unknown',
        details: error.message,
        retryCount: retryCount + 1
      });
      
      setDocuments({});
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const organizeDocumentsByCategory = (docs) => {
    if (!docs || !Array.isArray(docs)) return {};
    
    const categories = {
      personal: [],
      salary: [],
      educational: [],
      company: [],
      other: []
    };

    docs.forEach(doc => {
      switch (doc.document_type) {
        case 'aadhar_card':
        case 'pan_card':
        case 'voter_id':
        case 'driving_license':
        case 'passport':
        case 'birth_certificate':
          categories.personal.push(doc);
          break;
        case 'salary_slip':
        case 'offer_letter':
        case 'bank_statement':
          categories.salary.push(doc);
          break;
        case 'educational_certificate':
        case 'experience_certificate':
        case 'medical_certificate':
          categories.educational.push(doc);
          break;
        case 'id_proof':
        case 'address_proof':
          categories.company.push(doc);
          break;
        default:
          categories.other.push(doc);
      }
    });

    return categories;
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      const fileInput = e.target.querySelector('input[name="file"]');
      
      if (!fileInput || fileInput.files.length === 0) {
        alert('Please select a file');
        return;
      }
      
      formData.append('file', fileInput.files[0]);
      formData.append('title', uploadFormData.title || fileInput.files[0].name);
      formData.append('description', uploadFormData.description);
      formData.append('document_type', uploadFormData.document_type);
      
      // If admin/manager is uploading for another user
      if ((isAdmin() || isManager()) && uploadFormData.user) {
        formData.append('user', uploadFormData.user);
      }
      
      await documentsAPI.createDocument(formData);
      
      setShowUploadModal(false);
      setUploadFormData({
        title: '',
        description: '',
        document_type: 'other',
        user: user?.id || ''
      });
      fetchData();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  // Updated document types to match backend model
  const documentTypes = [
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

  const filteredDocuments = (docList) => {
    if (!docList) return [];
    
    return docList.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (doc.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || doc.document_type === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0); // Reset retry count
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <DocumentHeader 
        isAdmin={isAdmin()}
        isManager={isManager()}
        onUploadDocument={() => setShowUploadModal(true)}
        onUploadSalarySlip={() => setShowSalaryUploadModal(true)}
      />

      {/* Tabs */}
      <DocumentTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin()}
        isManager={isManager()}
      />

      {/* Search and Filters - Only show for My Documents tab */}
      {activeTab === 'my-documents' && (
        <SearchAndFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          documentTypes={documentTypes}
        />
      )}

      {/* Documents Content */}
      <div className="space-y-6">
        {/* Error Status */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-yellow-800 text-sm">
                ⚠️ <strong>Connection Issue:</strong> {error.message}
              </span>
              <button
                onClick={handleRetry}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {/* My Documents Tab */}
        {activeTab === 'my-documents' && (
          <>
            {/* Personal Documents */}
            <DocumentSection
              title="Personal Documents"
              documents={documents.personal}
              icon={Shield}
              badgeVariant="blue"
              category="personal"
              filteredDocuments={filteredDocuments}
              isAdmin={isAdmin()}
              onEditDocument={(doc) => {
                // Handle document editing
                console.log('Edit document:', doc);
                // You can implement edit modal here
              }}
              onDeleteDocument={(id) => {
                // Handle document deletion
                if (window.confirm('Are you sure you want to delete this document?')) {
                  handleBulkDelete([id]);
                }
              }}
              onViewDocument={(doc) => {
                // Handle document viewing
                console.log('View document:', doc);
                if (doc.file_url) {
                  window.open(doc.file_url, '_blank');
                }
              }}
            />

            {/* Salary Documents */}
            <DocumentSection
              title="Salary Documents"
              documents={documents.salary}
              icon={DollarSign}
              badgeVariant="green"
              category="salary"
              filteredDocuments={filteredDocuments}
              isAdmin={isAdmin()}
              onEditDocument={(doc) => {
                console.log('Edit document:', doc);
              }}
              onDeleteDocument={(id) => {
                if (window.confirm('Are you sure you want to delete this document?')) {
                  handleBulkDelete([id]);
                }
              }}
              onViewDocument={(doc) => {
                console.log('View document:', doc);
                if (doc.file_url) {
                  window.open(doc.file_url, '_blank');
                }
              }}
            />

            {/* Educational Documents */}
            <DocumentSection
              title="Educational & Experience"
              documents={documents.educational}
              icon={GraduationCap}
              badgeVariant="purple"
              category="educational"
              filteredDocuments={filteredDocuments}
              isAdmin={isAdmin()}
              onEditDocument={(doc) => {
                console.log('Edit document:', doc);
              }}
              onDeleteDocument={(id) => {
                if (window.confirm('Are you sure you want to delete this document?')) {
                  handleBulkDelete([id]);
                }
              }}
              onViewDocument={(doc) => {
                console.log('View document:', doc);
                if (doc.file_url) {
                  window.open(doc.file_url, '_blank');
                }
              }}
            />

            {/* Company Documents */}
            <DocumentSection
              title="Company Documents"
              documents={documents.company}
              icon={Briefcase}
              badgeVariant="orange"
              category="company"
              filteredDocuments={filteredDocuments}
              isAdmin={isAdmin()}
              onEditDocument={(doc) => {
                console.log('Edit document:', doc);
              }}
              onDeleteDocument={(id) => {
                if (window.confirm('Are you sure you want to delete this document?')) {
                  handleBulkDelete([id]);
                }
              }}
              onViewDocument={(doc) => {
                console.log('View document:', doc);
                if (doc.file_url) {
                  window.open(doc.file_url, '_blank');
                }
              }}
            />

            {/* Other Documents */}
            <DocumentSection
              title="Other Documents"
              documents={documents.other}
              icon={FileText}
              badgeVariant="gray"
              category="other"
              filteredDocuments={filteredDocuments}
              isAdmin={isAdmin()}
              onEditDocument={(doc) => {
                console.log('Edit document:', doc);
              }}
              onDeleteDocument={(id) => {
                if (window.confirm('Are you sure you want to delete this document?')) {
                  handleBulkDelete([id]);
                }
              }}
              onViewDocument={(doc) => {
                console.log('View document:', doc);
                if (doc.file_url) {
                  window.open(doc.file_url, '_blank');
                }
              }}
            />

            {/* Empty State */}
            {Object.values(documents).every(category => !category || category.length === 0) && (
              <EmptyState onUploadClick={() => setShowUploadModal(true)} />
            )}
          </>
        )}

        {activeTab === 'admin-documents' && (isAdmin() || isManager()) && (
          <AdminDocumentManagement 
            onUploadDocument={() => setShowUploadModal(true)}
            documents={documents}
            allUsers={allUsers}
            onBulkDelete={handleBulkDelete}
            onBulkDownload={handleBulkDownload}
          />
        )}

        {activeTab === 'document-generator' && (isAdmin() || isManager()) && (
          <DocumentGenerator />
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleFileUpload}
        formData={uploadFormData}
        setFormData={setUploadFormData}
        documentTypes={documentTypes}
        allUsers={allUsers}
        isAdmin={isAdmin()}
        isManager={isManager()}
        currentUser={user}
      />
    </div>
  );
};

export default Documents;
