import React from 'react';
import { Card, Button, Badge } from '../../components/ui';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Shield,
  X,
  Briefcase,
  DollarSign,
  CreditCard,
  Building2,
  IdCard,
  Clock,
  Heart,
  Banknote,
  Home,
  UserCheck,
  FileText,
  PhoneCall
} from 'lucide-react';

const UserView = ({ user, onClose, onEdit }) => {
  const formatSalary = (salary) => {
    if (!salary) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(salary);
  };

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return 'N/A';
    return `****${accountNumber.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'danger', text: 'Admin' },
      manager: { color: 'warning', text: 'Manager' },
      employee: { color: 'secondary', text: 'Employee' }
    };
    
    const config = roleConfig[role] || { color: 'secondary', text: role || 'N/A' };
    return <Badge variant={config.color}>{config.text}</Badge>;
  };

  return (
    <Card className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">User Details</h2>
        <div className="flex space-x-2">
          {onEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEdit(user)}
            >
              Edit User
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Personal & Employment Information */}
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-sm text-gray-500">Employee ID: {user.employee_id || 'N/A'}</p>
              <p className="text-sm text-gray-500">Username: {user.username || 'N/A'}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <PhoneCall className="w-5 h-5 text-blue-600" />
              <span>Contact Information</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{user.email || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{user.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              <span>Employment Details</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <IdCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Biometric ID: {user.biometric_id || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Department: {user.department || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Designation: {user.designation || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Office: {user.office_name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Role: {getRoleBadge(user.role)}</span>
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>Important Dates</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Joining Date: {formatDate(user.joining_date)}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Date of Birth: {formatDate(user.date_of_birth)}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Created: {formatDate(user.created_at)}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Last Updated: {formatDate(user.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <span>Personal Information</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Gender: {user.gender || 'N/A'}</span>
              </div>
              {user.address && (
                <div className="flex items-start space-x-3">
                  <Home className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-600">Address: {user.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Status, Payroll & Bank Information */}
        <div className="space-y-6">
          {/* Employment Status */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>Employment Status</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <UserCheck className="w-4 h-4 text-gray-400" />
                <div>
                  <Badge variant={user.is_active ? 'success' : 'danger'}>
                    {user.is_active ? 'Active Account' : 'Inactive Account'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Last Login: {user.last_login ? formatDate(user.last_login) : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Payroll Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Payroll Details</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Salary: {formatSalary(user.salary)}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Banknote className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Pay Grade: {user.designation || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Bank Details</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Account Holder: {user.account_holder_name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Bank Name: {user.bank_name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Account Number: {maskAccountNumber(user.account_number)}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">IFSC Code: {user.ifsc_code || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Branch: {user.bank_branch_name || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span>Emergency Contact</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Name: {user.emergency_contact_name || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Phone: {user.emergency_contact_phone || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <UserCheck className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Relationship: {user.emergency_contact_relationship || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-gray-600" />
              <span>System Information</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <IdCard className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">User ID: {user.id}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Member Since: {formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
        {onEdit && (
          <Button
            variant="primary"
            onClick={() => onEdit(user)}
          >
            Edit User
          </Button>
        )}
      </div>
    </Card>
  );
};

export default UserView;
