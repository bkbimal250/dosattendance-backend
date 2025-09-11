import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/Dialog';
import { Building2, X } from 'lucide-react';
import { officesAPI } from '@/services/api';
import { toast } from 'sonner';

const OfficeForm = ({ office, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    phone: '',
    email: '',
    description: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const isEditing = !!office;

  useEffect(() => {
    if (office) {
      setFormData({
        name: office.name || '',
        address: office.address || '',
        city: office.city || '',
        state: office.state || '',
        country: office.country || 'India',
        postal_code: office.postal_code || '',
        phone: office.phone || '',
        email: office.email || '',
        description: office.description || '',
        is_active: office.is_active
      });
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        postal_code: '',
        phone: '',
        email: '',
        description: '',
        is_active: true
      });
    }
  }, [office]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      let response;
      if (isEditing) {
        response = await officesAPI.updateOffice(office.id, formData);
        toast.success('Office updated successfully');
      } else {
        response = await officesAPI.createOffice(formData);
        toast.success('Office created successfully');
      }
      
      // Pass the updated/created office data to the success callback
      const officeData = response.data || { ...formData, id: office?.id };
      onSuccess(officeData);
      onClose();
    } catch (error) {
      console.error('Error saving office:', error);
      toast.error(isEditing ? 'Failed to update office' : 'Failed to create office');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <DialogTitle className="text-base font-semibold">
              {isEditing ? 'Edit Office' : 'Create New Office'}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-medium text-gray-700">Office Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter office name"
                className="text-sm"
                required
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs font-medium text-gray-700">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter office description"
                className="text-sm"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-1">
            <Label htmlFor="address" className="text-xs font-medium text-gray-700">Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter complete address"
              rows={2}
              className="text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="city" className="text-xs font-medium text-gray-700">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
                className="text-sm"
                required
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="state" className="text-xs font-medium text-gray-700">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Enter state"
                className="text-sm"
                required
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="postal_code" className="text-xs font-medium text-gray-700">Postal Code *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="Enter postal code"
                className="text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="country" className="text-xs font-medium text-gray-700">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="Enter country"
              className="text-sm"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-medium text-gray-700">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className="text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className="text-sm"
              />
            </div>
          </div>


          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active" className="text-xs font-medium text-gray-700">Active Office</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto text-sm"
            >
              {loading && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              )}
              <span>{isEditing ? 'Update Office' : 'Create Office'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OfficeForm;
