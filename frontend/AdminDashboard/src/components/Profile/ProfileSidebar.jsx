import React from 'react';
import { Card, Badge } from '../../components/ui';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  CreditCard,
  Building2,
  IdCard,
  Shield,
  Heart,
  Image,
  Banknote
} from 'lucide-react';

const ProfileSidebar = ({ user }) => {
  const formatSalary = (salary) => {
    if (!salary) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(salary);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGenderDisplay = (gender) => {
    const genderMap = {
      'M': 'Male',
      'F': 'Female',
      'O': 'Other'
    };
    return genderMap[gender] || 'Not specified';
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'manager': 'Manager',
      'employee': 'Employee'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {user.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-sm text-gray-500">{user.employee_id || 'No Employee ID'}</p>
            <p className="text-sm text-gray-500 capitalize">{getRoleDisplay(user.role)}</p>
            {user.gender && (
              <p className="text-sm text-gray-500">{getGenderDisplay(user.gender)}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.email}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.phone || 'N/A'}</span>
          </div>
          {user.address && (
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-600">{user.address}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Employment Information */}
      <Card className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Employment Details</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <IdCard className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">ID: {user.employee_id || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <IdCard className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Biometric: {user.biometric_id || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.department || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.designation || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 capitalize">{getRoleDisplay(user.role)}</span>
          </div>
        </div>
      </Card>

      {/* Payroll Information */}
      <Card className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Payroll Details</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{formatSalary(user.salary)}</span>
          </div>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Heart className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.emergency_contact_name || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.emergency_contact_phone || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Heart className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.emergency_contact_relationship || 'N/A'}</span>
          </div>
        </div>
      </Card>

      {/* Bank Details */}
      <Card className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Bank Details</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.account_holder_name || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.bank_name || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {user.account_number ? `****${user.account_number.slice(-4)}` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.bank_branch_name || 'N/A'}</span>
          </div>
        </div>
      </Card>

      {/* Important Dates */}
      <Card className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Important Dates</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Joined: {formatDate(user.joining_date)}</span>
          </div>
          {user.date_of_birth && (
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">DOB: {formatDate(user.date_of_birth)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Account Status */}
      <Card className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Account Status</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <User className="w-4 h-4 text-gray-400" />
            <Badge variant={user.is_active ? 'success' : 'danger'}>
              {user.is_active ? 'Active Account' : 'Inactive Account'}
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Last Login: {formatDate(user.last_login)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
