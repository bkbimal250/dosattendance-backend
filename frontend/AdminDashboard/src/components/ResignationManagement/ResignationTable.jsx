import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  X, 
  Eye, 
  Check, 
  X as XIcon,
  Calendar,
  User,
  Building,
  MessageSquare,
  AlertTriangle,
  FileX
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const ResignationTable = ({ 
  resignations, 
  loading = false, 
  onApprove, 
  onReject, 
  onView,
  currentUser 
}) => {
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
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

  const canTakeAction = (resignation) => {
    return resignation.status === 'pending' && 
           (currentUser?.is_superuser || 
            currentUser?.role === 'admin' || 
            currentUser?.role === 'manager');
  };

  const handleApprove = async (resignation) => {
    setSelectedResignation(resignation);
    setShowApprovalModal(true);
  };

  const handleReject = async (resignation) => {
    setSelectedResignation(resignation);
    setShowRejectionModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedResignation) return;
    
    setActionLoading(selectedResignation.id);
    try {
      await onApprove(selectedResignation.id);
      setShowApprovalModal(false);
      setSelectedResignation(null);
      // Show success feedback
      alert('✅ Resignation approved successfully!');
    } catch (error) {
      console.error('Error approving resignation:', error);
      alert('❌ Failed to approve resignation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmReject = async (rejectionReason) => {
    if (!selectedResignation) return;
    
    setActionLoading(selectedResignation.id);
    try {
      await onReject(selectedResignation.id, { rejection_reason: rejectionReason });
      setShowRejectionModal(false);
      setSelectedResignation(null);
      // Show success feedback
      alert('✅ Resignation rejected successfully!');
    } catch (error) {
      console.error('Error rejecting resignation:', error);
      alert('❌ Failed to reject resignation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Resignation Requests</h2>
        </div>
        
        <div className="overflow-x-auto">
          {resignations.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Office
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notice Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Working Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resignations.map((resignation) => (
                  <tr key={resignation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {resignation.user_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {resignation.user_employee_id || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        {resignation.user_office_name || 'N/A'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {formatDate(resignation.resignation_date)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {resignation.notice_period_days} days
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {formatDate(resignation.last_working_date)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(resignation.status)}
                        <span className="ml-2">
                          {getStatusBadge(resignation.status)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(resignation.created_at)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(resignation)}
                          className="flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {canTakeAction(resignation) && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(resignation)}
                              disabled={actionLoading === resignation.id}
                              className="flex items-center bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === resignation.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              Approve
                            </Button>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(resignation)}
                              disabled={actionLoading === resignation.id}
                              className="flex items-center"
                            >
                              {actionLoading === resignation.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                              ) : (
                                <XIcon className="h-4 w-4 mr-1" />
                              )}
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resignation Requests</h3>
              <p className="text-gray-500">No resignation requests found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalModal && selectedResignation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Approve Resignation</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve the resignation request from{' '}
              <strong>{selectedResignation.user_name}</strong>?
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="default"
                onClick={confirmApprove}
                disabled={actionLoading === selectedResignation.id}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {actionLoading === selectedResignation.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Approving...
                  </>
                ) : (
                  'Approve'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedResignation(null);
                }}
                disabled={actionLoading === selectedResignation.id}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedResignation && (
        <RejectionModal
          resignation={selectedResignation}
          onConfirm={confirmReject}
          onCancel={() => {
            setShowRejectionModal(false);
            setSelectedResignation(null);
          }}
          loading={actionLoading === selectedResignation.id}
        />
      )}
    </>
  );
};

// Rejection Modal Component
const RejectionModal = ({ resignation, onConfirm, onCancel, loading }) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rejectionReason.trim()) {
      onConfirm(rejectionReason);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <XCircle className="h-6 w-6 text-red-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Reject Resignation</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Please provide a reason for rejecting the resignation request from{' '}
          <strong>{resignation.user_name}</strong>:
        </p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 resize-none"
            rows="3"
            required
          />
          
          <div className="flex space-x-3">
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !rejectionReason.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResignationTable;
