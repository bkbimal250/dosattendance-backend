import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  User,
  Lock,
  Bell,
  Shield,
  Palette,
  Globe,
  Download,
  Upload,
  Trash2,
  Save,
  Edit,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Key,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import { usersAPI } from '../services/api';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    department: user?.department?.name || '',
    position: user?.position || '',
    bio: user?.bio || ''
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    attendance_reminders: true,
    leave_updates: true,
    document_uploads: true,
    meeting_reminders: true,
    system_alerts: true
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_email: true,
    show_phone: false,
    show_address: false,
    allow_messages: true,
    allow_friend_requests: true
  });

  // Theme settings
  const [themeSettings, setThemeSettings] = useState({
    theme: 'light',
    color_scheme: 'blue',
    font_size: 'medium',
    compact_mode: false
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await usersAPI.updateProfile(profileData);
      console.log('Update Profile API Response:', response.data);
      setLoading(false);
      // Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await usersAPI.changePassword(passwordData);
      console.log('Change Password API Response:', response.data);
      setLoading(false);
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      // Show success message
    } catch (error) {
      console.error('Error changing password:', error);
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.deleteAccount();
      console.log('Delete Account API Response:', response.data);
      setLoading(false);
      setShowDeleteModal(false);
      logout();
    } catch (error) {
      console.error('Error deleting account:', error);
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Export', icon: Download }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary">Manage your account preferences and settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <Card.Body className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                          : 'text-text-secondary hover:text-text-primary hover:bg-secondary-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card.Body>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-text-primary">Profile Information</h2>
                <p className="text-text-secondary">Update your personal information and profile details</p>
              </Card.Header>
              <Card.Body>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-primary-600" />
                      </div>
                      <button
                        type="button"
                        className="absolute -bottom-1 -right-1 p-1 bg-primary-600 text-white rounded-full hover:bg-primary-700"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{user?.username}</h3>
                      <p className="text-text-secondary">{user?.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                        className="w-full border border-border-light rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                        className="w-full border border-border-light rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full border border-border-light rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full border border-border-light rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={profileData.address}
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        className="w-full border border-border-light rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        value={profileData.department}
                        onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                        className="w-full border border-border-light rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        value={profileData.position}
                        onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                        className="w-full border border-border-light rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={4}
                        className="w-full border border-border-light rounded-lg px-3 py-2 resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-text-primary">Security Settings</h2>
                <p className="text-text-secondary">Manage your password and security preferences</p>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                    <div>
                      <h3 className="font-medium text-text-primary">Password</h3>
                      <p className="text-sm text-text-secondary">Last changed 30 days ago</p>
                    </div>
                    <Button onClick={() => setShowPasswordModal(true)}>
                      <Key className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                    <div>
                      <h3 className="font-medium text-text-primary">Two-Factor Authentication</h3>
                      <p className="text-sm text-text-secondary">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline">
                      <Shield className="w-4 h-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                    <div>
                      <h3 className="font-medium text-text-primary">Login Sessions</h3>
                      <p className="text-sm text-text-secondary">Manage active sessions</p>
                    </div>
                    <Button variant="outline">
                      <Globe className="w-4 h-4 mr-2" />
                      View Sessions
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-text-primary">Notification Preferences</h2>
                <p className="text-text-secondary">Choose how you want to receive notifications</p>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                        <div>
                          <h3 className="font-medium text-text-primary">
                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            Receive notifications for {key.split('_').join(' ')}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotificationSettings({...notificationSettings, [key]: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-text-primary">Privacy Settings</h2>
                <p className="text-text-secondary">Control your privacy and data sharing preferences</p>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={privacySettings.profile_visibility}
                      onChange={(e) => setPrivacySettings({...privacySettings, profile_visibility: e.target.value})}
                      className="w-full border border-border-light rounded-lg px-3 py-2"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="friends">Friends Only</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(privacySettings).filter(([key]) => key !== 'profile_visibility').map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                        <div>
                          <h3 className="font-medium text-text-primary">
                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            Allow others to see your {key.split('_').join(' ')}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setPrivacySettings({...privacySettings, [key]: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-text-primary">Appearance Settings</h2>
                <p className="text-text-secondary">Customize the look and feel of your dashboard</p>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Theme
                    </label>
                    <select
                      value={themeSettings.theme}
                      onChange={(e) => setThemeSettings({...themeSettings, theme: e.target.value})}
                      className="w-full border border-border-light rounded-lg px-3 py-2"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Color Scheme
                    </label>
                    <div className="grid grid-cols-4 gap-4">
                      {['blue', 'green', 'purple', 'orange'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setThemeSettings({...themeSettings, color_scheme: color})}
                          className={`w-12 h-12 rounded-lg border-2 ${
                            themeSettings.color_scheme === color ? 'border-primary-600' : 'border-border-light'
                          } bg-${color}-500`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Font Size
                    </label>
                    <select
                      value={themeSettings.font_size}
                      onChange={(e) => setThemeSettings({...themeSettings, font_size: e.target.value})}
                      className="w-full border border-border-light rounded-lg px-3 py-2"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                    <div>
                      <h3 className="font-medium text-text-primary">Compact Mode</h3>
                      <p className="text-sm text-text-secondary">Reduce spacing for a more compact layout</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={themeSettings.compact_mode}
                        onChange={(e) => setThemeSettings({...themeSettings, compact_mode: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Data & Export Settings */}
          {activeTab === 'data' && (
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-text-primary">Data & Export</h2>
                <p className="text-text-secondary">Manage your data and export options</p>
              </Card.Header>
              <Card.Body>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                    <div>
                      <h3 className="font-medium text-text-primary">Export Data</h3>
                      <p className="text-sm text-text-secondary">Download all your data in JSON format</p>
                    </div>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border-light rounded-lg">
                    <div>
                      <h3 className="font-medium text-text-primary">Import Data</h3>
                      <p className="text-sm text-text-secondary">Import data from a JSON file</p>
                    </div>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-danger-200 rounded-lg bg-danger-50">
                    <div>
                      <h3 className="font-medium text-danger-700">Delete Account</h3>
                      <p className="text-sm text-danger-600">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Change Password</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPasswordModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                  className="w-full border border-border-light rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  className="w-full border border-border-light rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="w-full border border-border-light rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-danger-600" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Delete Account</h3>
              <p className="text-text-secondary mb-6">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </p>
              <div className="flex items-center justify-center space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
