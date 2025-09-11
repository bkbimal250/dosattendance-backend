import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  MapPin, 
  Phone, 
  Mail,
  Eye,
  Search,
  Filter,
  CheckCircle
} from 'lucide-react';
import { officesAPI } from '../services/api';
import { Pagination } from '../components/ui';
import CreateOfficeModal from '../components/CreateOfficeModal';
import OfficeForm from '../components/OfficeManagement/OfficeForm';

const Offices = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      setLoading(true);
      const response = await officesAPI.getOffices();
      // Handle paginated response: {count, results} or direct array
      if (response.data?.results) {
        setOffices(Array.isArray(response.data.results) ? response.data.results : []);
      } else if (Array.isArray(response.data)) {
        setOffices(response.data);
      } else {
        setOffices([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching offices:', err);
      setError('Failed to fetch offices');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffice = async (officeId) => {
    if (window.confirm('Are you sure you want to delete this office? This action cannot be undone.')) {
      try {
        await officesAPI.deleteOffice(officeId);
        setOffices(offices.filter(office => office.id !== officeId));
      } catch (err) {
        console.error('Error deleting office:', err);
        alert('Failed to delete office');
      }
    }
  };

  const handleCreateOfficeSuccess = (newOffice) => {
    console.log('✅ Office created successfully:', newOffice);
    // Add the new office to the list
    setOffices(prev => [newOffice, ...prev]);
    setSuccessMessage('Office created successfully!');
    setShowCreateModal(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    setSuccessMessage('');
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleEditOffice = (office) => {
    setEditingOffice(office);
    setShowEditModal(true);
    setSuccessMessage('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingOffice(null);
  };

  const handleEditOfficeSuccess = (updatedOffice) => {
    console.log('✅ Office updated successfully:', updatedOffice);
    
    // Safety check for updatedOffice
    if (!updatedOffice || !updatedOffice.id) {
      console.warn('Updated office data is missing or invalid, refreshing offices list');
      fetchOffices(); // Refresh the entire list as fallback
      setSuccessMessage('Office updated successfully!');
      setShowEditModal(false);
      setEditingOffice(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return;
    }
    
    // Update the office in the list
    setOffices(prev => prev.map(office => 
      office.id === updatedOffice.id ? updatedOffice : office
    ));
    setSuccessMessage('Office updated successfully!');
    setShowEditModal(false);
    setEditingOffice(null);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const filteredOffices = Array.isArray(offices) ? offices.filter(office => {
    const matchesSearch = office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         office.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         office.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && office.is_active) ||
                         (filterStatus === 'inactive' && !office.is_active);
    
    return matchesSearch && matchesFilter;
  }) : [];

  // Pagination logic
  const totalItems = filteredOffices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOffices = filteredOffices.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button 
          onClick={fetchOffices}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Office Management</h1>
          <p className="text-gray-600 mt-2">Manage all offices and their configurations</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Office
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search offices by name, address, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Offices</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Offices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedOffices.map((office) => (
          <div key={office.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Office Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{office.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      office.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {office.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditOffice(office)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteOffice(office.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Office Details */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <p>{office.address}</p>
                    {office.city && (
                      <p className="text-gray-500">{office.city}, {office.state} {office.postal_code}</p>
                    )}
                  </div>
                </div>

                {office.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{office.phone}</span>
                  </div>
                )}

                {office.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{office.email}</span>
                  </div>
                )}

                {office.manager && (
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Manager: {office.manager.first_name} {office.manager.last_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Office Actions */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <Link
                    to={`/offices/${office.id}`}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Link>
                  <Link
                    to={`/offices/${office.id}/users`}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Manage Users
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            showItemsPerPage={true}
            itemsPerPageOptions={[5, 10, 25, 50]}
          />
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No offices found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first office'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Office
            </button>
          )}
        </div>
      )}

      {/* Stats Summary */}
      {Array.isArray(offices) && offices.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Office Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{offices.length}</div>
              <div className="text-sm text-blue-600">Total Offices</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {offices.filter(o => o.is_active).length}
              </div>
              <div className="text-sm text-green-600">Active Offices</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {offices.filter(o => !o.is_active).length}
              </div>
              <div className="text-sm text-orange-600">Inactive Offices</div>
            </div>
          </div>
        </div>
      )}

      {/* Create Office Modal */}
      <CreateOfficeModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSuccess={handleCreateOfficeSuccess}
      />

      {/* Edit Office Modal */}
      <OfficeForm
        office={editingOffice}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSuccess={handleEditOfficeSuccess}
      />
    </div>
  );
};

export default Offices;
