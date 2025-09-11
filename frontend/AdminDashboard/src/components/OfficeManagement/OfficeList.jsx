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
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Building2,
  Eye
} from 'lucide-react';
import { officesAPI } from '@/services/api';
import { toast } from 'sonner';

const OfficeList = ({ onEditOffice, onViewOffice, onCreateOffice }) => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      setLoading(true);
      const response = await officesAPI.getOffices();
      setOffices(response.data);
    } catch (error) {
      console.error('Error fetching offices:', error);
      toast.error('Failed to fetch offices');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffice = async (officeId) => {
    if (!confirm('Are you sure you want to delete this office?')) {
      return;
    }

    try {
      await officesAPI.deleteOffice(officeId);
      toast.success('Office deleted successfully');
      fetchOffices();
    } catch (error) {
      console.error('Error deleting office:', error);
      toast.error('Failed to delete office');
    }
  };

  const filteredOffices = offices.filter(office =>
    office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.office_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Building2 className="h-5 w-5" />
            <CardTitle>Office Management</CardTitle>
          </div>
          <Button onClick={onCreateOffice} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Office</span>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search offices..."
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
              <TableHead>Office Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Today's Attendance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffices.map((office) => (
              <TableRow key={office.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{office.name}</div>
                    {office.email && (
                      <div className="text-sm text-muted-foreground flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{office.email}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{office.office_code}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{office.city}, {office.state}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{office.employee_count}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span>{office.today_attendance_count}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={office.is_active ? "default" : "secondary"}>
                    {office.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewOffice(office)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditOffice(office)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOffice(office.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredOffices.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No offices found matching your search.' : 'No offices found.'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateOffice} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Office
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfficeList;
