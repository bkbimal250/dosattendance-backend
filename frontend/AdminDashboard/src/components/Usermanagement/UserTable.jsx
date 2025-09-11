import React from 'react';
import { Card, Button, Badge } from '../../components/ui';
import {
  Edit,
  Eye,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  CreditCard,
  Building2,
  IdCard,
  Briefcase,
  Calendar,
  UserPlus,
  Download,
  FileText,
  FileDown,
  CheckCircle
} from 'lucide-react';

const UserTable = ({ 
  users, 
  loading, 
  onEdit, 
  onView, 
  onDelete, 
  onToggleStatus,
  viewMode = 'table' // 'table' or 'grid'
}) => {
  const getEmploymentStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'success', text: 'Active' },
      'on_leave': { color: 'warning', text: 'On Leave' },
      resigned: { color: 'danger', text: 'Resigned' },
      terminated: { color: 'danger', text: 'Terminated' }
    };
    
    const config = statusConfig[status] || { color: 'secondary', text: status };
    return <Badge variant={config.color}>{config.text}</Badge>;
  };

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
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const exportToCSV = () => {
    if (!users || users.length === 0) {
      alert('No users to export');
      return;
    }

    const headers = [
      'Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Role',
      'Office', 'Department', 'Designation', 'Salary', 'Joining Date',
      'Biometric ID', 'Address', 'Date of Birth', 'Gender',
      'Emergency Contact Name', 'Emergency Contact Phone', 'Emergency Contact Relationship',
      'Bank Account Holder', 'Bank Name', 'Account Number', 'IFSC Code', 'Bank Branch',
      'Status', 'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.employee_id || 'N/A',
        user.first_name || 'N/A',
        user.last_name || 'N/A',
        user.email || 'N/A',
        user.phone || 'N/A',
        user.role || 'N/A',
        user.office_name || 'N/A',
        user.department || 'N/A',
        user.designation || 'N/A',
        user.salary || 'N/A',
        user.joining_date || 'N/A',
        user.biometric_id || 'N/A',
        user.address || 'N/A',
        user.date_of_birth || 'N/A',
        user.gender || 'N/A',
        user.emergency_contact_name || 'N/A',
        user.emergency_contact_phone || 'N/A',
        user.emergency_contact_relationship || 'N/A',
        user.account_holder_name || 'N/A',
        user.bank_name || 'N/A',
        user.account_number || 'N/A',
        user.ifsc_code || 'N/A',
        user.bank_branch_name || 'N/A',
        user.is_active ? 'Active' : 'Inactive',
        user.created_at || 'N/A'
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Import jsPDF dynamically to avoid SSR issues
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        generatePDF(jsPDF, autoTable);
      }).catch(() => {
        generateSimplePDF(jsPDF);
      });
    }).catch(() => {
      alert('PDF generation failed. Please try again or use CSV export.');
    });
  };

  const generatePDF = (jsPDF, autoTable) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Users Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Users: ${users.length}`, 14, 37);

    // Prepare table data
    const tableData = users.map(user => [
      user.employee_id || 'N/A',
      `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
      user.email || 'N/A',
      user.role || 'N/A',
      user.office_name || 'N/A',
      user.department || 'N/A',
      user.salary ? formatSalary(user.salary) : 'N/A',
      user.is_active ? 'Active' : 'Inactive'
    ]);

    // Add table
    autoTable(doc, {
      head: [['Employee ID', 'Name', 'Email', 'Role', 'Office', 'Department', 'Salary', 'Status']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save(`users_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateSimplePDF = (jsPDF) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Users Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Users: ${users.length}`, 20, 40);
    
    let yPosition = 60;
    users.forEach((user, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${index + 1}. ${user.first_name || ''} ${user.last_name || ''} - ${user.role || 'N/A'}`, 20, yPosition);
      yPosition += 10;
    });
    
    doc.save(`users_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{user.employee_id || 'N/A'}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(user)}
                  className="p-1"
                  title="View User Details"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(user)}
                  className="p-1"
                  title="Edit User"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleStatus(user)}
                  className={`p-1 ${user.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                  title={user.is_active ? 'Deactivate User' : 'Activate User'}
                >
                  {user.is_active ? (
                    <UserPlus className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(user)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Delete User"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.email}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.phone || 'N/A'}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.department || 'N/A'}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <IdCard className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.biometric_id || 'N/A'}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.office_name || 'N/A'}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{formatSalary(user.salary)}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.bank_name || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : 'secondary'}>
                  {user.role?.toUpperCase() || 'N/A'}
                </Badge>
                <Badge variant={user.is_active ? 'success' : 'danger'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Export Buttons */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">User Management</h3>
          <div className="flex space-x-2">
            <Button onClick={exportToCSV} variant="outline" size="sm" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>CSV</span>
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm" className="flex items-center space-x-2">
              <FileDown className="w-4 h-4" />
              <span>PDF</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employment Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact & Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Financial & Bank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status & Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                {/* Employee Info */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">ID: {user.employee_id || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone || 'N/A'}</div>
                    </div>
                  </div>
                </td>

                {/* Employment Details */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <IdCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">Bio: {user.biometric_id || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.department || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.designation || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatDate(user.joining_date)}</span>
                    </div>
                  </div>
                </td>

                {/* Contact & Address */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.office_name || 'N/A'}</span>
                    </div>
                    <div className="text-sm text-gray-500">{user.address || 'N/A'}</div>
                    <div className="text-sm text-gray-500">DOB: {formatDate(user.date_of_birth)}</div>
                    <div className="text-sm text-gray-500">Gender: {user.gender || 'N/A'}</div>
                  </div>
                </td>

                {/* Financial & Bank */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatSalary(user.salary)}</span>
                    </div>
                    <div className="text-sm text-gray-500">{user.bank_name || 'N/A'}</div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{maskAccountNumber(user.account_number)}</span>
                    </div>
                    <div className="text-sm text-gray-500">{user.ifsc_code || 'N/A'}</div>
                  </div>
                </td>

                {/* Status & Actions */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-1">
                      <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : 'secondary'}>
                        {user.role?.toUpperCase() || 'N/A'}
                      </Badge>
                      <Badge variant={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(user)}
                        className="p-1"
                        title="View User Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="p-1"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleStatus(user)}
                        className={`p-1 ${user.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                        title={user.is_active ? 'Deactivate User' : 'Activate User'}
                      >
                        {user.is_active ? (
                          <UserPlus className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(user)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default UserTable;
