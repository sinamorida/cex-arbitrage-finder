import React, { useState, useEffect } from 'react';
import { 
  Notification, 
  NotificationPriority, 
  NotificationType, 
  globalNotificationSystem 
} from '../utils/notificationSystem';

interface NotificationPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onToggle }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // اضافه کردن listener برای به‌روزرسانی اعلان‌ها
    const handleNotificationsUpdate = (newNotifications: Notification[]) => {
      setNotifications(newNotifications);
      setUnreadCount(globalNotificationSystem.getUnreadCount());
    };

    globalNotificationSystem.addListener(handleNotificationsUpdate);
    
    // بارگذاری اولیه
    setNotifications(globalNotificationSystem.getNotifications());
    setUnreadCount(globalNotificationSystem.getUnreadCount());

    return () => {
      globalNotificationSystem.removeListener(handleNotificationsUpdate);
    };
  }, []);

  const getPriorityColor = (priority: NotificationPriority): string => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'border-red-500 bg-red-900/20';
      case NotificationPriority.HIGH:
        return 'border-orange-500 bg-orange-900/20';
      case NotificationPriority.MEDIUM:
        return 'border-yellow-500 bg-yellow-900/20';
      case NotificationPriority.LOW:
        return 'border-blue-500 bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getTypeIcon = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.HIGH_PROFIT:
        return '💰';
      case NotificationType.NEW_OPPORTUNITY:
        return '🔔';
      case NotificationType.FLASH_OPPORTUNITY:
        return '⚡';
      case NotificationType.SYSTEM_ERROR:
        return '❌';
      case NotificationType.MARKET_CHANGE:
        return '📈';
      default:
        return '📢';
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'همین الان';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} دقیقه پیش`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعت پیش`;
    return new Date(timestamp).toLocaleDateString('fa-IR');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      globalNotificationSystem.markAsRead(notification.id);
    }
  };

  const handleMarkAllRead = () => {
    globalNotificationSystem.markAllAsRead();
  };

  const handleClearAll = () => {
    globalNotificationSystem.clearAll();
  };

  const handleRemoveNotification = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    globalNotificationSystem.removeNotification(notificationId);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={onToggle}
        className="relative p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        title="اعلان‌ها"
      >
        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge for unread count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute left-0 top-12 w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">اعلان‌ها</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  همه را خوانده شده علامت‌گذاری کن
                </button>
              )}
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>اعلانی وجود ندارد</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors ${
                    !notification.isRead ? 'bg-gray-700/30' : ''
                  }`}
                >
                  <div className={`border-r-4 pr-3 ${getPriorityColor(notification.priority)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-white">{notification.title}</h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{formatTime(notification.timestamp)}</p>
                          
                          {/* Opportunity Details */}
                          {notification.opportunity && (
                            <div className="mt-2 p-2 bg-gray-600/50 rounded text-xs">
                              <div className="flex justify-between">
                                <span>جفت ارز: {notification.opportunity.pair}</span>
                                <span className="text-green-400">
                                  +{notification.opportunity.type === 'statistical' || notification.opportunity.type === 'pairs' 
                                    ? notification.opportunity.expectedReturn.toFixed(2)
                                    : notification.opportunity.profitPercentage.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={(e) => handleRemoveNotification(notification.id, e)}
                        className="text-gray-500 hover:text-red-400 ml-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700 text-center">
              <button
                onClick={handleClearAll}
                className="text-sm text-red-400 hover:text-red-300"
              >
                پاک کردن همه اعلان‌ها
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;