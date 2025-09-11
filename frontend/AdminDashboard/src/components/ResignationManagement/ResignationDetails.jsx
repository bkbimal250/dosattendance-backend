import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import { Badge } from '../ui/Badge';

const ResignationDetails = ({ resignation, onClose }) => {
  if (!resignation) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateLastWorkingDate = () => {
    if (resignation.resignation_date && resignation.notice_period_days) {
      const resignationDate = new Date(resignation.resignation_date);
      const lastWorkingDate = new Date(resignationDate);
      lastWorkingDate.setDate(lastWorkingDate.getDate() + resignation.notice_period_days);
      
      return lastWorkingDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {resignation.user_name || 'N/A'}
              </h2>
              <p className="text-gray-600">Resignation Request Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Status</h3>
              <div className="flex items-center space-x-3">
                {getStatusBadge(resignation.status)}
                <span className="text-sm text-gray-600">
                  Applied on {formatDate(resignation.created_at)}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Employee Information</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span className="font-medium">ID:</span>
                  <span className="ml-2">{resignation.user_employee_id || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  <span className="font-medium">Office:</span>
                  <span className="ml-2">{resignation.user_office_name || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Department:</span>
                  <span className="ml-2">{resignation.user_department || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">Designation:</span>
                  <span className="ml-2">{resignation.user_designation || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resignation Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Resignation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-medium">Submission Date:</span>
                <span className="ml-2">{formatDate(resignation.resignation_date)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-medium">Last Working Date:</span>
                <span className="ml-2">{formatDate(resignation.last_working_date)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span className="font-medium">Notice Period:</span>
                <span className="ml-2">{resignation.notice_period_days} days</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-medium">Actual Last Day:</span>
                <span className="ml-2">{calculateLastWorkingDate()}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Handover Status:</span>
                <span className="ml-2">
                  {resignation.is_handover_completed ? (
                    <Badge variant="success">Completed</Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Reason for Resignation</h3>
            <div className="flex items-start text-sm text-gray-600">
              <MessageSquare className="h-4 w-4 mr-2 mt-0.5" />
              <p className="text-gray-900">{resignation.reason}</p>
            </div>
          </div>

          {/* Handover Notes */}
          {resignation.handover_notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Handover Notes</h3>
              <div className="flex items-start text-sm text-gray-600">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
                <p className="text-gray-900">{resignation.handover_notes}</p>
              </div>
            </div>
          )}

          {/* Approval Information */}
          {(resignation.approved_by_name || resignation.approved_at) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Approval Information</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span className="font-medium">Approved by:</span>
                  <span className="ml-2">{resignation.approved_by_name || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="font-medium">Approved on:</span>
                  <span className="ml-2">{formatDate(resignation.approved_at)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Information */}
          {resignation.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-900 mb-3">Rejection Information</h3>
              <div className="flex items-start text-sm text-red-600">
                <XCircle className="h-4 w-4 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Rejection Reason:</p>
                  <p className="text-red-800">{resignation.rejection_reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-600">
                  <strong>Request Submitted:</strong> {formatDate(resignation.created_at)}
                </span>
              </div>
              
              {resignation.approved_at && (
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">
                    <strong>Request {resignation.status === 'approved' ? 'Approved' : 'Rejected'}:</strong> {formatDate(resignation.approved_at)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-gray-600">
                  <strong>Last Working Date:</strong> {formatDate(resignation.last_working_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResignationDetails;
