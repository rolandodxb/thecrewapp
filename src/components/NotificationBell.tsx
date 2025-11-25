import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Notification,
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs.slice(0, 10));
      const unread = notifs.filter((n) => !n.read).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id!);
    }
    setIsOpen(false);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (currentUser) {
      await markAllNotificationsAsRead(currentUser.uid);
    }
  };

  const getNotificationColor = (type: string, priority?: string) => {
    if (priority === 'urgent') return 'from-red-500 to-red-600';
    if (priority === 'high') return 'from-orange-500 to-orange-600';

    switch (type) {
      case 'success':
        return 'from-green-500 to-green-600';
      case 'warning':
        return 'from-yellow-500 to-yellow-600';
      case 'error':
        return 'from-red-500 to-red-600';
      case 'message':
        return 'from-blue-500 to-blue-600';
      case 'system':
        return 'from-gray-500 to-gray-600';
      default:
        return 'from-[#D71920] to-[#B91518]';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-white/20 transition"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center text-white text-xs font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 max-h-[32rem] glass-card rounded-2xl shadow-2xl border-2 border-white/40 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/20 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs px-3 py-1 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg font-bold hover:shadow-md transition"
                  >
                    <CheckCheck className="w-4 h-4 inline mr-1" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/20">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      className={`p-4 cursor-pointer transition ${
                        !notification.read ? 'bg-white/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${getNotificationColor(
                            notification.type,
                            notification.priority
                          )} rounded-full flex items-center justify-center text-white flex-shrink-0`}
                        >
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4
                              className={`font-bold text-sm ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-[#D71920] rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                          <span className="text-xs text-gray-500 mt-1 block">
                            {notification.createdAt
                              ? formatTimestamp(new Date(notification.createdAt.toDate()))
                              : 'Just now'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/20 bg-white/5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                  className="w-full text-center text-sm font-bold text-[#D71920] hover:text-[#B91518] transition"
                >
                  View all notifications →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
