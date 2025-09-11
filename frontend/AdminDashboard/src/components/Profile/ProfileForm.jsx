import React from 'react';
import { Card, Button, Badge } from '../../components/ui';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Briefcase,
  DollarSign,
  CreditCard,
  Building2,
  IdCard,
  Heart,
  Banknote,
  Image
} from 'lucide-react';

const ProfileForm = ({ 
  user, 
  profileData, 
  setProfileData, 
  isEditing, 
  loading, 
  onSubmit, 
  onCancel,
  onEdit, // New prop for handling edit mode
  isAdmin = false // If true, allows editing of all fields
}) => {
  const handleChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFieldEditable = (fieldName) => {
    // Admin can edit all fields
    if (isAdmin) return true;
    
    // Regular users can only edit basic profile fields
    const editableFields = [
      'first_name', 'last_name', 'phone', 'address', 
      'date_of_birth', 'gender', 'emergency_contact_name',
      'emergency_contact_phone', 'emergency_contact_relationship'
    ];
    
    return editableFields.includes(fieldName);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        <div className="flex space-x-2">
          {!isEditing && (
            <Button
              variant="primary"
              size="sm"
              onClick={onEdit}
              className="flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          )}
          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={onSubmit}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <form className="space-y-6">
        {/* Basic Information */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={profileData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                disabled={!isEditing || loading || !isFieldEditable('first_name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={profileData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                disabled={!isEditing || loading || !isFieldEditable('last_name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profileData.email}
                  disabled={true} // Email is never editable
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  placeholder="Enter email address"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('phone')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter phone number"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={profileData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('date_of_birth')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="relative">
                <select
                  value={profileData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('gender')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Employment Information - Only editable by admin */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.employee_id}
                  disabled={true} // Employee ID is never editable
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  placeholder="Employee ID"
                />
                <IdCard className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biometric ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.biometric_id}
                  onChange={(e) => handleChange('biometric_id', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('biometric_id')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter biometric ID"
                />
                <IdCard className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joining Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={profileData.joining_date}
                  disabled={true} // Joining date is never editable
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('department')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter department"
                />
                <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designation
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.designation}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('designation')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter designation"
                />
                <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={profileData.salary}
                  onChange={(e) => handleChange('salary', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('salary')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter salary amount"
                />
                <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Information */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.emergency_contact_name}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('emergency_contact_name')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter emergency contact name"
                />
                <Heart className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={profileData.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('emergency_contact_phone')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter emergency contact phone"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Relationship
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.emergency_contact_relationship}
                  onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('emergency_contact_relationship')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter relationship (e.g., Spouse, Parent, Sibling)"
                />
                <Heart className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Information - Only editable by admin */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.account_holder_name}
                  onChange={(e) => handleChange('account_holder_name', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('account_holder_name')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter account holder name"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.bank_name}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('bank_name')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter bank name"
                />
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.account_number}
                  onChange={(e) => handleChange('account_number', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('account_number')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter account number"
                />
                <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.ifsc_code}
                  onChange={(e) => handleChange('ifsc_code', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('ifsc_code')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter IFSC code"
                />
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Branch Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.bank_branch_name}
                  onChange={(e) => handleChange('bank_branch_name', e.target.value)}
                  disabled={!isEditing || loading || !isFieldEditable('bank_branch_name')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter bank branch name"
                />
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={profileData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={!isEditing || loading || !isFieldEditable('address')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter address"
            />
          </div>
        </div>
      </form>
    </Card>
  );
};

export default ProfileForm;
