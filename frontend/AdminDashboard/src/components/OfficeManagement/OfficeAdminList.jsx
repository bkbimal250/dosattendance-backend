import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  User, 
  Building2,
  Crown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { officeAdminAPI } from '@/services/api';
import { toast } from 'sonner';

const OfficeAdminList = ({ onEditAdmin, onCreateAdmin }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await officeAdminAPI.getOfficeAdmins();
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching office admins:', error);
      toast.error('Failed to fetch office admins');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to delete this office admin?')) {
      return;
    }

    try {
      await officeAdminAPI.deleteOfficeAdmin(adminId);
      toast.success('Office admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting office admin:', error);
      toast.error('Failed to delete office admin');
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.user_details?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.user_details?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.office_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.office_details?.office_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionIcon = (hasPermission) => {
    return hasPermission ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Office Administrators</CardTitle>
          </div>
          <Button onClick={onCreateAdmin} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Admin</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Office</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>
                  <div>
                    <div className="font-medium flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{admin.user_details?.username}</span>
                      {admin.is_primary_admin && (
                        <Crown className="h-4 w-4 text-yellow-500" title="Primary Admin" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {admin.user_details?.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {admin.user_details?.first_name} {admin.user_details?.last_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{admin.office_details?.name}</div>
                      <Badge variant="outline">{admin.office_details?.office_code}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={admin.is_primary_admin ? "default" : "secondary"}>
                    {admin.is_primary_admin ? "Primary Admin" : "Admin"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getPermissionIcon(admin.can_manage_users)}
                      <span className="text-sm">Manage Users</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPermissionIcon(admin.can_manage_attendance)}
                      <span className="text-sm">Manage Attendance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPermissionIcon(admin.can_manage_devices)}
                      <span className="text-sm">Manage Devices</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPermissionIcon(admin.can_view_reports)}
                      <span className="text-sm">View Reports</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditAdmin(admin)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAdmin(admin.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredAdmins.length === 0 && (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No office admins found matching your search.' : 'No office admins found.'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateAdmin} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Admin
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfficeAdminList;
