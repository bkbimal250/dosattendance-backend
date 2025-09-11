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
  RefreshCw
} from 'lucide-react';
import { documentGenerationAPI } from '../../services/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';

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
  
  // Document types
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
      
      // Ensure employees is an array
      const employeesData = Array.isArray(employeesRes.data) ? employeesRes.data : 
                           Array.isArray(employeesRes.data?.results) ? employeesRes.data.results : [];
      setEmployees(employeesData);
      
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
      const previewRes = await documentGenerationAPI.previewDocument({
        employee_id: selectedEmployee.id,
        document_type: documentType,
        ...formData
      });
      
      setPreviewData(previewRes.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      setError('Failed to preview document');
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
      const generateRes = await documentGenerationAPI.generateDocument({
        employee_id: selectedEmployee.id,
        document_type: documentType,
        send_email: true,
        ...formData
      });
      
      setSuccess('Document generated successfully!');
      setShowGenerator(false);
      setSelectedEmployee(null);
      setFormData({});
      setPreviewData(null);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Failed to generate document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await documentGenerationAPI.downloadGeneratedDocumentPDF(documentId);
      
      // Check if response is valid
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Verify blob size
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${documentId}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      setSuccess('Document downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to download document';
      let showFallback = false;
      
      if (error.response?.status === 500) {
        const errorData = error.response.data;
        if (errorData?.error === 'PDF generation failed') {
          errorMessage = 'PDF generation failed. The document content is available but PDF conversion is not working.';
          showFallback = errorData.fallback_available;
        } else if (errorData?.error === 'PDF generation not available') {
          errorMessage = 'PDF generation is not available on this server. Please contact the administrator.';
        } else {
          errorMessage = 'Server error occurred while generating PDF. Please try again later.';
        }
      } else if (error.response?.status === 503) {
        const errorData = error.response.data;
        if (errorData?.error === 'PDF generation not available') {
          errorMessage = 'PDF generation is not available on this server. WeasyPrint library needs to be installed. You can download the document as HTML instead.';
          showFallback = errorData.fallback_available;
        } else {
          errorMessage = 'PDF service is temporarily unavailable. Please try again later.';
        }
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found. It may have been deleted.';
      } else {
        errorMessage = error.response?.data?.detail || 
                      error.response?.data?.error || 
                      error.message || 
                      'Failed to download document';
      }
      
      setError(errorMessage);
      
      // Show fallback option if available
      if (showFallback) {
        setTimeout(() => {
          const isWeasyPrintError = error.response?.status === 503 && 
                                   error.response?.data?.error === 'PDF generation not available';
          
          const message = isWeasyPrintError 
            ? 'PDF generation is not available on this server (WeasyPrint not installed). Would you like to download the document as HTML instead?'
            : 'PDF generation failed. Would you like to download the document as HTML instead?';
            
          if (window.confirm(message)) {
            handleDownloadHTML(documentId);
          }
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHTML = async (documentId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the document content and download as HTML
      const response = await documentGenerationAPI.getGeneratedDocument(documentId);
      const document = response.data;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${document.document_type} - ${document.employee_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
            h1, h2, h3 { color: #2c3e50; }
            .header { border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
            .content { margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
          </style>
        </head>
        <body>
          ${document.content}
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${documentId}.html`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      setSuccess('Document downloaded as HTML successfully');
    } catch (error) {
      console.error('HTML download failed:', error);
      setError('Failed to download document as HTML');
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
                          </span>
                          <span>•</span>
                          <span className="capitalize">
                            {doc.document_type?.replace('_', ' ')}
                          </span>
                          <span>•</span>
                          <span>{new Date(doc.generated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.id)}
                        className="flex items-center space-x-1"
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">
                          {loading ? 'Downloading...' : 'Download'}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmail(doc.id)}
                        className="flex items-center space-x-1"
                        disabled={loading}
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Send</span>
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
