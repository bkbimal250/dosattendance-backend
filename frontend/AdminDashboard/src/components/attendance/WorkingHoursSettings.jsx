import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../ui';
import { 
  Clock, Calendar, Settings, Save, Edit, 
  AlertTriangle, Timer, Building, Users
} from 'lucide-react';

const WorkingHoursSettings = () => {
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [settings, setSettings] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchOffices();
  }, []);

  useEffect(() => {
    if (selectedOffice) {
      fetchWorkingHoursSettings(selectedOffice.id);
    }
  }, [selectedOffice]);

  const fetchOffices = async () => {
    try {
      const response = await fetch('/api/offices/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOffices(data);
        if (data.length > 0) {
          setSelectedOffice(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching offices:', error);
      setMessage({ type: 'error', text: 'Failed to fetch offices' });
    }
  };

  const fetchWorkingHoursSettings = async (officeId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/working-hours-settings/?office=${officeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setSettings(data[0]);
        } else {
          // Create default settings
          setSettings({
            office: officeId,
            standard_hours: 9.0,
            start_time: '10:00:00',
            end_time: '19:00:00',
            late_threshold: 15,
            half_day_threshold: 300,
            late_coming_threshold: '11:30:00'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching working hours settings:', error);
      setMessage({ type: 'error', text: 'Failed to fetch settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const url = settings.id 
        ? `/api/working-hours-settings/${settings.id}/`
        : '/api/working-hours-settings/';
      
      const method = settings.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        const savedSettings = await response.json();
        setSettings(savedSettings);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: `Failed to save: ${errorData.error || 'Unknown error'}` });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  const parseTime = (timeString) => {
    if (!timeString) return '10:00:00';
    return timeString.includes(':') ? `${timeString}:00` : `${timeString}:00:00`;
  };

  const getOfficeStats = (office) => {
    // This would typically come from an API endpoint
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      avgAttendance: 0
    };
  };

  if (loading && !settings.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Working Hours Settings</h2>
          <p className="text-gray-600">Configure attendance rules and working hours for each office</p>
        </div>
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Office Configuration</span>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Office Selection */}
      <Card className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Office
          </label>
          <select
            value={selectedOffice?.id || ''}
            onChange={(e) => {
              const office = offices.find(o => o.id === e.target.value);
              setSelectedOffice(office);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {offices.map(office => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        </div>

        {selectedOffice && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Building className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Office</p>
                  <p className="text-lg font-semibold text-blue-900">{selectedOffice.name}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-600">Total Employees</p>
                  <p className="text-lg font-semibold text-green-900">
                    {getOfficeStats(selectedOffice).totalEmployees}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-purple-600">Avg Attendance</p>
                  <p className="text-lg font-semibold text-purple-900">
                    {getOfficeStats(selectedOffice).avgAttendance}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Working Hours Settings */}
      {selectedOffice && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Working Hours Configuration</h3>
              <p className="text-sm text-gray-600">
                Configure standard working hours and attendance rules for {selectedOffice.name}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Working Hours */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Standard Working Hours
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard Hours per Day
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={settings.standard_hours || 9.0}
                  onChange={(e) => handleInputChange('standard_hours', parseFloat(e.target.value))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Hours per working day</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formatTime(settings.start_time)}
                  onChange={(e) => handleInputChange('start_time', parseTime(e.target.value))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Standard check-in time</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={formatTime(settings.end_time)}
                  onChange={(e) => handleInputChange('end_time', parseTime(e.target.value))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Standard check-out time</p>
              </div>
            </div>

            {/* Attendance Rules */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Attendance Rules
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Late Coming Threshold
                </label>
                <input
                  type="time"
                  value={formatTime(settings.late_coming_threshold)}
                  onChange={(e) => handleInputChange('late_coming_threshold', parseTime(e.target.value))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Time after which check-in is considered late</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Half Day Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={settings.half_day_threshold || 300}
                  onChange={(e) => handleInputChange('half_day_threshold', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Minutes to consider half day (currently: {Math.round((settings.half_day_threshold || 300) / 60 * 10) / 10} hours)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Late Threshold (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.late_threshold || 15}
                  onChange={(e) => handleInputChange('late_threshold', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Minutes after start time to consider someone late</p>
              </div>
            </div>
          </div>

          {/* Current Configuration Summary */}
          {!isEditing && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Current Configuration</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Working Hours:</span>
                  <div className="font-medium">{settings.standard_hours || 9.0} hours/day</div>
                </div>
                <div>
                  <span className="text-gray-500">Time Range:</span>
                  <div className="font-medium">
                    {formatTime(settings.start_time)} - {formatTime(settings.end_time)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Late Coming:</span>
                  <div className="font-medium">{formatTime(settings.late_coming_threshold)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Half Day:</span>
                  <div className="font-medium">
                    {Math.round((settings.half_day_threshold || 300) / 60 * 10) / 10} hours
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Information Panel */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-lg font-medium text-blue-900 mb-2">How These Settings Work</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Standard Hours:</strong> The expected working hours per day (e.g., 9 hours)</p>
              <p><strong>Start/End Time:</strong> The standard check-in and check-out times for the office</p>
              <p><strong>Late Coming Threshold:</strong> Employees checking in after this time will be marked as late</p>
              <p><strong>Half Day Threshold:</strong> Employees working less than this time will be marked as half-day</p>
              <p><strong>Late Threshold:</strong> Minutes after start time to consider someone late</p>
            </div>
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>Example:</strong> With current settings, an employee checking in at 12:00 PM would be marked as late 
                (after 11:30 AM), and working 4 hours would be marked as half-day (less than 5 hours).
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WorkingHoursSettings;
