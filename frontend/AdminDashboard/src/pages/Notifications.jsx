import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { 
  Bell,
  Check,
  Trash2,
  Filter,
  Search,
  MoreVertical,
  Clock,
  User,
  Calendar,
  FileText,
  MessageSquare,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Settings,
  Archive
} from 'lucide-react';
import { notificationsAPI } from '../services/api';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔄 Notifications: Starting to fetch notifications data...');
      
      const response = await notificationsAPI.getNotifications();
      console.log('📊 Notifications: API Response Received:');
      console.log('🔔 Notifications API Response:', {
        data: response.data,
        status: response.status,
        headers: response.headers,
        count: Array.isArray(response.data) ? response.data.length : 'Not an array'
      });
      
      const notificationsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.results || response.data?.data || [];
      
      console.log('🔔 Notifications: Processed notifications data:', {
        original: response.data,
        processed: notificationsData,
        totalRecords: notificationsData.length,
        typeBreakdown: notificationsData.reduce((acc, notification) => {
          acc[notification.type] = (acc[notification.type] || 0) + 1;
          return acc;
        }, {}),
        priorityBreakdown: notificationsData.reduce((acc, notification) => {
          acc[notification.priority] = (acc[notification.priority] || 0) + 1;
          return acc;
        }, {}),
        readCount: notificationsData.filter(n => n.is_read).length,
        unreadCount: notificationsData.filter(n => !n.is_read).length
      });
      
      setNotifications(notificationsData);
      console.log('✅ Notifications: All data processed and state updated successfully');
    } catch (error) {
      console.error('❌ Notifications: Error fetching notifications:', error);
      console.error('❌ Notifications: Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setNotifications([]);
    } finally {
      setLoading(false);
      console.log('🏁 Notifications: Loading completed');
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
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type, category) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-danger-600" />;
      case 'info':
      default:
        switch (category) {
          case 'leave':
            return <Calendar className="w-5 h-5 text-primary-600" />;
          case 'document':
            return <FileText className="w-5 h-5 text-info-600" />;
          case 'meeting':
            return <Clock className="w-5 h-5 text-warning-600" />;
          case 'message':
            return <MessageSquare className="w-5 h-5 text-primary-600" />;
          case 'attendance':
            return <User className="w-5 h-5 text-success-600" />;
          default:
            return <Info className="w-5 h-5 text-info-600" />;
        }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'warning';
      case 'normal':
      default:
        return 'secondary';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationTime.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'read' && notification.is_read) ||
      (filterStatus === 'unread' && !notification.is_read);
    const matchesSearch = (notification.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (notification.message || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    urgent: notifications.filter(n => n.priority === 'urgent').length,
    today: notifications.filter(n => {
      const today = new Date().toDateString();
      const notificationDate = new Date(n.created_at).toDateString();
      return today === notificationDate;
    }).length
  };

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
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-text-secondary">Stay updated with important messages and alerts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift">
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Total</p>
                <p className="text-2xl font-bold text-text-primary">{notificationStats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-100">
                <Bell className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="hover-lift">
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Unread</p>
                <p className="text-2xl font-bold text-text-primary">{notificationStats.unread}</p>
              </div>
              <div className="p-3 rounded-lg bg-warning-100">
                <AlertCircle className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="hover-lift">
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Urgent</p>
                <p className="text-2xl font-bold text-text-primary">{notificationStats.urgent}</p>
              </div>
              <div className="p-3 rounded-lg bg-danger-100">
                <XCircle className="w-6 h-6 text-danger-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="hover-lift">
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary mb-1">Today</p>
                <p className="text-2xl font-bold text-text-primary">{notificationStats.today}</p>
              </div>
              <div className="p-3 rounded-lg bg-success-100">
                <Clock className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-text-primary">All Notifications</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-text-secondary" />
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-border-light rounded-lg px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="info">Info</option>
                </select>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-border-light rounded-lg px-3 py-1 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border-light rounded-lg text-sm w-48"
                />
              </div>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${
                    notification.is_read 
                      ? 'bg-white border-border-light' 
                      : 'bg-primary-50 border-primary-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type, notification.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-text-primary">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <Badge variant="primary" size="sm">New</Badge>
                          )}
                          <Badge variant={getPriorityColor(notification.priority)} size="sm">
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-text-muted">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{notification.sender}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(notification.created_at)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {!notification.is_read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-success-600 hover:text-success-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-danger-600 hover:text-danger-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto mb-4 text-text-muted" />
                <p className="text-text-secondary">No notifications found</p>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Notifications;
