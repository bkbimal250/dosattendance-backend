import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/Dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Shield, User, Building2 } from 'lucide-react';
import { officeAdminAPI, officeAPI } from '@/services/api';
import { toast } from 'sonner';

const OfficeAdminForm = ({ admin, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    office: '',
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    is_primary_admin: false,
    can_manage_users: true,
    can_manage_attendance: true,
    can_manage_devices: true,
    can_view_reports: true
  });
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [officesLoading, setOfficesLoading] = useState(true);

  const isEditing = !!admin;

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    if (admin) {
      setFormData({
        office: admin.office_details?.id || '',
        username: admin.user_details?.username || '',
        email: admin.user_details?.email || '',
        password: '',
        first_name: admin.user_details?.first_name || '',
        last_name: admin.user_details?.last_name || '',
        is_primary_admin: admin.is_primary_admin,
        can_manage_users: admin.can_manage_users,
        can_manage_attendance: admin.can_manage_attendance,
        can_manage_devices: admin.can_manage_devices,
        can_view_reports: admin.can_view_reports
      });
    } else {
      setFormData({
        office: '',
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        is_primary_admin: false,
        can_manage_users: true,
        can_manage_attendance: true,
        can_manage_devices: true,
        can_view_reports: true
      });
    }
  }, [admin]);

  const fetchOffices = async () => {
    try {
      setOfficesLoading(true);
      const response = await officeAPI.getOffices();
      setOffices(response.data);
    } catch (error) {
      console.error('Error fetching offices:', error);
      toast.error('Failed to fetch offices');
    } finally {
      setOfficesLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.office || !formData.username || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error('Password is required for new admin');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing) {
        // For editing, we need to update the admin permissions
        const updateData = {
          is_primary_admin: formData.is_primary_admin,
          can_manage_users: formData.can_manage_users,
          can_manage_attendance: formData.can_manage_attendance,
          can_manage_devices: formData.can_manage_devices,
          can_view_reports: formData.can_view_reports
        };
        await officeAdminAPI.updateOfficeAdmin(admin.id, updateData);
        toast.success('Office admin updated successfully');
      } else {
        // For creating, we need to send all user data
        const createData = {
          office: formData.office,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          is_primary_admin: formData.is_primary_admin,
          can_manage_users: formData.can_manage_users,
          can_manage_attendance: formData.can_manage_attendance,
          can_manage_devices: formData.can_manage_devices,
          can_view_reports: formData.can_view_reports
        };
        await officeAdminAPI.createOfficeAdmin(createData);
        toast.success('Office admin created successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving office admin:', error);
      toast.error(isEditing ? 'Failed to update office admin' : 'Failed to create office admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <DialogTitle>
              {isEditing ? 'Edit Office Admin' : 'Create New Office Admin'}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Office Selection */}
          <div className="space-y-2">
            <Label htmlFor="office">Office *</Label>
            <Select
              value={formData.office}
              onValueChange={(value) => handleInputChange('office', value)}
              disabled={isEditing || officesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an office" />
              </SelectTrigger>
              <SelectContent>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>{office.name} ({office.office_code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter username"
                disabled={isEditing}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={isEditing}
                required
              />
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter first name"
                disabled={isEditing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
                disabled={isEditing}
              />
            </div>
          </div>

          {/* Admin Role */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_primary_admin"
              checked={formData.is_primary_admin}
              onCheckedChange={(checked) => handleInputChange('is_primary_admin', checked)}
            />
            <Label htmlFor="is_primary_admin">Primary Admin (Can manage other admins)</Label>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Permissions</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="can_manage_users"
                  checked={formData.can_manage_users}
                  onCheckedChange={(checked) => handleInputChange('can_manage_users', checked)}
                />
                <Label htmlFor="can_manage_users">Manage Users</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="can_manage_attendance"
                  checked={formData.can_manage_attendance}
                  onCheckedChange={(checked) => handleInputChange('can_manage_attendance', checked)}
                />
                <Label htmlFor="can_manage_attendance">Manage Attendance</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="can_manage_devices"
                  checked={formData.can_manage_devices}
                  onCheckedChange={(checked) => handleInputChange('can_manage_devices', checked)}
                />
                <Label htmlFor="can_manage_devices">Manage Devices</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="can_view_reports"
                  checked={formData.can_view_reports}
                  onCheckedChange={(checked) => handleInputChange('can_view_reports', checked)}
                />
                <Label htmlFor="can_view_reports">View Reports</Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isEditing ? 'Update Admin' : 'Create Admin'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OfficeAdminForm;
