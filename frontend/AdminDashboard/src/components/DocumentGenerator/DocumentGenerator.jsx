import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Download, 
  Eye, 
  Send, 
  Plus,
  Calendar,
  DollarSign,
  Briefcase,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { documentGenerationAPI } from '../../services/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { downloadDocument } from '../../utils/pdfGenerator';

const DocumentGenerator = () => {
  const [employees, setEmployees] = useState([]);
  const [generatedDocuments, setGeneratedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Document generation form state
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [documentType, setDocumentType] = useState('offer_letter');
  const [formData, setFormData] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  
  // Document types - matching backend templates
  const documentTypes = [
    { 
      value: 'offer_letter', 
      label: 'Offer Letter', 
      icon: Briefcase,
      description: 'Generate professional offer letters for new employees',
      fields: ['position', 'start_date', 'starting_salary']
    },
    { 
      value: 'salary_increment', 
      label: 'Salary Increment Letter', 
      icon: DollarSign,
      description: 'Create salary increment letters for existing employees',
      fields: ['previous_salary', 'new_salary', 'effective_date']
    },
    { 
      value: 'salary_slip', 
      label: 'Salary Slip', 
      icon: FileText,
      description: 'Generate monthly salary slips for employees',
      fields: ['salary_month', 'salary_year', 'basic_salary', 'extra_days_pay']
    },
    { 
      value: 'appointment_letter', 
      label: 'Appointment Letter', 
      icon: User,
      description: 'Generate formal appointment letters',
      fields: ['position', 'start_date', 'department']
    },
    { 
      value: 'experience_certificate', 
      label: 'Experience Certificate', 
      icon: FileText,
      description: 'Generate experience certificates for employees',
      fields: ['start_date', 'end_date', 'position']
    },
    { 
      value: 'relieving_letter', 
      label: 'Relieving Letter', 
      icon: FileText,
      description: 'Generate relieving letters for departing employees',
      fields: ['last_working_date', 'reason']
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  // Filter employees based on search term
  useEffect(() => {
    if (!employees || !Array.isArray(employees)) {
      setFilteredEmployees([]);
      return;
    }

    if (searchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee => {
        if (!employee || typeof employee !== 'object') return false;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          (employee.name && typeof employee.name === 'string' && employee.name.toLowerCase().includes(searchLower)) ||
          (employee.designation && typeof employee.designation === 'string' && employee.designation.toLowerCase().includes(searchLower)) ||
          (employee.office && typeof employee.office === 'string' && employee.office.toLowerCase().includes(searchLower)) ||
          (employee.email && typeof employee.email === 'string' && employee.email.toLowerCase().includes(searchLower))
        );
      });
      setFilteredEmployees(filtered);
    }
  }, [employees, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [employeesRes, documentsRes] = await Promise.all([
        documentGenerationAPI.getEmployees().catch(err => {
          console.warn('Failed to fetch employees:', err);
          return { data: [] };
        }),
        documentGenerationAPI.getGeneratedDocuments().catch(err => {
          console.warn('Failed to fetch generated documents:', err);
          return { data: [] };
        })
      ]);
      
      // Ensure employees is an array and format the data properly
      let employeesData = [];
      if (Array.isArray(employeesRes.data)) {
        employeesData = employeesRes.data;
      } else if (Array.isArray(employeesRes.data?.results)) {
        employeesData = employeesRes.data.results;
      } else if (Array.isArray(employeesRes.data?.employees)) {
        employeesData = employeesRes.data.employees;
      }
      
      // Format employee data to match expected structure
      const formattedEmployees = employeesData.map(emp => ({
        id: emp.id,
        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name || 'Unknown',
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        designation: emp.designation_name || emp.designation || 'No designation',
        office: emp.office_name || emp.office || 'No office',
        employee_id: emp.employee_id,
        role: emp.role
      }));
      
      setEmployees(formattedEmployees);
      
      // Ensure generatedDocuments is an array
      const documentsData = Array.isArray(documentsRes.data) ? documentsRes.data : 
                           Array.isArray(documentsRes.data?.results) ? documentsRes.data.results : [];
      setGeneratedDocuments(documentsData);
      
      console.log('✅ DocumentGenerator data loaded:', { 
        employees: employeesData.length, 
        documents: documentsData.length 
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
      // Set empty arrays as fallback
      setEmployees([]);
      setGeneratedDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setFormData({});
    setPreviewData(null);
  };

  const handleDocumentTypeChange = (type) => {
    setDocumentType(type);
    setFormData({});
    setPreviewData(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreview = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const previewData = {
        employee_id: selectedEmployee.id,
        document_type: documentType,
        ...formData
      };
      
      console.log('📄 Previewing document:', previewData);
      
      const previewRes = await documentGenerationAPI.previewDocument(previewData);
      
      setPreviewData(previewRes.data);
      setShowPreview(true);
    } catch (error) {
      console.error('❌ Preview failed:', error);
      setError(error.response?.data?.detail || error.response?.data?.error || 'Failed to preview document');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Handle regular document generation
      const generateData = {
        employee_id: selectedEmployee.id,
        document_type: documentType,
        send_email: true,
        ...formData
      };
      
      console.log('📝 Generating document:', generateData);
      
      const generateRes = await documentGenerationAPI.generateDocument(generateData);
      
      setSuccess('Document generated successfully!');
      setShowGenerator(false);
      setSelectedEmployee(null);
      setFormData({});
      setPreviewData(null);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('❌ Generation failed:', error);
      setError(error.response?.data?.detail || error.response?.data?.error || 'Failed to generate document');
    } finally {
      setLoading(false);
    }
  };


  const handleDownload = async (documentId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting download for document:', documentId);
      
      // Get the document first to have access to its content
      const docResponse = await documentGenerationAPI.getGeneratedDocument(documentId);
      const document = docResponse.data;
      
      // Use the enhanced download function with fallbacks
      const result = await downloadDocument(document, documentGenerationAPI);
      
      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message || 'Failed to download document');
      }
    } catch (error) {
      console.error('Download failed:', error);
      console.error('Error details:', error.response);
      
      // Handle different types of errors
      let errorMessage = 'Failed to download document';
      
      if (error.response?.status === 500) {
        const errorData = error.response.data;
        if (errorData?.error === 'PDF generation failed') {
          const detail = errorData.detail || 'Unknown error';
          errorMessage = `PDF generation failed: ${detail}. The document content is available but PDF conversion is not working.`;
          console.error('PDF generation error details:', errorData);
        } else if (errorData?.error === 'PDF generation not available') {
          errorMessage = 'PDF generation is not available on this server. WeasyPrint library needs to be installed on the server. Please contact your system administrator to install WeasyPrint and its dependencies.';
        } else {
          errorMessage = 'Server error occurred while generating PDF. Please try again later.';
        }
      } else if (error.response?.status === 503) {
        const errorData = error.response.data;
        if (errorData?.error === 'PDF generation not available') {
          errorMessage = 'PDF generation is not available on this server. WeasyPrint library needs to be installed on the server. Please contact your system administrator to install WeasyPrint and its dependencies.';
        } else {
          errorMessage = 'PDF service is temporarily unavailable. Please try again later.';
        }
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found. It may have been deleted.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to download this document';
      } else {
        errorMessage = error.response?.data?.detail || 
                      error.response?.data?.error || 
                      error.message || 
                      'Failed to download document';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleSendEmail = async (documentId) => {
    try {
      setLoading(true);
      await documentGenerationAPI.sendGeneratedDocumentEmail(documentId);
      setSuccess('Email sent successfully!');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Email send failed:', error);
      setError('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (documentId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the document first to have access to its content
      const docResponse = await documentGenerationAPI.getGeneratedDocument(documentId);
      const document = docResponse.data;
      
      if (document.pdf_file) {
        // Open the document in a new tab
        const viewUrl = document.pdf_file;
        window.open(viewUrl, '_blank');
        setSuccess('Document opened in new tab');
      } else {
        setError('No file available for this document');
      }
    } catch (error) {
      console.error('View failed:', error);
      setError('Failed to view document');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await documentGenerationAPI.deleteGeneratedDocument(documentId);
      setSuccess('Document deleted successfully!');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    const selectedDocType = documentTypes.find(dt => dt.value === documentType);
    if (!selectedDocType) return null;

    return selectedDocType.fields.map(field => {
      switch (field) {
        case 'position':
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>Position</Label>
              <Input
                id={field}
                value={formData[field] || ''}
                onChange={(e) => handleFormChange(field, e.target.value)}
                placeholder="e.g., Software Developer"
                required
              />
            </div>
          );
        
        case 'start_date':
        case 'effective_date':
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>
                {field === 'start_date' ? 'Start Date' : 'Effective Date'}
              </Label>
              <Input
                id={field}
                type="date"
                value={formData[field] || ''}
                onChange={(e) => handleFormChange(field, e.target.value)}
                required
              />
            </div>
          );
        
        case 'starting_salary':
        case 'previous_salary':
        case 'new_salary':
        case 'basic_salary':
        case 'extra_days_pay':
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>
                {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Label>
              <Input
                id={field}
                type="number"
                value={formData[field] || ''}
                onChange={(e) => handleFormChange(field, e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
          );
        
        case 'salary_month':
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>Salary Month</Label>
              <select
                id={field}
                value={formData[field] || ''}
                onChange={(e) => handleFormChange(field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Month</option>
                {['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          );
        
        case 'salary_year':
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>Salary Year</Label>
              <Input
                id={field}
                type="number"
                value={formData[field] || new Date().getFullYear()}
                onChange={(e) => handleFormChange(field, e.target.value)}
                placeholder="2024"
                required
              />
            </div>
          );
        
        case 'department':
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>Department</Label>
              <Input
                id={field}
                value={formData[field] || ''}
                onChange={(e) => handleFormChange(field, e.target.value)}
                placeholder="e.g., Engineering, HR, Finance"
                required
              />
            </div>
          );
        
        case 'end_date':
        case 'last_working_date':
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>
                {field === 'end_date' ? 'End Date' : 'Last Working Date'}
              </Label>
              <Input
                id={field}
                type="date"
                value={formData[field] || ''}
                onChange={(e) => handleFormChange(field, e.target.value)}
                required
              />
            </div>
          );
        
        case 'reason':
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>Reason for Leaving</Label>
              <Textarea
                id={field}
                value={formData[field] || ''}
                onChange={(e) => handleFormChange(field, e.target.value)}
                placeholder="e.g., Personal reasons, Career growth, etc."
                rows="3"
                required
              />
            </div>
          );
        
        
        default:
          return null;
      }
    });
  };

  if (loading && !showGenerator) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Document Generator</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Generate professional documents for employees</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="flex items-center justify-center space-x-2 py-3 sm:py-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </Button>
          <Button
            onClick={() => setShowGenerator(true)}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 py-3 sm:py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Document</span>
          </Button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              {error.includes('PDF generation') && (
                <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                  <p className="text-red-700 text-sm font-medium">Troubleshooting:</p>
                  <ul className="text-red-600 text-sm mt-1 list-disc list-inside space-y-1">
                    <li>PDF generation requires WeasyPrint library to be properly installed</li>
                    <li>On Windows, this requires additional system dependencies</li>
                    <li>Contact your system administrator to install the required dependencies</li>
                    <li>You can still view the document content in the preview</li>
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700">{success}</span>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400 hover:text-green-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Generated Documents List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Documents</h3>
            <span className="text-sm text-gray-500">
              {Array.isArray(generatedDocuments) ? generatedDocuments.length : 0} documents
            </span>
          </div>
          {!Array.isArray(generatedDocuments) || generatedDocuments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No documents generated yet</p>
              <p className="text-sm">Click "Generate Document" to create your first document</p>
            </div>
          ) : (
            <div className="space-y-3">
              {generatedDocuments.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span className="truncate">
                            {doc.employee?.first_name} {doc.employee?.last_name}
                            {doc.employee?.employee_id && ` (${doc.employee.employee_id})`}
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {doc.document_type?.replace('_', ' ')}
                          </span>
                          <span>•</span>
                          <span>{new Date(doc.generated_at || doc.created_at).toLocaleDateString()}</span>
                        </div>
                        {doc.is_sent && (
                          <div className="flex items-center space-x-1 text-xs text-green-600 mt-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Email sent</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc.id)}
                        className="flex items-center space-x-1"
                        disabled={loading}
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.id)}
                        className="flex items-center space-x-1"
                        disabled={loading}
                        title="Download as PDF"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">
                          {loading ? 'Downloading...' : 'PDF'}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmail(doc.id)}
                        className="flex items-center space-x-1"
                        disabled={loading}
                        title="Send Email"
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        disabled={loading}
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Document Generator Modal */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-xl max-h-[95vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Generate Document</h3>
              <button
                onClick={() => setShowGenerator(false)}
                className="text-gray-400 hover:text-gray-600 p-2 -m-2 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 space-y-6">
            {/* Step 1: Select Employee */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">1</span>
                Select Employee
              </h4>
              
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search employees by name, designation, office, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <p className="text-sm text-gray-500 mt-2">
                    {filteredEmployees.length} employee(s) found
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 sm:max-h-48 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm sm:text-base">
                      {searchTerm ? 'No employees found matching your search' : 'No employees found'}
                    </p>
                  </div>
                ) : (
                  filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 touch-manipulation ${
                        selectedEmployee?.id === employee.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm active:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{employee.name || 'Unknown'}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{employee.designation || 'No designation'}</p>
                          <p className="text-xs text-gray-500 truncate">{employee.office || 'No office'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Step 2: Select Document Type */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-2">2</span>
                Select Document Type
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {documentTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <div
                      key={type.value}
                      onClick={() => handleDocumentTypeChange(type.value)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        documentType === type.value
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <IconComponent className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <h5 className="font-medium text-gray-900">{type.label}</h5>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Fill Form Data */}
            {selectedEmployee && documentType && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-2">3</span>
                  Document Details
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedEmployee.name}</p>
                      <p className="text-sm text-gray-600">
                        {documentTypes.find(dt => dt.value === documentType)?.label}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormFields()}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowGenerator(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              {selectedEmployee && documentType && (
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </Button>
              )}
              <Button
                onClick={handleGenerate}
                disabled={!selectedEmployee || !documentType || loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Generate Document</span>
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {previewData && (
              <div className="flex flex-col h-full">
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{previewData.title}</h4>
                      <p className="text-sm text-gray-600">
                        For: {previewData.employee_name} ({previewData.employee_email})
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(false)}
                      >
                        Close
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowPreview(false);
                          handleGenerate();
                        }}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span>Generate Document</span>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <iframe
                    srcDoc={previewData.content}
                    className="w-full h-full border-0"
                    title="Document Preview"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DocumentGenerator;
