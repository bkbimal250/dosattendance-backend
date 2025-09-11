import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Filter, Search, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI } from '../services/api';
import { formatISTTime } from '../utils/timeUtils';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [priorityFilter, setPriorityFilter] = useState('all'); // all, low, medium, high, urgent
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen]);

  useEffect(() => {
    // Set up periodic updates
    const interval = setInterval(() => {
      if (isOpen) {
        fetchUnreadCount();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteExpired = async () => {
    try {
      await notificationsAPI.deleteExpired();
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting expired notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'leave_approval': <CheckCircle className="w-5 h-5 text-green-600" />,
      'leave_rejection': <AlertCircle className="w-5 h-5 text-red-600" />,
      'attendance_anomaly': <Clock className="w-5 h-5 text-orange-600" />,
      'document_shared': <Info className="w-5 h-5 text-blue-600" />,
      'system': <Info className="w-5 h-5 text-gray-600" />,
      'chat_message': <Bell className="w-5 h-5 text-purple-600" />,
      'announcement': <AlertCircle className="w-5 h-5 text-yellow-600" />,
      'device_offline': <AlertCircle className="w-5 h-5 text-red-600" />,
      'sync_failed': <AlertCircle className="w-5 h-5 text-red-600" />,
      'sync_success': <CheckCircle className="w-5 h-5 text-green-600" />,
    };
    return iconMap[type] || <Info className="w-5 h-5 text-gray-600" />;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: 'bg-blue-100 text-blue-800', text: 'Low' },
      medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800', text: 'High' },
      urgent: { color: 'bg-red-100 text-red-800', text: 'Urgent' },
    };
    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && notification.is_read) return false;
    if (filter === 'read' && !notification.is_read) return false;

    // Filter by priority
    if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;

    // Filter by type
    if (typeFilter !== 'all' && notification.notification_type !== typeFilter) return false;

    // Filter by search term
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    return true;
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      // Navigate to the action URL
      window.location.href = notification.action_url;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Types</option>
              <option value="announcement">Announcement</option>
              <option value="leave_approval">Leave Approval</option>
              <option value="leave_rejection">Leave Rejection</option>
              <option value="attendance_anomaly">Attendance</option>
              <option value="document_shared">Document</option>
              <option value="system">System</option>
              <option value="device_offline">Device</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              <Check className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
            <button
              onClick={deleteExpired}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clean Expired</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="w-12 h-12 mb-2" />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getPriorityBadge(notification.priority)}
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatISTTime(notification.created_at, 'time')}
                        </span>
                        
                        {notification.action_text && (
                          <span className="text-xs text-blue-600 hover:text-blue-800">
                            {notification.action_text} →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredNotifications.length} notifications</span>
            <span>{unreadCount} unread</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
