import { Bell, Check, CheckCheck, Bug, AlertTriangle, MessageCircle, Award, BookOpen, Settings, Lock, Unlock, Megaphone, TrendingUp, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Notification,
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getAllActiveBugReports,
  getCurrentSystemAnnouncements,
  getActiveFeatureShutdowns,
} from '../services/notificationService';
import { updatesService, Update } from '../services/updatesService';

export default function NotificationsPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [activeBugReports, setActiveBugReports] = useState<any[]>([]);
  const [systemAnnouncements, setSystemAnnouncements] = useState<any[]>([]);
  const [featureShutdowns, setFeatureShutdowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatesExpanded, setUpdatesExpanded] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserNotifications(currentUser.uid, (notifs) => {
      console.log('📬 Notifications received:', notifs.length, notifs);
      setNotifications(notifs);
      setLoading(false);
    });

    loadSystemEvents();

    const interval = setInterval(loadSystemEvents, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [currentUser]);

  async function loadSystemEvents() {
    const [bugs, announcements, shutdowns, recentUpdates] = await Promise.all([
      getAllActiveBugReports(),
      getCurrentSystemAnnouncements(),
      getActiveFeatureShutdowns(),
      updatesService.getRecentUpdates(30),
    ]);

    setActiveBugReports(bugs);
    setSystemAnnouncements(announcements);
    setFeatureShutdowns(shutdowns);
    setUpdates(recentUpdates);
  }

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsAsRead(currentUser.uid);
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id!);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system_update':
      case 'new_feature':
        return <TrendingUp className="w-5 h-5" />;
      case 'system_announcement':
        return <Megaphone className="w-5 h-5" />;
      case 'bug_report_new':
      case 'bug_report_comment':
      case 'bug_report_status':
        return <Bug className="w-5 h-5" />;
      case 'feature_shutdown':
        return <Lock className="w-5 h-5" />;
      case 'feature_restore':
        return <Unlock className="w-5 h-5" />;
      case 'community_message':
      case 'private_message':
      case 'group_message':
      case 'support_message':
        return <MessageCircle className="w-5 h-5" />;
      case 'points_awarded':
      case 'daily_login':
      case 'achievement':
        return <Award className="w-5 h-5" />;
      case 'new_course':
      case 'course_update':
      case 'course_completion':
      case 'exam_reminder':
      case 'learning_reminder':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string, priority?: string) => {
    if (priority === 'urgent') return 'from-red-500 to-red-600';
    if (priority === 'high') return 'from-orange-500 to-orange-600';

    switch (type) {
      case 'system_update':
      case 'new_feature':
        return 'from-blue-500 to-blue-600';
      case 'system_announcement':
        return 'from-purple-500 to-purple-600';
      case 'bug_report_new':
      case 'bug_report_comment':
      case 'bug_report_status':
        return 'from-yellow-500 to-yellow-600';
      case 'feature_shutdown':
        return 'from-red-500 to-red-600';
      case 'feature_restore':
        return 'from-green-500 to-green-600';
      case 'points_awarded':
      case 'daily_login':
      case 'achievement':
        return 'from-green-500 to-green-600';
      case 'new_course':
      case 'course_completion':
        return 'from-[#D71920] to-[#B91518]';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-gray-600">
                You have <span className="font-bold text-[#D71920]">{unreadCount}</span> unread notification{unreadCount !== 1 && 's'}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
            >
              <CheckCheck className="w-5 h-5" />
              <span className="hidden sm:inline">Mark All Read</span>
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition ${activeTab === 'all' ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap transition ${activeTab === 'updates' ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            <Sparkles className="w-4 h-4" />
            What's New
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition ${activeTab === 'notifications' ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Notifications
          </button>
        </div>

        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'updates') && updates.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border-2 border-blue-200">
              <button
                onClick={() => setUpdatesExpanded(!updatesExpanded)}
                className="w-full flex items-center justify-between gap-3 mb-4 hover:opacity-80 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">What's New - Latest Updates</h2>
                </div>
                {updatesExpanded ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
              </button>

              {updatesExpanded && (
                <div className="space-y-3">
                  {updates.map((update) => (
                    <div key={update.id} className="glass-card rounded-xl p-4 border border-blue-200">
                      <div className="flex flex-col sm:flex-row items-start gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${updatesService.getUpdateColor(update.type)} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                          <span className="text-lg">{updatesService.getUpdateIcon(update.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 break-words">{update.title}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-900 rounded-full font-bold uppercase w-fit">
                                {update.type}
                              </span>
                              {update.version && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-mono w-fit">
                                  v{update.version}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2 break-words">{update.description}</p>
                          <p className="text-xs text-gray-500 break-words">
                            {update.createdAt.toDate().toLocaleDateString()} • {update.createdAt.toDate().toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'notifications') && featureShutdowns.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Active Feature Restrictions</h2>
              </div>
              <div className="space-y-3">
                {featureShutdowns.map((shutdown: any) => (
                  <div key={shutdown.id} className="glass-card rounded-xl p-4 border border-red-200">
                    <h3 className="font-bold text-red-900 mb-1">{shutdown.featureName || 'Feature'} - Temporarily Disabled</h3>
                    <p className="text-sm text-red-700">{shutdown.reason || 'Maintenance in progress'}</p>
                    {shutdown.estimatedRestoreTime && (
                      <p className="text-xs text-red-600 mt-2">
                        Estimated restore: {new Date(shutdown.estimatedRestoreTime.toDate()).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'notifications') && systemAnnouncements.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">System Announcements</h2>
              </div>
              <div className="space-y-3">
                {systemAnnouncements.map((announcement: any) => (
                  <div key={announcement.id} className="glass-card rounded-xl p-4 border border-purple-200">
                    <h3 className="font-bold text-purple-900 mb-1">{announcement.title || 'Announcement'}</h3>
                    <p className="text-sm text-purple-700">{announcement.message || announcement.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'notifications') && activeBugReports.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white">
                  <Bug className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Active Bug Reports ({activeBugReports.length})</h2>
              </div>
              <div className="space-y-3">
                {activeBugReports.slice(0, 5).map((bug: any) => (
                  <motion.div
                    key={bug.id}
                    className="glass-card rounded-xl p-4 border border-yellow-200 cursor-pointer hover:backdrop-blur-xl transition"
                    onClick={() => navigate(`/support?bugId=${bug.id}`)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-yellow-900 mb-1">{bug.title}</h3>
                        <p className="text-sm text-yellow-700 line-clamp-2">{bug.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full font-bold">
                            {bug.status?.toUpperCase()}
                          </span>
                          <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full font-bold">
                            {bug.priority?.toUpperCase()}
                          </span>
                          <span className="text-xs text-yellow-600">
                            {bug.reportedByName}
                          </span>
                        </div>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    </div>
                  </motion.div>
                ))}
                {activeBugReports.length > 5 && (
                  <button
                    onClick={() => navigate('/support')}
                    className="w-full py-2 text-yellow-700 font-bold hover:text-yellow-900 transition"
                  >
                    View all {activeBugReports.length} bug reports →
                  </button>
                )}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'notifications') && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-[#D71920]" />
                  Your Notifications ({notifications.length})
                </h2>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-md"
                  >
                    <CheckCheck className="w-4 h-4 inline mr-2" />
                    Mark All Read
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className={`glass-card rounded-xl p-4 border-2 transition cursor-pointer ${
                        notification.read
                          ? 'border-white/40 opacity-75'
                          : 'border-[#D71920]/20 shadow-md'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${getNotificationColor(
                            notification.type,
                            notification.priority
                          )} rounded-full flex items-center justify-center text-white flex-shrink-0`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold mb-2 ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'} mb-2`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>
                              {notification.createdAt
                                ? new Date(notification.createdAt.toDate()).toLocaleString()
                                : 'Just now'}
                            </span>
                            {notification.priority && notification.priority !== 'low' && (
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold ${
                                  notification.priority === 'urgent'
                                    ? 'bg-red-100 text-red-700'
                                    : notification.priority === 'high'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {notification.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
